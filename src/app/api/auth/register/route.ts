
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User } from '@/types';

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
    const db = client.db(); // You can specify your DB name here if it's not in the MONGODB_URI
    const usersCollection = db.collection<Omit<User, 'id'>>('users');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists with this email' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: Omit<User, 'id' | 'createdAt'> & { createdAt: Date } = {
      name,
      email,
      password: hashedPassword, // Store the hashed password
      role,
      bio: '',
      createdAt: new Date(),
      // Initialize role-specific fields
      ...(role === 'entrepreneur' && { startupDescription: '', fundingNeed: '' }),
      ...(role === 'investor' && { investmentInterests: [], portfolioCompanies: [] }),
    };

    const result = await usersCollection.insertOne(newUser as any); // InsertedId is ObjectId

    if (!result.insertedId) {
        return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
    }
    
    const createdUser: User = {
        id: result.insertedId.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt.toISOString(),
        bio: newUser.bio,
        ...(newUser.role === 'entrepreneur' && { 
            startupDescription: newUser.startupDescription, 
            fundingNeed: newUser.fundingNeed 
        }),
        ...(newUser.role === 'investor' && { 
            investmentInterests: newUser.investmentInterests, 
            portfolioCompanies: newUser.portfolioCompanies 
        }),
    };


    const token = jwt.sign(
      { userId: createdUser.id, role: createdUser.role, email: createdUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    // Return the user object (without password) and token
    return NextResponse.json({ user: createdUser, token }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    let message = 'An unexpected error occurred';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
