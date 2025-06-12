
// src/lib/mockData.ts
import type { User, CollaborationRequest } from '@/types';

// Centralized mock user data - NO LONGER USED FOR DYNAMIC USER LISTING OR PROFILES
// Kept for potential use in other mock scenarios or as a reference.
export const allMockUsers_DEPRECATED: User[] = [
  {
    id: 'e1',
    name: 'Alice Innovator',
    email: 'alice@example.com',
    role: 'entrepreneur',
    bio: 'Pioneering new solutions in sustainable tech. Looking for seed funding to scale operations and expand market reach.',
    startupDescription: 'EcoTech Solutions',
    fundingNeed: '$500,000',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://placehold.co/150x150.png',
    dataAiHint: 'woman entrepreneur',
    pitchDeckUrl: 'https://example.com/pitchdeck-alice.pdf',
    isOnline: true,
  },
  {
    id: 'i1',
    name: 'Victoria Venture',
    email: 'victoria@example.com',
    role: 'investor',
    bio: 'Seasoned investor with a focus on SaaS and Fintech. Looking for disruptive ideas and strong teams.',
    investmentInterests: ['SaaS', 'Fintech', 'AI'],
    portfolioCompanies: ['Innovatech Ltd.', 'FinSolutions Inc.'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://placehold.co/150x150.png',
    dataAiHint: 'woman investor',
    isOnline: true,
  },
  // Add other mock users if needed for specific non-dynamic scenarios
];

// NO LONGER USED for fetching profiles dynamically. Use API calls instead.
export const getMockUserById_DEPRECATED = (userId: string): User | undefined => {
  // console.warn("getMockUserById_DEPRECATED is called. This should be replaced by an API call.");
  return undefined; 
};


// Collaboration requests are now handled by the backend.
// These mock functions and data are no longer used for dynamic application logic.
export const initialMockRequests_DEPRECATED: Omit<CollaborationRequest, 'id' | 'requestedAt'>[] = [
  // {
  //   investorId: 'i1', 
  //   investorName: 'Victoria Venture',
  //   investorBioSnippet: 'Seasoned investor with a focus on SaaS and Fintech.',
  //   entrepreneurId: 'e1', 
  //   entrepreneurName: 'Alice Innovator',
  //   entrepreneurStartup: 'EcoTech Solutions',
  //   status: 'pending',
  //   message: 'Impressed by EcoTech Solutions. Would love to discuss your vision.'
  // },
];

export const getCollaborationRequests_DEPRECATED = (currentEntrepreneurId?: string): CollaborationRequest[] => {
  // console.warn("getCollaborationRequests_DEPRECATED is called. This should be replaced by API calls.");
  // if (typeof window !== 'undefined') {
  //   const storedRequestsStr = localStorage.getItem('collaborationRequests');
  //   if (storedRequestsStr) {
  //     const storedRequests = JSON.parse(storedRequestsStr) as CollaborationRequest[];
  //     if (currentEntrepreneurId) {
  //       return storedRequests.filter(req => req.entrepreneurId === currentEntrepreneurId);
  //     }
  //     return storedRequests;
  //   } else if (currentEntrepreneurId) {
  //     return [];
  //   }
  // }
  return [];
};

