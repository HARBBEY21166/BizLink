
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, MongoUserDocument, MongoBookmarkDocument, Bookmark } from '@/types';
import type { Collection } from 'mongodb';
import { ObjectId as MObjectId } from 'mongodb';
import { z } from 'zod';

interface AuthenticatedRequest extends NextRequest {
  user?: { userId: string; role: User['role']; email: string };
}

const createBookmarkSchema = z.object({
  profileId: z.string().refine((val) => MObjectId.isValid(val), { message: "Invalid profile ID" }),
});

// Helper function to ensure indexes on the bookmarks collection
async function ensureIndexes(collection: Collection<MongoBookmarkDocument>) {
  try {
    await collection.createIndex({ userId: 1, bookmarkedProfileId: 1 }, { unique: true });
    await collection.createIndex({ userId: 1 });
  } catch (error) {
    console.warn("Index creation warning (might be due to existing index):", error);
  }
}


// Helper to convert MongoUserDocument to client-facing User
function toClientUser(mongoUser: MongoUserDocument): User {
  return {
    id: mongoUser._id.toString(),
    name: mongoUser.name,
    email: mongoUser.email,
    role: mongoUser.role,
    bio: mongoUser.bio,
    startupDescription: mongoUser.startupDescription,
    fundingNeed: mongoUser.fundingNeed,
    pitchDeckUrl: mongoUser.pitchDeckUrl,
    investmentInterests: mongoUser.investmentInterests,
    portfolioCompanies: mongoUser.portfolioCompanies,
    createdAt: mongoUser.createdAt.toISOString(),
    avatarUrl: mongoUser.avatarUrl,
    isOnline: mongoUser.isOnline,
  };
}

async function createBookmarkHandler(req: AuthenticatedRequest) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validationResult = createBookmarkSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: 'Validation failed', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { profileId } = validationResult.data;
    const currentUserId = req.user.userId;

    if (currentUserId === profileId) {
        return NextResponse.json({ message: 'You cannot bookmark your own profile.' }, { status: 400 });
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const bookmarksCollection: Collection<MongoBookmarkDocument> = db.collection('bookmarks');
    await ensureIndexes(bookmarksCollection);
    
    const usersCollection: Collection<MongoUserDocument> = db.collection('users');

    // Verify profile to be bookmarked exists
    const profileToBookmark = await usersCollection.findOne({ _id: new MObjectId(profileId) });
    if (!profileToBookmark) {
      return NextResponse.json({ message: 'Profile to bookmark not found' }, { status: 404 });
    }

    const newBookmark: Omit<MongoBookmarkDocument, '_id'> = {
      userId: new MObjectId(currentUserId),
      bookmarkedProfileId: new MObjectId(profileId),
      createdAt: new Date(),
    };

    try {
        const result = await bookmarksCollection.insertOne(newBookmark as MongoBookmarkDocument);
        if (!result.insertedId) {
            return NextResponse.json({ message: 'Failed to create bookmark' }, { status: 500 });
        }
        const createdBookmark: Bookmark = {
            id: result.insertedId.toString(),
            userId: currentUserId,
            bookmarkedProfileId: profileId,
            createdAt: newBookmark.createdAt.toISOString(),
        };
        return NextResponse.json(createdBookmark, { status: 201 });

    } catch (error: any) {
        if (error.code === 11000) { // Duplicate key error
             return NextResponse.json({ message: 'Profile already bookmarked.' }, { status: 409 });
        }
        throw error; // Re-throw other errors
    }

  } catch (error) {
    console.error('Create bookmark error:', error);
    let message = 'An unexpected error occurred while creating bookmark.';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ message }, { status: 500 });
  }
}

async function getBookmarksHandler(req: AuthenticatedRequest) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const bookmarksCollection: Collection<MongoBookmarkDocument> = db.collection('bookmarks');
    
    // Fetch bookmarks and populate profile details
    const bookmarkedProfiles = await bookmarksCollection.aggregate([
      { $match: { userId: new MObjectId(req.user.userId) } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users', // The collection to join
          localField: 'bookmarkedProfileId', // Field from the input documents (bookmarks)
          foreignField: '_id', // Field from the documents of the "from" collection (users)
          as: 'profileDetails' // Output array field
        }
      },
      { $unwind: '$profileDetails' }, // Deconstructs the profileDetails array
      {
        $project: { // Shape the output
          _id: 0, // Exclude original bookmark _id if not needed, or map it
          id: '$profileDetails._id', // Use profile's ID as the main ID for the returned User object
          name: '$profileDetails.name',
          email: '$profileDetails.email',
          role: '$profileDetails.role',
          bio: '$profileDetails.bio',
          startupDescription: '$profileDetails.startupDescription',
          fundingNeed: '$profileDetails.fundingNeed',
          pitchDeckUrl: '$profileDetails.pitchDeckUrl',
          investmentInterests: '$profileDetails.investmentInterests',
          portfolioCompanies: '$profileDetails.portfolioCompanies',
          createdAt: '$profileDetails.createdAt', // This is profile's creation date
          avatarUrl: '$profileDetails.avatarUrl',
          isOnline: '$profileDetails.isOnline',
          // bookmarkedAt: '$createdAt' // Optionally include when it was bookmarked
        }
      }
    ]).toArray();
    
    // Convert dates to ISO strings for client
    const clientProfiles = bookmarkedProfiles.map(profile => ({
        ...profile,
        id: profile.id.toString(),
        createdAt: profile.createdAt.toISOString(),
    })) as User[];


    return NextResponse.json(clientProfiles, { status: 200 });

  } catch (error) {
    console.error('Get bookmarks error:', error);
    let message = 'An unexpected error occurred while fetching bookmarks.';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ message }, { status: 500 });
  }
}


export async function POST(req: AuthenticatedRequest) {
  return verifyAuth(req, createBookmarkHandler);
}

export async function GET(req: AuthenticatedRequest) {
  return verifyAuth(req, getBookmarksHandler);
}
