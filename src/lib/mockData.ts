
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
  // return allMockUsers_DEPRECATED.find(user => user.id === userId);
  return undefined; 
};


// Collaboration requests might still use localStorage for now until backend is built for it.
export const initialMockRequests: Omit<CollaborationRequest, 'id' | 'requestedAt'>[] = [
  {
    investorId: 'i1', // Corresponds to a potential ID from your DB if Victoria Venture exists
    investorName: 'Victoria Venture',
    investorBioSnippet: 'Seasoned investor with a focus on SaaS and Fintech.',
    entrepreneurId: 'e1', // Corresponds to a potential ID from your DB if Alice Innovator exists
    entrepreneurName: 'Alice Innovator',
    entrepreneurStartup: 'EcoTech Solutions',
    status: 'pending',
    message: 'Impressed by EcoTech Solutions. Would love to discuss your vision.'
  },
  // ... other mock requests
];

// This function needs to be re-evaluated if collaboration requests move to backend.
export const getCollaborationRequests = (currentEntrepreneurId?: string): CollaborationRequest[] => {
  if (typeof window !== 'undefined') {
    const storedRequestsStr = localStorage.getItem('collaborationRequests');
    if (storedRequestsStr) {
      const storedRequests = JSON.parse(storedRequestsStr) as CollaborationRequest[];
      if (currentEntrepreneurId) {
        // Ensure that investorId and entrepreneurId in stored requests actually correspond to users
        // that would exist in the database.
        return storedRequests.filter(req => req.entrepreneurId === currentEntrepreneurId);
      }
      return storedRequests;
    } else if (currentEntrepreneurId) {
      // This part for initializing from initialMockRequests might become problematic
      // if the IDs (e1, i1) don't match actual database IDs.
      // It's safer to assume localStorage is populated by actual interactions or a seeding process.
      // For now, let's return empty if not found, to avoid creating requests with potentially invalid mock IDs.
      // const entrepreneurRequests = initialMockRequests
      //   .filter(reqBase => reqBase.entrepreneurId === currentEntrepreneurId)
      //   .map((reqBase, index) => ({
      //     ...reqBase,
      //     id: `req-${Date.now()}-${index}`,
      //     requestedAt: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
      //   }));
      // localStorage.setItem('collaborationRequests', JSON.stringify(entrepreneurRequests));
      // return entrepreneurRequests;
      return [];
    }
  }
  return [];
};
