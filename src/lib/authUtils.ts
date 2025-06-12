
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import type { User } from '@/types';

interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    role: User['role'];
    email: string;
  };
}

export async function verifyAuth(
  req: AuthenticatedRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = req.headers.get('authorization')?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return NextResponse.json({ message: 'Authentication token missing' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: User['role']; email: string };
    req.user = decoded; // Attach user info to the request object
    return await handler(req);
  } catch (error) {
    console.error('JWT verification error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Authentication failed' }, { status: 500 });
  }
}
