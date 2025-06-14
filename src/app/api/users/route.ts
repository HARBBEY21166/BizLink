
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { MongoUserDocument, User } from '@/types';
import type { Collection, Filter } from 'mongodb';

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

export async function GET(req: NextRequest) {
  const SCRIPT_NAME = 'GET /api/users';
  console.time(SCRIPT_NAME);
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') as User['role'] | null;
    const searchTerm = searchParams.get('searchTerm')?.trim() || '';
    const fundingKeywords = searchParams.get('fundingKeywords')?.trim() || ''; // For entrepreneurs
    const interestKeywords = searchParams.get('interestKeywords')?.trim() || ''; // For investors


    if (!role || (role !== 'investor' && role !== 'entrepreneur')) {
      console.timeEnd(SCRIPT_NAME);
      return NextResponse.json({ message: 'Valid role (investor or entrepreneur) is required as a query parameter' }, { status: 400 });
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db = client.db(dbName);
    const usersCollection: Collection<MongoUserDocument> = db.collection<MongoUserDocument>('users');

    const query: Filter<MongoUserDocument> = { role: role };
    const textSearchConditions = [];

    if (searchTerm) {
      const regex = { $regex: searchTerm, $options: 'i' }; // Case-insensitive search
      const termConditions: Filter<MongoUserDocument>[] = [
        { name: regex },
        { bio: regex },
      ];
      if (role === 'entrepreneur') {
        termConditions.push({ startupDescription: regex });
      } else if (role === 'investor') {
        // For investors, searchTerm might also apply to their investment interests or portfolio
         termConditions.push({ investmentInterests: regex }); // Matches if any interest contains the term
         termConditions.push({ portfolioCompanies: regex }); // Matches if any company contains the term
      }
      textSearchConditions.push({ $or: termConditions });
    }

    if (role === 'entrepreneur' && fundingKeywords) {
      textSearchConditions.push({ fundingNeed: { $regex: fundingKeywords, $options: 'i' } });
    }

    if (role === 'investor' && interestKeywords) {
      // Split by comma and trim, then create an array of regex conditions
      const interestsArray = interestKeywords.split(',').map(interest => interest.trim()).filter(Boolean);
      if (interestsArray.length > 0) {
        textSearchConditions.push({ investmentInterests: { $all: interestsArray.map(int => new RegExp(int, 'i')) } });
      }
    }
    
    if (textSearchConditions.length > 0) {
      query.$and = (query.$and || []).concat(textSearchConditions);
    }

    console.log(`[${SCRIPT_NAME}] Fetching users with role: ${role} and query:`, JSON.stringify(query));
    const users = await usersCollection.find(query).toArray();
    console.log(`[${SCRIPT_NAME}] Found ${users.length} users with role: ${role}`);

    const clientUsers = users.map(toClientUser);

    console.timeEnd(SCRIPT_NAME);
    return NextResponse.json(clientUsers, { status: 200 });

  } catch (error) {
    console.error(`[${SCRIPT_NAME}] Failed to fetch users:`, error);
    let message = 'An unexpected error occurred.';
    if (error instanceof Error) {
        message = error.message;
    }
    console.timeEnd(SCRIPT_NAME);
    return NextResponse.json({ message }, { status: 500 });
  }
}
