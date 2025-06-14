
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { MongoUserDocument, MongoPasswordResetTokenDocument } from '@/types';
import type { Collection, Db } from 'mongodb';
import crypto from 'crypto'; // For generating secure tokens
import { z } from 'zod';

const requestSchema = z.object({
  email: z.string().email('Invalid email address.'),
});

// Helper function to ensure indexes on the passwordResetTokens collection
async function ensureIndexes(collection: Collection<MongoPasswordResetTokenDocument>) {
  try {
    await collection.createIndex({ token: 1 }, { unique: true });
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion
    await collection.createIndex({ userId: 1 });
  } catch (error) {
    console.warn("Index creation warning for passwordResetTokens (might be due to existing index):", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: 'Invalid email provided.', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const { email } = validationResult.data;

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db: Db = client.db(dbName);
    const usersCollection: Collection<MongoUserDocument> = db.collection('users');
    const tokensCollection: Collection<MongoPasswordResetTokenDocument> = db.collection('passwordResetTokens');
    await ensureIndexes(tokensCollection);

    const user = await usersCollection.findOne({ email });

    if (!user) {
      // Important: Do not reveal if an email exists or not for security reasons.
      // Send a generic success message even if the user isn't found.
      console.log(`[Request Password Reset] Attempt for non-existent email: ${email}`);
      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });
    }

    // Invalidate any existing tokens for this user
    await tokensCollection.deleteMany({ userId: user._id });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // Token expires in 1 hour

    const newResetToken: Omit<MongoPasswordResetTokenDocument, '_id'> = {
      userId: user._id,
      token,
      expiresAt,
    };

    await tokensCollection.insertOne(newResetToken as MongoPasswordResetTokenDocument);

    // --- IMPORTANT: EMAIL SENDING MOCK ---
    // In a real application, you would send an email here.
    // For this prototype, we log the reset link to the console.
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'; // Use an env var for your app's URL
    const resetLink = `${appBaseUrl}/reset-password?token=${token}`;
    
    console.log(`[PASSWORD RESET] User: ${user.email}, Role: ${user.role}`);
    console.log(`[PASSWORD RESET] Reset Link (normally sent via email): ${resetLink}`);
    // --- END EMAIL SENDING MOCK ---

    return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });

  } catch (error) {
    console.error('Request password reset error:', error);
    let message = 'An unexpected error occurred.';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ message }, { status: 500 });
  }
}
