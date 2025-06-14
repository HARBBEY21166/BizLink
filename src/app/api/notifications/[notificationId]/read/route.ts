
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, MongoNotificationDocument } from '@/types';
import type { Collection, Db } from 'mongodb';
import { ObjectId as MObjectId } from 'mongodb';

interface AuthenticatedRequest extends NextRequest {
  user?: { userId: string; role: User['role']; email: string };
}

async function markNotificationAsReadHandler(
  req: AuthenticatedRequest,
  { params }: { params: { notificationId: string } }
) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const { notificationId } = params;
  if (!MObjectId.isValid(notificationId)) {
    return NextResponse.json({ message: 'Invalid notification ID format' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db: Db = client.db(dbName);
    const notificationsCollection: Collection<MongoNotificationDocument> = db.collection('notifications');

    const result = await notificationsCollection.updateOne(
      { _id: new MObjectId(notificationId), userId: new MObjectId(req.user.userId) },
      { $set: { isRead: true } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Notification not found or you do not have permission to modify it' }, { status: 404 });
    }
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
      return NextResponse.json({ message: 'Notification was already marked as read' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Notification marked as read' }, { status: 200 });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    let message = 'An unexpected error occurred.';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(
  req: AuthenticatedRequest,
  { params }: { params: { notificationId: string } }
) {
  return verifyAuth(req, (authenticatedReq) => markNotificationAsReadHandler(authenticatedReq, { params }));
}
