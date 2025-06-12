
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { MongoUserDocument, User } from '@/types';
import type { Collection } from 'mongodb';

// Helper to convert MongoUserDocument to client-facing User
function toClientUser(mongoUser: MongoUserDocument): User {
  return {
    id: mongoUser._id.toString(),
    name: mongoUser.name,
    email: mongoUser.email, // Be cautious about exposing email widely if not needed
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') as User['role'] | null;

    if (!role || (role !== 'investor' && role !== 'entrepreneur')) {
      return NextResponse.json({ message: 'Valid role (investor or entrepreneur) is required as a query parameter' }, { status: 400 });
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const usersCollection: Collection<MongoUserDocument> = db.collection<MongoUserDocument>('users');

    const users = await usersCollection.find({ role: role }).toArray();

    const clientUsers = users.map(toClientUser);

    return NextResponse.json(clientUsers, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch users:', error);
    let message = 'An unexpected error occurred.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
