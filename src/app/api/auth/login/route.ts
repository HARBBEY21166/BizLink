
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User } from '@/types';
import type { Collection } from 'mongodb';


export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db'; // Fallback just in case
    const db = client.db(dbName);
    const usersCollection: Collection<User & { _id: import('mongodb').ObjectId }> = db.collection('users');


    const userDocument = await usersCollection.findOne({ email });

    if (!userDocument) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, userDocument.password as string); 
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const userForToken: User = {
        id: userDocument._id.toString(),
        name: userDocument.name,
        email: userDocument.email,
        role: userDocument.role,
        createdAt: typeof userDocument.createdAt === 'string' ? userDocument.createdAt : new Date(userDocument.createdAt).toISOString(),
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
    let message = 'An unexpected error occurred';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
