
'use client';

import InvestorCard from '@/components/dashboard/discover-investors/investor-card';
import { Input } from '@/components/ui/input';
import type { User } from '@/types';
import { Search, Loader2 } from 'lucide-react';
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
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // Approx 100 days ago
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
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), // Approx 50 days ago
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'woman business',
    isOnline: false,
  },
];

export default function DiscoverInvestorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayedProfiles, setDisplayedProfiles] = useState<User[]>([]); // Combined real and mock
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
      
      // Combine real investors with mock investors
      const allProfiles = [...investorsData, ...mockInvestors];
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
      setDisplayedProfiles([...mockInvestors]); // Show mocks even if API fails
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
      setDisplayedProfiles([]); // Clear profiles if not allowed
    } else {
      setIsLoading(false); // No user or no token
      setDisplayedProfiles([]);
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
    // For mock profiles, the API call in BookmarkButton will fail gracefully.
    // For real profiles, this optimistic update is fine.
    // If a more robust sync is needed after bookmarking real profiles, one could refetch:
    // const token = localStorage.getItem('bizlinkToken');
    // if (currentUser && token && !profileId.startsWith('mock-')) fetchPageData(token);
  }, []);

  const filteredDisplayProfiles = displayedProfiles.filter(i =>
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
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Investors...</span></div>;
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
      
      {!isLoading && !error && filteredDisplayProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDisplayProfiles.map((investor) => (
            <InvestorCard 
                key={investor.id} 
                investor={investor}
                isBookmarked={bookmarkedProfileIds.has(investor.id)}
                onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && filteredDisplayProfiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No investors found matching your search criteria.</p>
          <p className="text-sm text-muted-foreground">Try different keywords or check back later.</p>
        </div>
      )}
    </div>
  );
}
