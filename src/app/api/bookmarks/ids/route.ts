
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

async function getBookmarkedIdsHandler(req: AuthenticatedRequest) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const bookmarksCollection: Collection<MongoBookmarkDocument> = db.collection('bookmarks');

    const bookmarks = await bookmarksCollection
      .find({ userId: new MObjectId(req.user.userId) }, { projection: { bookmarkedProfileId: 1, _id: 0 } })
      .toArray();

    const bookmarkedIds = bookmarks.map(b => b.bookmarkedProfileId.toString());

    return NextResponse.json(bookmarkedIds, { status: 200 });

  } catch (error) {
    console.error('Get bookmarked IDs error:', error);
    let message = 'An unexpected error occurred while fetching bookmarked profile IDs.';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(req: AuthenticatedRequest) {
  return verifyAuth(req, getBookmarkedIdsHandler);
}
