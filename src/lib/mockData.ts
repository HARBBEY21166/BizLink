
// src/lib/mockData.ts
import type { User, CollaborationRequest } from '@/types';

// Centralized mock user data
export const allMockUsers: User[] = [
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
    pitchDeckUrl: 'https://example.com/pitchdeck-alice.pdf',
  },
  {
    id: 'e2',
    name: 'Bob Builder',
    email: 'bob@example.com',
    role: 'entrepreneur',
    bio: 'Building the next generation of AI-powered educational tools. Passionate about transforming learning experiences.',
    startupDescription: 'LearnAI Co.',
    fundingNeed: '$250,000',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://placehold.co/150x150.png',
  },
  {
    id: 'e3',
    name: 'Carol Creator',
    email: 'carol@example.com',
    role: 'entrepreneur',
    bio: 'Developing a platform for independent artists to monetize their work. Strong focus on community and fair compensation.',
    startupDescription: 'Artify Hub',
    fundingNeed: '$1M',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://placehold.co/150x150.png',
  },
  {
    id: 'e4',
    name: 'David Developer',
    email: 'david@example.com',
    role: 'entrepreneur',
    bio: 'Creating innovative mobile applications for productivity and lifestyle improvements. Experienced in full-stack development.',
    startupDescription: 'AppWorks Studio',
    fundingNeed: '$300,000',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://placehold.co/150x150.png',
  },
  {
    id: 'e5',
    name: 'Eva Ecommerce',
    email: 'eva@example.com',
    role: 'entrepreneur',
    bio: 'Building a niche e-commerce platform for handcrafted goods. Focus on ethical sourcing and artisan empowerment.',
    startupDescription: 'Artisan Collective',
    fundingNeed: '$150,000',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://placehold.co/150x150.png',
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
  },
  {
    id: 'i2',
    name: 'Mark Moneywise',
    email: 'mark@example.com',
    role: 'investor',
    bio: 'Early-stage angel investor passionate about impact-driven startups and consumer tech.',
    investmentInterests: ['Social Impact', 'Consumer Tech', 'EdTech'],
    portfolioCompanies: ['GreenSteps Co.', 'ConnectApp'],
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://placehold.co/150x150.png',
  },
  {
    id: 'i3',
    name: 'Sarah Strategist',
    email: 'sarah@example.com',
    role: 'investor',
    bio: 'Strategic investor with a background in scaling B2B software companies. Looking for Series A opportunities.',
    investmentInterests: ['B2B Software', 'Enterprise Solutions', 'Cybersecurity'],
    portfolioCompanies: ['ScaleUp Inc.', 'SecureNet Ltd.'],
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://placehold.co/150x150.png',
  }
];

export const getMockUserById = (userId: string): User | undefined => {
  return allMockUsers.find(user => user.id === userId);
};

// Mock collaboration requests using IDs from allMockUsers
export const initialMockRequests: Omit<CollaborationRequest, 'id' | 'requestedAt'>[] = [
  {
    investorId: 'i1',
    investorName: 'Victoria Venture',
    investorBioSnippet: 'Seasoned investor with a focus on SaaS and Fintech.',
    entrepreneurId: 'e1',
    entrepreneurName: 'Alice Innovator',
    entrepreneurStartup: 'EcoTech Solutions',
    status: 'pending',
    message: 'Impressed by EcoTech Solutions. Would love to discuss your vision.'
  },
  {
    investorId: 'i2',
    investorName: 'Mark Moneywise',
    investorBioSnippet: 'Early-stage angel investor passionate about impact-driven startups.',
    entrepreneurId: 'e2',
    entrepreneurName: 'Bob Builder',
    entrepreneurStartup: 'LearnAI Co.',
    status: 'accepted',
    message: 'Your AI education tool looks promising. Let\'s connect.'
  },
  {
    investorId: 'i3',
    investorName: 'Sarah Strategist',
    investorBioSnippet: 'Strategic investor with a background in scaling B2B software companies.',
    entrepreneurId: 'e1', // Another request for Alice
    entrepreneurName: 'Alice Innovator',
    entrepreneurStartup: 'EcoTech Solutions',
    status: 'pending',
    message: 'Interested in learning more about EcoTech\'s go-to-market strategy.'
  },
];

// Function to get or initialize requests in localStorage
export const getCollaborationRequests = (currentEntrepreneurId?: string): CollaborationRequest[] => {
  if (typeof window !== 'undefined') {
    const storedRequestsStr = localStorage.getItem('collaborationRequests');
    if (storedRequestsStr) {
      const storedRequests = JSON.parse(storedRequestsStr) as CollaborationRequest[];
      if (currentEntrepreneurId) {
        return storedRequests.filter(req => req.entrepreneurId === currentEntrepreneurId);
      }
      return storedRequests;
    } else if (currentEntrepreneurId) {
      // Initialize with requests for the current entrepreneur if none are stored
      const entrepreneurRequests = initialMockRequests
        .filter(reqBase => reqBase.entrepreneurId === currentEntrepreneurId)
        .map((reqBase, index) => ({
          ...reqBase,
          id: `req-${Date.now()}-${index}`,
          requestedAt: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
        }));
      localStorage.setItem('collaborationRequests', JSON.stringify(entrepreneurRequests));
      return entrepreneurRequests;
    }
  }
  return [];
};
