
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, MongoUserDocument, MongoCollaborationRequestDocument, CollaborationRequest } from '@/types';
import type { Collection, Db } from 'mongodb'; // ObjectId removed, Db added
import { ObjectId as MObjectId } from 'mongodb';
import { z } from 'zod';
import { createNotification } from '@/lib/notificationUtils'; // Added import

interface AuthenticatedRequest extends NextRequest {
  user?: { userId: string; role: User['role']; email: string };
}

const createRequestSchema = z.object({
  entrepreneurId: z.string().refine((val) => MObjectId.isValid(val), { message: "Invalid entrepreneur ID" }),
  message: z.string().min(10, "Message must be at least 10 characters").max(500, "Message is too long").optional(),
});

async function createCollaborationRequestHandler(req: AuthenticatedRequest) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  if (req.user.role !== 'investor') {
    return NextResponse.json({ message: 'Only investors can send collaboration requests' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validationResult = createRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: 'Validation failed', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { entrepreneurId, message } = validationResult.data;

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db: Db = client.db(dbName); // Added Db type
    const usersCollection: Collection<MongoUserDocument> = db.collection('users');
    const requestsCollection: Collection<MongoCollaborationRequestDocument> = db.collection('collaborationRequests');

    const entrepreneur = await usersCollection.findOne({ _id: new MObjectId(entrepreneurId), role: 'entrepreneur' });
    if (!entrepreneur) {
      return NextResponse.json({ message: 'Entrepreneur not found' }, { status: 404 });
    }

    const investor = await usersCollection.findOne({ _id: new MObjectId(req.user.userId) });
    if (!investor) {
      return NextResponse.json({ message: 'Investor profile not found' }, { status: 404 });
    }

    const existingRequest = await requestsCollection.findOne({
      investorId: new MObjectId(req.user.userId),
      entrepreneurId: new MObjectId(entrepreneurId),
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingRequest) {
      return NextResponse.json({ message: `A ${existingRequest.status} request already exists with this entrepreneur.` }, { status: 409 });
    }

    const newRequestDocument: Omit<MongoCollaborationRequestDocument, '_id'> = {
      investorId: new MObjectId(req.user.userId),
      investorName: investor.name,
      investorBioSnippet: investor.bio?.substring(0, 150) || "An interested investor.",
      entrepreneurId: new MObjectId(entrepreneurId),
      entrepreneurName: entrepreneur.name,
      entrepreneurStartup: entrepreneur.startupDescription,
      status: 'pending',
      requestedAt: new Date(),
      message: message || `Hi ${entrepreneur.name}, I'm interested in ${entrepreneur.startupDescription || 'your venture'} and would like to connect.`,
    };

    const result = await requestsCollection.insertOne(newRequestDocument as MongoCollaborationRequestDocument);

    if (!result.insertedId) {
      return NextResponse.json({ message: 'Failed to create collaboration request' }, { status: 500 });
    }
    
    // Create notification for the entrepreneur
    await createNotification({
        db,
        userId: entrepreneur._id, // entrepreneur's MongoDB ObjectId
        type: 'new_collaboration_request',
        message: `${investor.name} sent you a collaboration request.`,
        link: `/dashboard/entrepreneur`, // Or a more specific link if available
        actorId: investor._id,
        actorName: investor.name,
        actorAvatarUrl: investor.avatarUrl,
    });

    const createdRequest: CollaborationRequest = {
        id: result.insertedId.toString(),
        investorId: newRequestDocument.investorId.toString(),
        investorName: newRequestDocument.investorName,
        investorBioSnippet: newRequestDocument.investorBioSnippet,
        entrepreneurId: newRequestDocument.entrepreneurId.toString(),
        entrepreneurName: newRequestDocument.entrepreneurName,
        entrepreneurStartup: newRequestDocument.entrepreneurStartup,
        status: newRequestDocument.status,
        requestedAt: newRequestDocument.requestedAt.toISOString(),
        message: newRequestDocument.message
    }

    return NextResponse.json(createdRequest, { status: 201 });

  } catch (error) {
    console.error('Create collaboration request error:', error);
    let message = 'An unexpected error occurred.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: AuthenticatedRequest) {
  return verifyAuth(req, createCollaborationRequestHandler);
}
