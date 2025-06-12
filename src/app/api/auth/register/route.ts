
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User } from '@/types';
import type { Collection, ObjectId } from 'mongodb';

// This represents the shape of the document stored in MongoDB
interface MongoUserDocument {
  _id?: ObjectId; // Optional because MongoDB generates it on insert
  name: string;
  email: string;
  password: string; // Stored as hashed string
  role: User['role'];
  bio?: string;
  startupDescription?: string;
  fundingNeed?: string;
  pitchDeckUrl?: string;
  investmentInterests?: string[];
  portfolioCompanies?: string[];
  createdAt: Date; // Stored as BSON Date
  avatarUrl?: string;
  isOnline?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
        return NextResponse.json({ message: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const usersCollection: Collection<MongoUserDocument> = db.collection<MongoUserDocument>('users');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists with this email' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserToInsert: MongoUserDocument = {
      name,
      email,
      password: hashedPassword,
      role,
      bio: '',
      createdAt: new Date(),
      avatarUrl: '',
      isOnline: false,
      ...(role === 'entrepreneur' && { startupDescription: '', fundingNeed: '', pitchDeckUrl: '' }),
      ...(role === 'investor' && { investmentInterests: [], portfolioCompanies: [] }),
    };

    const result = await usersCollection.insertOne(newUserToInsert);

    if (!result.insertedId) {
        return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
    }

    // Construct the client-facing User object
    const createdUser: User = {
        id: result.insertedId.toString(),
        name: newUserToInsert.name,
        email: newUserToInsert.email,
        role: newUserToInsert.role,
        createdAt: newUserToInsert.createdAt.toISOString(), // Convert Date to ISO string
        bio: newUserToInsert.bio,
        avatarUrl: newUserToInsert.avatarUrl,
        isOnline: newUserToInsert.isOnline,
        ...(newUserToInsert.role === 'entrepreneur' && {
            startupDescription: newUserToInsert.startupDescription,
            fundingNeed: newUserToInsert.fundingNeed,
            pitchDeckUrl: newUserToInsert.pitchDeckUrl
        }),
        ...(newUserToInsert.role === 'investor' && {
            investmentInterests: newUserToInsert.investmentInterests,
            portfolioCompanies: newUserToInsert.portfolioCompanies
        }),
    };

    const token = jwt.sign(
      { userId: createdUser.id, role: createdUser.role, email: createdUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    return NextResponse.json({ user: createdUser, token }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    let message = 'An unexpected error occurred during registration.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
