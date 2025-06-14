
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, Notification, MongoNotificationDocument } from '@/types';
import type { Collection, Db } from 'mongodb';
import { ObjectId as MObjectId } from 'mongodb';

interface AuthenticatedRequest extends NextRequest {
  user?: { userId: string; role: User['role']; email: string };
}

// Helper to convert MongoNotificationDocument to client-facing Notification
function toClientNotification(mongoDoc: MongoNotificationDocument): Notification {
  return {
    id: mongoDoc._id.toString(),
    userId: mongoDoc.userId.toString(),
    type: mongoDoc.type,
    message: mongoDoc.message,
    link: mongoDoc.link,
    isRead: mongoDoc.isRead,
    createdAt: mongoDoc.createdAt.toISOString(),
    actorId: mongoDoc.actorId?.toString(),
    actorName: mongoDoc.actorName,
    actorAvatarUrl: mongoDoc.actorAvatarUrl,
  };
}

async function getNotificationsHandler(req: AuthenticatedRequest) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db: Db = client.db(dbName);
    const notificationsCollection: Collection<MongoNotificationDocument> = db.collection('notifications');

    const userNotifications = await notificationsCollection
      .find({ userId: new MObjectId(req.user.userId) })
      .sort({ createdAt: -1 }) // Sort by most recent
      .limit(50) // Optionally limit the number of notifications fetched
      .toArray();

    const clientNotifications = userNotifications.map(toClientNotification);

    return NextResponse.json(clientNotifications, { status: 200 });

  } catch (error) {
    console.error('Get notifications error:', error);
    let message = 'An unexpected error occurred while fetching notifications.';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ message }, { status: 500 });
  }
}

async function markAllNotificationsAsReadHandler(req: AuthenticatedRequest) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db: Db = client.db(dbName);
    const notificationsCollection: Collection<MongoNotificationDocument> = db.collection('notifications');

    const result = await notificationsCollection.updateMany(
      { userId: new MObjectId(req.user.userId), isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json({ message: 'All notifications marked as read.', modifiedCount: result.modifiedCount }, { status: 200 });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    let message = 'An unexpected error occurred.';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ message }, { status: 500 });
  }
}


export async function GET(req: AuthenticatedRequest) {
  return verifyAuth(req, getNotificationsHandler);
}

export async function PUT(req: AuthenticatedRequest) {
  // For now, PUT on the base route will mark all as read.
  // Could be extended later with a body to specify action if needed.
  return verifyAuth(req, markAllNotificationsAsReadHandler);
}
