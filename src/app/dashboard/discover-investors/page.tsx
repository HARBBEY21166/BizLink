
'use client';

import InvestorCard from '@/components/dashboard/discover-investors/investor-card';
import { Input } from '@/components/ui/input';
import type { User } from '@/types';
import { Search, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { getAuthenticatedUser } from '@/lib/mockAuth';
import { useToast } from '@/hooks/use-toast';

export default function DiscoverInvestorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [investors, setInvestors] = useState<User[]>([]);
  const [bookmarkedProfileIds, setBookmarkedProfileIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPageData = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [investorsResponse, bookmarksResponse] = await Promise.all([
        fetch('/api/users?role=investor', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/bookmarks/ids', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!investorsResponse.ok) {
        const errorData = await investorsResponse.json();
        throw new Error(errorData.message || `Failed to fetch investors: ${investorsResponse.statusText}`);
      }
      const investorsData: User[] = await investorsResponse.json();
      setInvestors(investorsData);

      if (!bookmarksResponse.ok) {
        const errorData = await bookmarksResponse.json();
        console.warn('Failed to fetch bookmarked IDs:', errorData.message || bookmarksResponse.statusText);
        // Don't throw, allow page to load, bookmarks will just appear as not bookmarked
        setBookmarkedProfileIds(new Set()); 
      } else {
        const bookmarkedIdsData: string[] = await bookmarksResponse.json();
        setBookmarkedProfileIds(new Set(bookmarkedIdsData));
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Could not load page data."});
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    const token = localStorage.getItem('bizlinkToken');

    if (user && user.role === 'entrepreneur' && token) {
      fetchPageData(token);
    } else if (user && user.role !== 'entrepreneur') {
      setIsLoading(false);
    } else {
      setIsLoading(false); // No user or no token
    }
  }, [fetchPageData]);
  
  const handleBookmarkToggle = useCallback((profileId: string, isBookmarked: boolean) => {
    setBookmarkedProfileIds(prevIds => {
      const newIds = new Set(prevIds);
      if (isBookmarked) {
        newIds.add(profileId);
      } else {
        newIds.delete(profileId);
      }
      return newIds;
    });
    // Optionally, could refetch from `/api/bookmarks/ids` to ensure sync,
    // but optimistic update is usually fine for this.
  }, []);

  const filteredInvestors = investors.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.bio && i.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (i.investmentInterests && i.investmentInterests.join(', ').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!currentUser && !isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (currentUser && currentUser.role !== 'entrepreneur' && !isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Access Denied. This page is for entrepreneurs.</p>;
  }
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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

      {error && <p className="text-center py-10 text-destructive">Error: {error}</p>}
      
      {!isLoading && !error && filteredInvestors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvestors.map((investor) => (
            <InvestorCard 
                key={investor.id} 
                investor={investor}
                isBookmarked={bookmarkedProfileIds.has(investor.id)}
                onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && filteredInvestors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No investors found matching your search criteria.</p>
          <p className="text-sm text-muted-foreground">Try different keywords or check back later.</p>
        </div>
      )}
    </div>
  );
}
