
import type { ObjectId as MongoObjectId } from 'mongodb';

export type Role = 'investor' | 'entrepreneur';

// Represents the User object as it is typically used on the client-side
// and returned by APIs (excluding sensitive data like password).
export interface User {
  id: string; // MongoDB _id as string
  name: string;
  email: string; // Email is included for identification, but password is not
  role: Role;
  bio?: string;
  startupDescription?: string; // Entrepreneur only
  fundingNeed?: string; // Entrepreneur only
  pitchDeckUrl?: string; // Entrepreneur only - URL to stored pitch deck
  investmentInterests?: string[]; // Investor only
  portfolioCompanies?: string[]; // Investor only
  createdAt: string; // ISO Date string
  avatarUrl?: string; // Optional: URL to avatar image
  isOnline?: boolean; // For chat status
  dataAiHint?: string; // For placeholder image generation
}

// Represents the full User document as stored in MongoDB, including the hashed password.
// This type should generally not be exposed directly to the client.
export interface MongoUserDocument {
  _id: MongoObjectId;
  name: string;
  email: string;
  password: string; // Hashed password
  role: Role;
  bio?: string;
  startupDescription?: string;
  fundingNeed?: string;
  pitchDeckUrl?: string;
  investmentInterests?: string[];
  portfolioCompanies?: string[];
  createdAt: Date; // Stored as BSON Date
  avatarUrl?: string;
  isOnline?: boolean;
}


// Client-facing Collaboration Request
export interface CollaborationRequest {
  id: string; // MongoDB _id as string
  investorId: string; // investor's User ID (string)
  investorName: string; // denormalized for easy display
  investorBioSnippet?: string; // denormalized
  entrepreneurId: string; // entrepreneur's User ID (string)
  entrepreneurName: string; // denormalized
  entrepreneurStartup?: string; // denormalized
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string; // ISO Date string
  message?: string; // Initial message with request
}

// Collaboration Request document as stored in MongoDB
export interface MongoCollaborationRequestDocument {
  _id: MongoObjectId;
  investorId: MongoObjectId; // Reference to User._id
  investorName: string;
  investorBioSnippet?: string;
  entrepreneurId: MongoObjectId; // Reference to User._id
  entrepreneurName: string;
  entrepreneurStartup?: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: Date; // Stored as BSON Date
  message?: string;
}

// Client-facing Chat Message
export interface ChatMessage {
  id: string; // MongoDB _id as string
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string; // ISO Date string
  isRead?: boolean;
  tempId?: string; // Optional temporary ID for optimistic UI updates
}

// Chat Message document as stored in MongoDB
export interface MongoChatMessageDocument {
  _id: MongoObjectId;
  senderId: MongoObjectId;
  receiverId: MongoObjectId;
  message: string;
  timestamp: Date; // Stored as BSON Date
  isRead: boolean;
}

export interface Conversation {
  id: string; // Could be a composite of user IDs or a unique ID (typically the other user's ID)
  participantA: User; // Current user (usually)
  participantB: User; // The other user in the conversation
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

// For AI Pitch Deck Analyzer
export interface PitchAnalysis {
  score: number;
  strengths: string;
  weaknesses: string;
  advice: string;
}

// For Bookmarks
export interface Bookmark {
    id: string;
    userId: string;
    bookmarkedProfileId: string;
    createdAt: string;
}

export interface MongoBookmarkDocument {
    _id: MongoObjectId;
    userId: MongoObjectId;
    bookmarkedProfileId: MongoObjectId;
    createdAt: Date;
}

// For Notifications
export type NotificationType =
  | 'new_message'
  | 'new_collaboration_request'
  | 'request_accepted'
  | 'request_rejected';

export interface Notification {
  id: string; // MongoDB _id as string
  userId: string; // The ID of the user who should receive this notification
  type: NotificationType;
  message: string; // User-friendly message
  link?: string; // Optional link to navigate to (e.g., chat, request page)
  isRead: boolean;
  createdAt: string; // ISO Date string
  actorId?: string; // Optional: ID of the user who triggered the notification
  actorName?: string; // Optional: Name of the user who triggered the notification
  actorAvatarUrl?: string; // Optional: Avatar of the user who triggered the notification
}

export interface MongoNotificationDocument {
  _id: MongoObjectId;
  userId: MongoObjectId; // Recipient
  type: NotificationType;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date; // Stored as BSON Date
  actorId?: MongoObjectId;
  actorName?: string;
  actorAvatarUrl?: string;
}

// For Password Reset Tokens
export interface MongoPasswordResetTokenDocument {
  _id: MongoObjectId;
  userId: MongoObjectId;
  token: string;
  expiresAt: Date;
}
