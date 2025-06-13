
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, MongoChatMessageDocument, ChatMessage } from '@/types';
import type { Collection } from 'mongodb';
import { ObjectId as MObjectId } from 'mongodb';
import { z } from 'zod';

interface AuthenticatedRequest extends NextRequest {
  user?: { userId: string; role: User['role']; email: string };
}

const sendMessageSchema = z.object({
  receiverId: z.string().refine((val) => MObjectId.isValid(val), { message: "Invalid receiver ID" }),
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message is too long"),
});

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


async function postMessageHandler(req: AuthenticatedRequest) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validationResult = sendMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: 'Validation failed', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { receiverId, message } = validationResult.data;
    const senderId = req.user.userId;

    if (senderId === receiverId) {
      return NextResponse.json({ message: 'Cannot send messages to yourself.' }, { status: 400 });
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const messagesCollection: Collection<Omit<MongoChatMessageDocument, '_id'>> = db.collection('messages');
    
    // Optional: Verify receiverId exists in users collection
    // const usersCollection = db.collection('users');
    // const receiverExists = await usersCollection.findOne({ _id: new MObjectId(receiverId) });
    // if (!receiverExists) {
    //   return NextResponse.json({ message: 'Receiver not found.' }, { status: 404 });
    // }

    const newMessage: Omit<MongoChatMessageDocument, '_id'> = {
      senderId: new MObjectId(senderId),
      receiverId: new MObjectId(receiverId),
      message,
      timestamp: new Date(),
      isRead: false, // Default to false
    };

    const result = await messagesCollection.insertOne(newMessage);

    if (!result.insertedId) {
      return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
    }
    
    const createdMessageForClient: ChatMessage = {
      id: result.insertedId.toString(),
      senderId: senderId,
      receiverId: receiverId,
      message: message,
      timestamp: newMessage.timestamp.toISOString(),
      isRead: newMessage.isRead,
    };

    return NextResponse.json(createdMessageForClient, { status: 201 });

  } catch (error) {
    console.error('Send message error:', error);
    let errorMsg = 'An unexpected error occurred while sending the message.';
    if (error instanceof Error) errorMsg = error.message;
    return NextResponse.json({ message: errorMsg }, { status: 500 });
  }
}

export async function POST(req: AuthenticatedRequest) {
  return verifyAuth(req, postMessageHandler);
}
