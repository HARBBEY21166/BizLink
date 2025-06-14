
'use client';

import InvestorCard from '@/components/dashboard/discover-investors/investor-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';
import { Search, Loader2, FilterX } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { getAuthenticatedUser } from '@/lib/mockAuth';
import { useToast } from '@/hooks/use-toast';

const mockInvestors: User[] = [
  {
    id: 'mock-investor-1',
    name: 'Michael Mockley',
    email: 'michael.mock@example.com',
    role: 'investor',
    bio: 'A sample investor profile for demonstration purposes. Interested in innovative tech, renewable energy, and SaaS platforms. Looking for early-stage startups with strong teams.',
    investmentInterests: ['AI', 'Blockchain', 'SaaS', 'Renewable Energy'],
    portfolioCompanies: ['MockTech Global', 'Sample Solutions Inc.', 'Alpha Mock Ventures'],
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), 
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'man suit',
    isOnline: true,
  },
  {
    id: 'mock-investor-2',
    name: 'Sophia Sampleton',
    email: 'sophia.sample@example.com',
    role: 'investor',
    bio: 'Experienced angel investor focusing on consumer goods and e-commerce. This is a mock profile to showcase platform features.',
    investmentInterests: ['E-commerce', 'Consumer Goods', 'Marketplaces'],
    portfolioCompanies: ['Retail Mock Corp', 'DirectSample Goods'],
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), 
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'woman business',
    isOnline: false,
  },
];

export default function DiscoverInvestorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [interestKeywords, setInterestKeywords] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayedProfiles, setDisplayedProfiles] = useState<User[]>([]);
  const [bookmarkedProfileIds, setBookmarkedProfileIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPageData = useCallback(async (token: string, currentSearchTerm: string, currentInterestKeywords: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({ role: 'investor' });
      if (currentSearchTerm) queryParams.append('searchTerm', currentSearchTerm);
      if (currentInterestKeywords) queryParams.append('interestKeywords', currentInterestKeywords);
      
      const [investorsResponse, bookmarksResponse] = await Promise.all([
        fetch(`/api/users?${queryParams.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/bookmarks/ids', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!investorsResponse.ok) {
        const errorData = await investorsResponse.json();
        throw new Error(errorData.message || `Failed to fetch investors: ${investorsResponse.statusText}`);
      }
      const investorsData: User[] = await investorsResponse.json();
      const allProfiles = [...investorsData, ...mockInvestors.filter(mock => !investorsData.find(real => real.id === mock.id && !currentSearchTerm && !currentInterestKeywords))];
      setDisplayedProfiles(allProfiles);

      if (!bookmarksResponse.ok) {
        const errorData = await bookmarksResponse.json();
        console.warn('Failed to fetch bookmarked IDs:', errorData.message || bookmarksResponse.statusText);
        setBookmarkedProfileIds(new Set()); 
      } else {
        const bookmarkedIdsData: string[] = await bookmarksResponse.json();
        setBookmarkedProfileIds(new Set(bookmarkedIdsData));
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Could not load page data."});
      setDisplayedProfiles(!currentSearchTerm && !currentInterestKeywords ? [...mockInvestors] : []);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    const token = localStorage.getItem('bizlinkToken');

    if (user && user.role === 'entrepreneur' && token) {
      fetchPageData(token, searchTerm, interestKeywords);
    } else if (user && user.role !== 'entrepreneur') {
      setIsLoading(false);
      setDisplayedProfiles([]);
    } else {
      setIsLoading(false);
      setDisplayedProfiles([]);
    }
  }, [fetchPageData, searchTerm, interestKeywords]);
  
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
    // Optionally refetch all data if strict consistency is needed after bookmarking
    // const token = localStorage.getItem('bizlinkToken');
    // if (currentUser && token) fetchPageData(token, searchTerm, interestKeywords);
  }, []);

  const handleSearch = () => {
    const token = localStorage.getItem('bizlinkToken');
    if (currentUser && currentUser.role === 'entrepreneur' && token) {
      fetchPageData(token, searchTerm, interestKeywords);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setInterestKeywords('');
    // useEffect will trigger refetch with empty filters
  };

  if (!currentUser && !isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (currentUser && currentUser.role !== 'entrepreneur' && !isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Access Denied. This page is for entrepreneurs.</p>;
  }
  
  if (isLoading && !error && displayedProfiles.length === 0) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Investors...</span></div>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 p-4 border rounded-lg shadow bg-card">
        <h2 className="text-xl font-semibold font-headline text-foreground">Filter Investors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div className="relative">
            <label htmlFor="searchTerm" className="block text-sm font-medium text-muted-foreground mb-1">Search Term</label>
            <Search className="absolute left-3 top-[calc(50%+0.3rem)] -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              id="searchTerm"
              placeholder="Name, bio, interests..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label htmlFor="interestKeywords" className="block text-sm font-medium text-muted-foreground mb-1">Interest Keywords (comma-separated)</label>
            <Input 
              id="interestKeywords"
              placeholder="e.g., SaaS, AI, Fintech" 
              value={interestKeywords}
              onChange={(e) => setInterestKeywords(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <Search className="mr-2 h-4 w-4"/> Apply Filters
            </Button>
            <Button onClick={clearFilters} variant="outline" className="w-full sm:w-auto">
              <FilterX className="mr-2 h-4 w-4"/> Clear
            </Button>
          </div>
        </div>
      </div>

      {error && <p className="text-center py-10 text-destructive">Error: {error}</p>}
      
      {isLoading && displayedProfiles.length > 0 && (
         <div className="flex items-center justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2 text-sm text-muted-foreground">Updating results...</span></div>
      )}
      
      {!isLoading && !error && displayedProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProfiles.map((investor) => (
            <InvestorCard 
                key={investor.id} 
                investor={investor}
                isBookmarked={bookmarkedProfileIds.has(investor.id)}
                onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && displayedProfiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No investors found matching your filters.</p>
          <p className="text-sm text-muted-foreground">Try different keywords or clear filters.</p>
        </div>
      )}
    </div>
  );
}
