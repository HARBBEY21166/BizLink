
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils'; // Assuming you create this utility
import type { MongoUserDocument, User } from '@/types';
import type { Collection } from 'mongodb'; // ObjectId removed from type-only import
import { ObjectId } from 'mongodb'; // ObjectId imported as a value
import { z } from 'zod';

interface AuthenticatedRequest extends NextRequest {
  user?: { userId: string; role: User['role']; email: string };
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

// Zod schema for profile update validation
const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  bio: z.string().max(1000, "Bio is too long").optional().or(z.literal('')),
  avatarUrl: z.string().max(255, "Avatar URL is too long").optional().or(z.literal('')), // Changed from .url()
  startupDescription: z.string().max(1000, "Startup description is too long").optional().or(z.literal('')),
  fundingNeed: z.string().max(200, "Funding need is too long").optional().or(z.literal('')),
  pitchDeckUrl: z.string().url("Invalid URL for pitch deck").optional().or(z.literal('')),
  investmentInterests: z.array(z.string()).optional(),
  portfolioCompanies: z.array(z.string()).optional(),
}).strict(); // Use strict to prevent extra fields

async function getProfileHandler(req: AuthenticatedRequest) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const usersCollection: Collection<MongoUserDocument> = db.collection<MongoUserDocument>('users');

    const userDocument = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });

    if (!userDocument) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(toClientUser(userDocument), { status: 200 });

  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json({ message: 'An unexpected error occurred while fetching profile.' }, { status: 500 });
  }
}

async function updateProfileHandler(req: AuthenticatedRequest) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: 'Validation failed', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const updates = validationResult.data;

    // Remove fields that are undefined to avoid overwriting with null in MongoDB
    Object.keys(updates).forEach(key => updates[key as keyof typeof updates] === undefined && delete updates[key as keyof typeof updates]);
    
    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ message: 'No updates provided' }, { status: 400 });
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const usersCollection: Collection<MongoUserDocument> = db.collection<MongoUserDocument>('users');

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
       // This can happen if the data submitted is identical to what's in the DB
       // Fetch the user to return current data
       const updatedUserDoc = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
       if (!updatedUserDoc) return NextResponse.json({ message: 'User not found after update attempt' }, { status: 404 });
       return NextResponse.json(toClientUser(updatedUserDoc), { status: 200 });
    }

    const updatedUserDoc = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    if (!updatedUserDoc) return NextResponse.json({ message: 'User not found after update' }, { status: 404 });


    return NextResponse.json(toClientUser(updatedUserDoc), { status: 200 });

  } catch (error) {
    console.error('Failed to update profile:', error);
    let message = 'An unexpected error occurred while updating profile.';
     if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(req: AuthenticatedRequest) {
  return verifyAuth(req, getProfileHandler);
}

export async function PUT(req: AuthenticatedRequest) {
  return verifyAuth(req, updateProfileHandler);
}
