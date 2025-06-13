import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, MongoChatMessageDocument, ChatMessage } from '@/types';
import type { Collection } from 'mongodb';
import { ObjectId as MObjectId } from 'mongodb';

interface AuthenticatedRequest extends NextRequest {
  user?: { userId: string; role: User['role']; email: string };
}

// Helper to convert Mongo document to client-facing message
function toClientMessage(mongoMessage: MongoChatMessageDocument): ChatMessage {
  return {
    id: mongoMessage._id.toString(),
    senderId: mongoMessage.senderId.toString(),
    receiverId: mongoMessage.receiverId.toString(),
    message: mongoMessage.message,
    timestamp: mongoMessage.timestamp.toISOString(),
    isRead: mongoMessage.isRead,
  };
}

async function getChatMessagesHandler(
  req: AuthenticatedRequest,
  { params }: { params: { chatPartnerId: string } }
) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const { chatPartnerId } = await params;
  if (!MObjectId.isValid(chatPartnerId)) {
    return NextResponse.json({ message: 'Invalid chat partner ID format' }, { status: 400 });
  }

  const authenticatedUserId = new MObjectId(req.user.userId);
  const partnerObjectId = new MObjectId(chatPartnerId);

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const messagesCollection: Collection<MongoChatMessageDocument> = db.collection('messages');

    const messagesDocs = await messagesCollection
      .find({
        $or: [
          { senderId: authenticatedUserId, receiverId: partnerObjectId },
          { senderId: partnerObjectId, receiverId: authenticatedUserId },
        ],
      })
      .sort({ timestamp: 1 }) // Fetch messages in chronological order
      .toArray();

    const clientMessages = messagesDocs.map(toClientMessage);

    return NextResponse.json(clientMessages, { status: 200 });

  } catch (error) {
    console.error('Get chat messages error:', error);
    let message = 'An unexpected error occurred while fetching messages.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(req: AuthenticatedRequest, { params }: { params: { chatPartnerId: string } }) {
  return verifyAuth(req, (authenticatedReq) => getChatMessagesHandler(authenticatedReq, { params }));
}