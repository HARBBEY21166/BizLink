
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/authUtils';
import type { User, MongoChatMessageDocument, Conversation, ChatMessage, MongoUserDocument } from '@/types';
import type { Collection, Db } from 'mongodb';
import { ObjectId as MObjectId } from 'mongodb';

interface AuthenticatedRequest extends NextRequest {
  user?: { userId: string; role: User['role']; email: string };
}

// Helper to convert MongoUserDocument to client-facing User
function toClientUser(mongoUser: MongoUserDocument, forCurrentUser: boolean = false): User {
  return {
    id: mongoUser._id.toString(),
    name: mongoUser.name,
    email: forCurrentUser ? mongoUser.email : '', // Only include email for the current user in participantA
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


async function getConversationsHandler(req: AuthenticatedRequest) {
  if (!req.user) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  const currentUserId = new MObjectId(req.user.userId);

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB_NAME || 'bizlink_db';
    const db: Db = client.db(dbName);
    const messagesCollection: Collection<MongoChatMessageDocument> = db.collection('messages');
    const usersCollection: Collection<MongoUserDocument> = db.collection('users');

    const currentUserDoc = await usersCollection.findOne({ _id: currentUserId });
    if (!currentUserDoc) {
        return NextResponse.json({ message: 'Current user not found' }, { status: 404 });
    }
    const clientCurrentUser = toClientUser(currentUserDoc, true);


    const conversationsData = await messagesCollection.aggregate([
      {
        $match: {
          $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $project: {
          _id: 1,
          senderId: 1,
          receiverId: 1,
          message: 1,
          timestamp: 1,
          isRead: 1,
          partnerId: {
            $cond: {
              if: { $eq: ['$senderId', currentUserId] },
              then: '$receiverId',
              else: '$senderId',
            },
          },
        },
      },
      {
        $group: {
          _id: '$partnerId',
          lastMessageDoc: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', currentUserId] },
                    { $eq: ['$isRead', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'partnerDetailsArray',
        },
      },
      {
        $unwind: {
            path: '$partnerDetailsArray',
            preserveNullAndEmptyArrays: false // Ensure partner exists
        }
      },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          participantA: clientCurrentUser,
          participantB: {
             // Reconstruct User object for participantB from partnerDetailsArray
            id: { $toString: '$partnerDetailsArray._id' },
            name: '$partnerDetailsArray.name',
            // Do not include email for participantB for privacy
            email: '', // Explicitly set to empty or undefined
            role: '$partnerDetailsArray.role',
            bio: '$partnerDetailsArray.bio',
            startupDescription: '$partnerDetailsArray.startupDescription',
            fundingNeed: '$partnerDetailsArray.fundingNeed',
            pitchDeckUrl: '$partnerDetailsArray.pitchDeckUrl',
            investmentInterests: '$partnerDetailsArray.investmentInterests',
            portfolioCompanies: '$partnerDetailsArray.portfolioCompanies',
            createdAt: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$partnerDetailsArray.createdAt" } },
            avatarUrl: '$partnerDetailsArray.avatarUrl',
            isOnline: '$partnerDetailsArray.isOnline',
          },
          lastMessage: {
             id: { $toString: '$lastMessageDoc._id' },
             senderId: { $toString: '$lastMessageDoc.senderId' },
             receiverId: { $toString: '$lastMessageDoc.receiverId' },
             message: '$lastMessageDoc.message',
             timestamp: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$lastMessageDoc.timestamp" } },
             isRead: '$lastMessageDoc.isRead',
          },
          unreadCount: '$unreadCount',
        },
      },
      { $sort: { 'lastMessage.timestamp': -1 } },
    ]).toArray();

    return NextResponse.json(conversationsData as Conversation[], { status: 200 });

  } catch (error) {
    console.error('Get conversations error:', error);
    let message = 'An unexpected error occurred while fetching conversations.';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(req: AuthenticatedRequest) {
  return verifyAuth(req, getConversationsHandler);
}
