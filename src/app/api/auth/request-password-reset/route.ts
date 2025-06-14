
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { MongoUserDocument, MongoPasswordResetTokenDocument } from '@/types';
import type { Collection, Db } from 'mongodb';
import crypto from 'crypto'; // For generating secure tokens
import { z } from 'zod';
import { sendPasswordResetEmail } from '@/lib/emailUtils'; // Import the email utility

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

    // --- Send Email with Nodemailer ---
    try {
      await sendPasswordResetEmail(user.email, token);
      console.log(`[PASSWORD RESET] Password reset email initiated for user: ${user.email}`);
    } catch (emailError) {
      console.error('[PASSWORD RESET] Failed to send password reset email:', emailError);
      // Even if email fails, don't reveal it to the user. Log internally.
      // The user will still get the generic success message.
      // Consider a more robust error handling/retry mechanism for email sending in production.
      // For now, if sendPasswordResetEmail throws, it will be caught by the outer catch block.
      // To prevent that, and still show "If an account exists..." we can catch it here.
      // However, if the email service itself is down, the user should probably get a different message.
      // For simplicity, we'll let it bubble up if `sendPasswordResetEmail` throws.
      // If `sendPasswordResetEmail` is configured to throw on misconfiguration, the outer catch will handle it.
      // If it's configured to throw on send failure, that's also caught by outer.
      return NextResponse.json({ message: 'Error sending password reset email. Please try again later or contact support.' }, { status: 500 });
    }
    // --- End Email Sending ---

    return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });

  } catch (error) {
    console.error('Request password reset error:', error);
    let message = 'An unexpected error occurred while processing your request.';
    if (error instanceof Error && error.message.startsWith('Could not send password reset email')) {
        message = error.message; // Propagate specific email sending error message
    } else if (error instanceof Error && error.message.startsWith('Email service not configured')) {
        message = 'Password reset service is temporarily unavailable. Please contact support.'; // User-friendly for misconfig
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
