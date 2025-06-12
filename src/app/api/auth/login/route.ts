
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User } from '@/types';
import type { Collection, ObjectId } from 'mongodb';

// This represents the shape of the document stored in MongoDB
interface MongoUserDocument {
  _id: ObjectId; // In MongoDB, _id is present after insertion and is an ObjectId
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
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const usersCollection: Collection<MongoUserDocument> = db.collection<MongoUserDocument>('users');


    const userDocument = await usersCollection.findOne({ email });

    if (!userDocument) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // userDocument.password will be the hashed password from the DB.
    const passwordMatch = await bcrypt.compare(password, userDocument.password);
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Construct the client-facing User object
    const userForToken: User = {
        id: userDocument._id.toString(), // Convert ObjectId to string
        name: userDocument.name,
        email: userDocument.email,
        role: userDocument.role,
        createdAt: userDocument.createdAt.toISOString(), // Convert Date to ISO string
        bio: userDocument.bio,
        avatarUrl: userDocument.avatarUrl,
        isOnline: userDocument.isOnline,
        ...(userDocument.role === 'entrepreneur' && {
            startupDescription: userDocument.startupDescription,
            fundingNeed: userDocument.fundingNeed,
            pitchDeckUrl: userDocument.pitchDeckUrl
        }),
        ...(userDocument.role === 'investor' && {
            investmentInterests: userDocument.investmentInterests,
            portfolioCompanies: userDocument.portfolioCompanies
        }),
    };

    const token = jwt.sign(
      { userId: userForToken.id, role: userForToken.role, email: userForToken.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    return NextResponse.json({ user: userForToken, token }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    let message = 'An unexpected error occurred during login.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
