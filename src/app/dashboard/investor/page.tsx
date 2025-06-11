
'use client';

import EntrepreneurCard from '@/components/dashboard/investor/entrepreneur-card';
import { Input } from '@/components/ui/input';
import type { User } from '@/types';
import { Search, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAuthenticatedUser } from '@/lib/mockAuth';


// Mock data - replace with API call
const mockEntrepreneurs: User[] = [
  {
    id: 'e1',
    name: 'Alice Innovator',
    email: 'alice@example.com',
    role: 'entrepreneur',
    bio: 'Pioneering new solutions in sustainable tech. Looking for seed funding to scale operations and expand market reach.',
    startupDescription: 'EcoTech Solutions',
    fundingNeed: '$500,000',
    createdAt: new Date().toISOString(),
    avatarUrl: 'https://placehold.co/150x150.png',
    dataAiHint: 'woman smiling'
  },
  {
    id: 'e2',
    name: 'Bob Builder',
    email: 'bob@example.com',
    role: 'entrepreneur',
    bio: 'Building the next generation of AI-powered educational tools. Passionate about transforming learning experiences.',
    startupDescription: 'LearnAI Co.',
    fundingNeed: '$250,000',
    createdAt: new Date().toISOString(),
    avatarUrl: 'https://placehold.co/150x150.png',
    dataAiHint: 'man glasses'
  },
  {
    id: 'e3',
    name: 'Carol Creator',
    email: 'carol@example.com',
    role: 'entrepreneur',
    bio: 'Developing a platform for independent artists to monetize their work. Strong focus on community and fair compensation.',
    startupDescription: 'Artify Hub',
    fundingNeed: '$1M',
    createdAt: new Date().toISOString(),
    avatarUrl: 'https://placehold.co/150x150.png',
    dataAiHint: 'person painting'
  },
  {
    id: 'e4',
    name: 'David Developer',
    email: 'david@example.com',
    role: 'entrepreneur',
    bio: 'Creating innovative mobile applications for productivity and lifestyle improvements. Experienced in full-stack development.',
    startupDescription: 'AppWorks Studio',
    fundingNeed: '$300,000',
    createdAt: new Date().toISOString(),
    avatarUrl: 'https://placehold.co/150x150.png',
    dataAiHint: 'man coding'
  },
  {
    id: 'e5',
    name: 'Eva Ecommerce',
    email: 'eva@example.com',
    role: 'entrepreneur',
    bio: 'Building a niche e-commerce platform for handcrafted goods. Focus on ethical sourcing and artisan empowerment.',
    startupDescription: 'Artisan Collective',
    fundingNeed: '$150,000',
    createdAt: new Date().toISOString(),
    avatarUrl: 'https://placehold.co/150x150.png',
    dataAiHint: 'woman online shopping'
  }
];

export default function InvestorDashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // In a real app, fetch entrepreneurs from an API
  const entrepreneurs = mockEntrepreneurs;

  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    setIsLoading(false);
  }, []);

  const filteredEntrepreneurs = entrepreneurs.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.startupDescription && e.startupDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (e.bio && e.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!currentUser || currentUser.role !== 'investor') {
    return <p className="text-center py-10 text-muted-foreground">This dashboard is for investors.</p>;
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="font-headline text-3xl font-bold text-foreground">Discover Entrepreneurs</h1>
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by name, startup, bio..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredEntrepreneurs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntrepreneurs.map((entrepreneur) => (
            <EntrepreneurCard key={entrepreneur.id} entrepreneur={entrepreneur} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No entrepreneurs found matching your search.</p>
          <p className="text-sm text-muted-foreground">Try different keywords or check back later.</p>
        </div>
      )}
    </div>
  );
}
