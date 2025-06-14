
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, MongoCollaborationRequestDocument, CollaborationRequest, MongoUserDocument } from '@/types';
import type { Collection, Db } from 'mongodb'; // Added Db
import { ObjectId as MObjectId } from 'mongodb';
import { z } from 'zod';
import { createNotification } from '@/lib/notificationUtils'; // Added import

interface AuthenticatedRequest extends NextRequest {
  user?: { userId: string; role: User['role']; email: string };
}

const updateRequestSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

function toClientRequest(mongoRequest: MongoCollaborationRequestDocument): CollaborationRequest {
  return {
    id: mongoRequest._id.toString(),
    investorId: mongoRequest.investorId.toString(),
    investorName: mongoRequest.investorName,
    investorBioSnippet: mongoRequest.investorBioSnippet,
    entrepreneurId: mongoRequest.entrepreneurId.toString(),
    entrepreneurName: mongoRequest.entrepreneurName,
    entrepreneurStartup: mongoRequest.entrepreneurStartup,
    status: mongoRequest.status,
    requestedAt: mongoRequest.requestedAt.toISOString(),
    message: mongoRequest.message,
  };
}

async function updateCollaborationRequestHandler(
  req: AuthenticatedRequest,
  { params }: { params: { requestId: string } }
) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  if (req.user.role !== 'entrepreneur') {
    return NextResponse.json({ message: 'Only entrepreneurs can update requests' }, { status: 403 });
  }

  const { requestId } = params;
  if (!MObjectId.isValid(requestId)) {
    return NextResponse.json({ message: 'Invalid request ID format' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const validationResult = updateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: 'Validation failed', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const { status } = validationResult.data;

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db: Db = client.db(dbName); // Added Db type
    const requestsCollection: Collection<MongoCollaborationRequestDocument> = db.collection('collaborationRequests');
    const usersCollection: Collection<MongoUserDocument> = db.collection('users');

    const requestToUpdate = await requestsCollection.findOne({ _id: new MObjectId(requestId) });

    if (!requestToUpdate) {
      return NextResponse.json({ message: 'Collaboration request not found' }, { status: 404 });
    }

    if (requestToUpdate.entrepreneurId.toString() !== req.user.userId) {
      return NextResponse.json({ message: 'Forbidden: You cannot update this request' }, { status: 403 });
    }

    if (requestToUpdate.status !== 'pending') {
      return NextResponse.json({ message: `Request is already ${requestToUpdate.status} and cannot be changed.` }, { status: 400 });
    }

    const updateResult = await requestsCollection.updateOne(
      { _id: new MObjectId(requestId) },
      { $set: { status: status } }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ message: 'Collaboration request not found during update' }, { status: 404 });
    }

    const updatedRequestDoc = await requestsCollection.findOne({ _id: new MObjectId(requestId) });
    if (!updatedRequestDoc) {
         return NextResponse.json({ message: 'Failed to retrieve updated request' }, { status: 500 });
    }

    // Create notification for the investor
    const entrepreneurUserDoc = await usersCollection.findOne({ _id: updatedRequestDoc.entrepreneurId });
    if (entrepreneurUserDoc) {
        await createNotification({
            db,
            userId: updatedRequestDoc.investorId,
            type: status === 'accepted' ? 'request_accepted' : 'request_rejected',
            message: `${entrepreneurUserDoc.name} ${status} your collaboration request.`,
            link: status === 'accepted' ? `/dashboard/chat/${updatedRequestDoc.entrepreneurId.toString()}` : `/dashboard/profile/user/${updatedRequestDoc.entrepreneurId.toString()}`,
            actorId: entrepreneurUserDoc._id,
            actorName: entrepreneurUserDoc.name,
            actorAvatarUrl: entrepreneurUserDoc.avatarUrl,
        });
    }

    return NextResponse.json(toClientRequest(updatedRequestDoc), { status: 200 });

  } catch (error) {
    console.error('Update collaboration request error:', error);
    let message = 'An unexpected error occurred.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(req: AuthenticatedRequest, { params }: { params: { requestId: string } }) {
  return verifyAuth(req, (authenticatedReq) => updateCollaborationRequestHandler(authenticatedReq, { params }));
}
