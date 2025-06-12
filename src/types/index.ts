
export type Role = 'investor' | 'entrepreneur';

export interface User {
  id: string; // Will be MongoDB's _id as string
  name: string;
  email: string;
  password?: string; // Should always be hashed in DB, optional on client
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

export interface CollaborationRequest {
  id: string;
  investorId: string;
  investorName: string; // denormalized for easy display
  investorBioSnippet?: string; // denormalized
  entrepreneurId: string;
  entrepreneurName: string; // denormalized
  entrepreneurStartup?: string; // denormalized
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
  message?: string; // Initial message with request
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
}

export interface Conversation {
  id: string; // Could be a composite of user IDs or a unique ID
  participantA: User;
  participantB: User;
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
