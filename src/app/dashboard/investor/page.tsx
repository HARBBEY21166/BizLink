
'use client';

import EntrepreneurCard from '@/components/dashboard/investor/entrepreneur-card';
import { Input } from '@/components/ui/input';
import type { User } from '@/types';
import { Search, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAuthenticatedUser } from '@/lib/mockAuth';

export default function InvestorDashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [entrepreneurs, setEntrepreneurs] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);

    async function fetchEntrepreneurs() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/users?role=entrepreneur');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch entrepreneurs: ${response.statusText}`);
        }
        const data: User[] = await response.json();
        setEntrepreneurs(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    }

    if (user && user.role === 'investor') {
      fetchEntrepreneurs();
    } else if (user) {
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const filteredEntrepreneurs = entrepreneurs.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.startupDescription && e.startupDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (e.bio && e.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!currentUser) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (currentUser.role !== 'investor') {
    return <p className="text-center py-10 text-muted-foreground">Access Denied. This dashboard is for investors.</p>;
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

      {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
      {error && <p className="text-center py-10 text-destructive">Error: {error}</p>}
      
      {!isLoading && !error && filteredEntrepreneurs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntrepreneurs.map((entrepreneur) => (
            <EntrepreneurCard key={entrepreneur.id} entrepreneur={entrepreneur} />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && filteredEntrepreneurs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No entrepreneurs found matching your search.</p>
          <p className="text-sm text-muted-foreground">Try different keywords or check back later.</p>
        </div>
      )}
    </div>
  );
}
