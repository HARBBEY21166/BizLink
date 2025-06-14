
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { Role, MongoUserDocument, MongoCollaborationRequestDocument } from '@/types';
import type { Collection, Db } from 'mongodb';

interface AuthenticatedAdminRequest extends NextRequest {
  user?: { userId: string; role: Role; email: string };
}

interface AdminStats {
  totalUsers: number;
  usersByRole: {
    admin: number;
    investor: number;
    entrepreneur: number;
  };
  totalCollaborationRequests: number;
  collaborationRequestsByStatus: {
    pending: number;
    accepted: number;
    rejected: number;
  };
  // Future: totalMessages, activeChats, etc.
}

async function getAdminStatsHandler(req: AuthenticatedAdminRequest) {
  if (!req.user || req.user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Access restricted to administrators.' }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db: Db = client.db(dbName);
    const usersCollection: Collection<MongoUserDocument> = db.collection('users');
    const requestsCollection: Collection<MongoCollaborationRequestDocument> = db.collection('collaborationRequests');

    const totalUsers = await usersCollection.countDocuments();
    
    const usersByRolePipeline = [
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ];
    const usersByRoleAgg = await usersCollection.aggregate(usersByRolePipeline).toArray();
    const usersByRole: AdminStats['usersByRole'] = { admin: 0, investor: 0, entrepreneur: 0 };
    usersByRoleAgg.forEach(item => {
      if (item._id && usersByRole.hasOwnProperty(item._id as Role)) {
        usersByRole[item._id as Role] = item.count;
      }
    });

    const totalCollaborationRequests = await requestsCollection.countDocuments();
    const requestsByStatusPipeline = [
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ];
    const requestsByStatusAgg = await requestsCollection.aggregate(requestsByStatusPipeline).toArray();
    const collaborationRequestsByStatus: AdminStats['collaborationRequestsByStatus'] = { pending: 0, accepted: 0, rejected: 0 };
    requestsByStatusAgg.forEach(item => {
        if (item._id && collaborationRequestsByStatus.hasOwnProperty(item._id as keyof AdminStats['collaborationRequestsByStatus'])) {
            collaborationRequestsByStatus[item._id as keyof AdminStats['collaborationRequestsByStatus']] = item.count;
        }
    });


    const stats: AdminStats = {
      totalUsers,
      usersByRole,
      totalCollaborationRequests,
      collaborationRequestsByStatus,
    };

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    console.error('Admin fetch stats error:', error);
    let message = 'An unexpected error occurred while fetching statistics.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(req: AuthenticatedAdminRequest) {
  return verifyAuth(req, getAdminStatsHandler);
}
