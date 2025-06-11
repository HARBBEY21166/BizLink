
'use client';

import InvestorCard from '@/components/dashboard/discover-investors/investor-card';
import { Input } from '@/components/ui/input';
import type { User } from '@/types';
import { Search, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAuthenticatedUser } from '@/lib/mockAuth';
import { allMockUsers } from '@/lib/mockData'; 

export default function DiscoverInvestorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const investors = allMockUsers.filter(user => user.role === 'investor');

  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    setIsLoading(false);
  }, []);

  const filteredInvestors = investors.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.bio && i.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (i.investmentInterests && i.investmentInterests.join(', ').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!currentUser || currentUser.role !== 'entrepreneur') {
    return <p className="text-center py-10 text-muted-foreground">Access Denied. This page is for entrepreneurs.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="font-headline text-3xl font-bold text-foreground">Discover Investors</h1>
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by name, bio, interests..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredInvestors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvestors.map((investor) => (
            <InvestorCard key={investor.id} investor={investor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No investors found matching your search.</p>
          <p className="text-sm text-muted-foreground">Try different keywords or check back later.</p>
        </div>
      )}
    </div>
  );
}
