
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, MongoBookmarkDocument } from '@/types';
import type { Collection } from 'mongodb';
import { ObjectId as MObjectId } from 'mongodb';

interface AuthenticatedRequest extends NextRequest {
  user?: { userId: string; role: User['role']; email: string };
}

async function deleteBookmarkHandler(
  req: AuthenticatedRequest,
  { params }: { params: { profileId: string } }
) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const { profileId } = params;
  if (!MObjectId.isValid(profileId)) {
    return NextResponse.json({ message: 'Invalid profile ID format' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const bookmarksCollection: Collection<MongoBookmarkDocument> = db.collection('bookmarks');

    const result = await bookmarksCollection.deleteOne({
      userId: new MObjectId(req.user.userId),
      bookmarkedProfileId: new MObjectId(profileId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Bookmark not found or already removed' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bookmark removed successfully' }, { status: 200 });

  } catch (error) {
    console.error('Delete bookmark error:', error);
    let message = 'An unexpected error occurred while removing bookmark.';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  req: AuthenticatedRequest,
  { params }: { params: { profileId: string } }
) {
  return verifyAuth(req, (authenticatedReq) => deleteBookmarkHandler(authenticatedReq, { params }));
}
