
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { MongoUserDocument, MongoPasswordResetTokenDocument } from '@/types';
import type { Collection, Db } from 'mongodb';
import { ObjectId as MObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const resetSchema = z.object({
  token: z.string().min(1, 'Token is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = resetSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const { token, password } = validationResult.data;

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db: Db = client.db(dbName);
    const usersCollection: Collection<MongoUserDocument> = db.collection('users');
    const tokensCollection: Collection<MongoPasswordResetTokenDocument> = db.collection('passwordResetTokens');

    const resetTokenDoc = await tokensCollection.findOne({ token });

    if (!resetTokenDoc) {
      return NextResponse.json({ message: 'Invalid or expired password reset token. Please request a new one.' }, { status: 400 });
    }

    // Check if token has expired (although TTL index should handle this, good to double check)
    if (new Date() > resetTokenDoc.expiresAt) {
      await tokensCollection.deleteOne({ _id: resetTokenDoc._id }); // Clean up expired token
      return NextResponse.json({ message: 'Password reset token has expired. Please request a new one.' }, { status: 400 });
    }

    const user = await usersCollection.findOne({ _id: resetTokenDoc.userId });
    if (!user) {
      // This case should ideally not happen if token is valid, but good for robustness
      await tokensCollection.deleteOne({ _id: resetTokenDoc._id });
      return NextResponse.json({ message: 'User associated with this token not found.' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    // Invalidate the token after successful use
    await tokensCollection.deleteOne({ _id: resetTokenDoc._id });

    console.log(`[PASSWORD RESET] Password successfully reset for user: ${user.email}`);
    return NextResponse.json({ message: 'Password has been successfully reset. You can now log in with your new password.' }, { status: 200 });

  } catch (error) {
    console.error('Reset password error:', error);
    let message = 'An unexpected error occurred while resetting password.';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ message }, { status: 500 });
  }
}
