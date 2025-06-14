
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { MongoUserDocument, User, Role } from '@/types';
import type { Collection } from 'mongodb';

interface AuthenticatedAdminRequest extends NextRequest {
  user?: { userId: string; role: Role; email: string };
}

// Helper to convert MongoUserDocument to client-facing User
function toClientUser(mongoUser: MongoUserDocument): User {
  return {
    id: mongoUser._id.toString(),
    name: mongoUser.name,
    email: mongoUser.email, // Admins can see emails
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

async function getAllUsersHandler(req: AuthenticatedAdminRequest) {
  if (!req.user || req.user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Access restricted to administrators.' }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const usersCollection: Collection<MongoUserDocument> = db.collection('users');

    // Consider adding pagination in the future for performance with many users
    const users = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();
    const clientUsers = users.map(toClientUser);

    return NextResponse.json(clientUsers, { status: 200 });

  } catch (error) {
    console.error('Admin fetch all users error:', error);
    let message = 'An unexpected error occurred while fetching users.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(req: AuthenticatedAdminRequest) {
  return verifyAuth(req, getAllUsersHandler);
}
