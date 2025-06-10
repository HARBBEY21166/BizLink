import EntrepreneurCard from '@/components/dashboard/investor/entrepreneur-card';
import { Input } from '@/components/ui/input';
import type { User } from '@/types';
import { Search } from 'lucide-react';

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
];

export default function InvestorDashboardPage() {
  // In a real app, fetch entrepreneurs from an API and implement search/filter
  const entrepreneurs = mockEntrepreneurs;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="font-headline text-3xl font-bold text-foreground">Discover Entrepreneurs</h1>
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search entrepreneurs by name, industry..." className="pl-10" />
        </div>
      </div>

      {entrepreneurs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entrepreneurs.map((entrepreneur) => (
            <EntrepreneurCard key={entrepreneur.id} entrepreneur={entrepreneur} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No entrepreneurs found.</p>
          <p className="text-sm text-muted-foreground">Check back later or adjust your search filters.</p>
        </div>
      )}
    </div>
  );
}
