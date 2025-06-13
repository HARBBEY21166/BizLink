
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, MongoCollaborationRequestDocument, CollaborationRequest } from '@/types';
import type { Collection } from 'mongodb';
import { ObjectId as MObjectId } from 'mongodb';

interface AuthenticatedRequest extends NextRequest {
  user?: { userId: string; role: User['role']; email: string };
}

// Helper to convert Mongo document to client-facing request
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

async function getSentRequestsHandler(req: AuthenticatedRequest) {
  const SCRIPT_NAME = 'getSentRequestsHandler /api/collaboration-requests/sent';
  console.time(SCRIPT_NAME);

  if (!req.user) {
    console.timeEnd(SCRIPT_NAME);
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  if (req.user.role !== 'investor') {
    console.timeEnd(SCRIPT_NAME);
    return NextResponse.json({ message: 'Only investors can view sent requests' }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const requestsCollection: Collection<MongoCollaborationRequestDocument> = db.collection('collaborationRequests');

    console.log(`[${SCRIPT_NAME}] Fetching sent requests for investorId: ${req.user.userId}`);
    const sentRequestDocs = await requestsCollection
      .find({ investorId: new MObjectId(req.user.userId) })
      .sort({ requestedAt: -1 }) // Sort by most recent
      .toArray();
    console.log(`[${SCRIPT_NAME}] Found ${sentRequestDocs.length} sent requests for investorId: ${req.user.userId}`);

    const clientRequests = sentRequestDocs.map(toClientRequest);
    
    console.timeEnd(SCRIPT_NAME);
    return NextResponse.json(clientRequests, { status: 200 });

  } catch (error) {
    console.error(`[${SCRIPT_NAME}] Get sent collaboration requests error:`, error);
    let message = 'An unexpected error occurred.';
    if (error instanceof Error) {
        message = error.message;
    }
    console.timeEnd(SCRIPT_NAME);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(req: AuthenticatedRequest) {
  return verifyAuth(req, getSentRequestsHandler);
}

