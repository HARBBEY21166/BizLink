
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { MongoUserDocument, User } from '@/types';
import type { Collection, ObjectId } from 'mongodb';
import { ObjectId as MObjectId } from 'mongodb'; // For validating ID format

// Helper to convert MongoUserDocument to client-facing User
function toClientUser(mongoUser: MongoUserDocument): User {
  return {
    id: mongoUser._id.toString(),
    name: mongoUser.name,
    email: mongoUser.email, // Be cautious about exposing email widely if not needed for public profiles
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

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId || !MObjectId.isValid(userId)) {
      return NextResponse.json({ message: 'Valid userId parameter is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const usersCollection: Collection<MongoUserDocument> = db.collection<MongoUserDocument>('users');

    const userDocument = await usersCollection.findOne({ _id: new MObjectId(userId) });

    if (!userDocument) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(toClientUser(userDocument), { status: 200 });

  } catch (error) {
    console.error(`Failed to fetch user ${params.userId}:`, error);
    let message = 'An unexpected error occurred.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
