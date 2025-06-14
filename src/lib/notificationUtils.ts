
'use server';

import type { Db, ObjectId as MObjectId } from 'mongodb';
import type { NotificationType, MongoNotificationDocument } from '@/types';

interface CreateNotificationParams {
  db: Db;
  userId: MObjectId; // Recipient ID
  type: NotificationType;
  message: string;
  link?: string;
  actorId?: MObjectId; // User who performed the action
  actorName?: string;
  actorAvatarUrl?: string;
}

export async function createNotification({
  db,
  userId,
  type,
  message,
  link,
  actorId,
  actorName,
  actorAvatarUrl,
}: CreateNotificationParams): Promise<void> {
  try {
    const notificationsCollection = db.collection<Omit<MongoNotificationDocument, '_id'>>('notifications');
    const newNotification: Omit<MongoNotificationDocument, '_id'> = {
      userId,
      type,
      message,
      link: link || undefined,
      isRead: false,
      createdAt: new Date(),
      actorId: actorId || undefined,
      actorName: actorName || undefined,
      actorAvatarUrl: actorAvatarUrl || undefined,
    };
    await notificationsCollection.insertOne(newNotification);
    // console.log(`[NotificationUtils] Notification created for user ${userId.toString()}: ${type}`);
  } catch (error) {
    console.error('[NotificationUtils] Error creating notification:', error);
    // Depending on requirements, you might want to re-throw or handle more gracefully
  }
}
