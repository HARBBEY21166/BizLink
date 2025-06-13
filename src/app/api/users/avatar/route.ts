import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken'; // Make sure this import is present

export async function POST(request: NextRequest) {
  try {
    // Get JWT from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'No token provided.' }, { status: 401 });
    }

    // Verify and decode JWT
    let decodedToken: any;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 401 });
    }

    // Extract user ID from the token
    const userId = decodedToken.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found in token.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${userId}-${file.name}`;
    const filePath = path.join(uploadDir, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    // Update user document in the database
    const client = await clientPromise;
    const db = client.db(); // Replace with your database name if different
    const usersCollection = db.collection('users'); // Replace with your users collection name if different

    const objectIdUserId = new ObjectId(userId);

    await usersCollection.findOneAndUpdate(
      { _id: objectIdUserId },
      { $set: { avatarUrl: avatarUrl } },
      { returnDocument: 'after' } // Return the updated document
    );

    return NextResponse.json({ avatarUrl }, { status: 200 });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: 'Error uploading avatar.' }, { status: 500 });
  }
}
