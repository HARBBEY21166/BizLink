
'use client';

import EntrepreneurCard from '@/components/dashboard/investor/entrepreneur-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { User, CollaborationRequest } from '@/types';
import { Search, Loader2, FilterX } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { getAuthenticatedUser } from '@/lib/mockAuth';
import { useToast } from '@/hooks/use-toast';
import ProfileCompletionCard from '@/components/dashboard/common/profile-completion-card';

const mockEntrepreneurs: User[] = [
  {
    id: 'mock-entrepreneur-1',
    name: 'Eva Innovate',
    email: 'eva.mock@example.com',
    role: 'entrepreneur',
    bio: 'Pioneering AI-driven solutions for sustainable agriculture. This is a sample profile for demonstration.',
    startupDescription: 'AgriFuture AI',
    fundingNeed: '$750,000 Seed',
    pitchDeckUrl: 'https://example.com/mock-pitchdeck.pdf',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'woman tech',
    isOnline: true,
  },
  {
    id: 'mock-entrepreneur-2',
    name: 'Alex Builder',
    email: 'alex.mock@example.com',
    role: 'entrepreneur',
    bio: 'Developing a platform to connect local artisans with global markets. Mock profile to illustrate diverse startup ideas.',
    startupDescription: 'Artisan Connect',
    fundingNeed: '$300,000 Pre-seed',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    avatarUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'person creative',
    isOnline: false,
  },
];

export default function InvestorDashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fundingKeywords, setFundingKeywords] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayedProfiles, setDisplayedProfiles] = useState<User[]>([]);
  const [sentRequests, setSentRequests] = useState<CollaborationRequest[]>([]);
  const [bookmarkedProfileIds, setBookmarkedProfileIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchInvestorDashboardData = useCallback(async (token: string, currentSearchTerm: string, currentFundingKeywords: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({ role: 'entrepreneur' });
      if (currentSearchTerm) queryParams.append('searchTerm', currentSearchTerm);
      if (currentFundingKeywords) queryParams.append('fundingKeywords', currentFundingKeywords);

      const [entrepreneursResponse, sentRequestsResponse, bookmarksResponse] = await Promise.all([
        fetch(`/api/users?${queryParams.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/collaboration-requests/sent', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/bookmarks/ids', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!entrepreneursResponse.ok) {
        const errorData = await entrepreneursResponse.json();
        throw new Error(errorData.message || `Failed to fetch entrepreneurs: ${entrepreneursResponse.statusText}`);
      }
      const entrepreneursData: User[] = await entrepreneursResponse.json();
      const allProfiles = [...entrepreneursData, ...mockEntrepreneurs.filter(mock => !entrepreneursData.find(real => real.id === mock.id && !currentSearchTerm && !currentFundingKeywords))]; // Only show mocks if no filters
      setDisplayedProfiles(allProfiles);

      if (!sentRequestsResponse.ok) {
        const errorData = await sentRequestsResponse.json();
        throw new Error(errorData.message || `Failed to fetch sent requests: ${sentRequestsResponse.statusText}`);
      }
      const sentRequestsData: CollaborationRequest[] = await sentRequestsResponse.json();
      setSentRequests(sentRequestsData);

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
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Could not load dashboard data."});
      setDisplayedProfiles(!currentSearchTerm && !currentFundingKeywords ? [...mockEntrepreneurs] : []);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    const token = localStorage.getItem('bizlinkToken');

    if (user && user.role === 'investor' && token) {
      fetchInvestorDashboardData(token, searchTerm, fundingKeywords);
    } else if (user && user.role !== 'investor') {
      setIsLoading(false);
      setDisplayedProfiles([]);
    } else {
      setIsLoading(false);
      setDisplayedProfiles([]);
    }
  }, [fetchInvestorDashboardData, searchTerm, fundingKeywords]); // Refetch when filters change

  const handleSearch = () => {
    const token = localStorage.getItem('bizlinkToken');
    if (currentUser && currentUser.role === 'investor' && token) {
      fetchInvestorDashboardData(token, searchTerm, fundingKeywords);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFundingKeywords('');
    // useEffect will trigger refetch with empty filters
  };

  const getRequestStatusForEntrepreneur = (entrepreneurId: string): CollaborationRequest['status'] | 'not_sent' => {
    if (entrepreneurId.startsWith('mock-')) return 'not_sent'; 
    const request = sentRequests.find(r => r.entrepreneurId === entrepreneurId);
    return request ? request.status : 'not_sent';
  }

  if (!currentUser && !isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Please log in to view this page.</p>;
  }

  if (currentUser && currentUser.role !== 'investor' && !isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Access Denied. This dashboard is for investors.</p>;
  }
  
  if (isLoading && !error && displayedProfiles.length === 0) { // Show loading only if no profiles are displayed yet
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Entrepreneurs...</span></div>;
  }

  return (
    <div className="space-y-8">
      <ProfileCompletionCard user={currentUser} />
      <div className="space-y-4 p-4 border rounded-lg shadow bg-card">
        <h2 className="text-xl font-semibold font-headline text-foreground">Filter Entrepreneurs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div className="relative">
            <label htmlFor="searchTerm" className="block text-sm font-medium text-muted-foreground mb-1">Search Term</label>
            <Search className="absolute left-3 top-[calc(50%+0.3rem)] -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              id="searchTerm"
              placeholder="Name, startup, bio..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <label htmlFor="fundingKeywords" className="block text-sm font-medium text-muted-foreground mb-1">Funding Keywords</label>
            <Input 
              id="fundingKeywords"
              placeholder="e.g., Seed, $500k, Series A" 
              value={fundingKeywords}
              onChange={(e) => setFundingKeywords(e.target.value)}
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
      
      {isLoading && displayedProfiles.length > 0 && ( // Show subtle loading if profiles are already there but new ones are fetching
         <div className="flex items-center justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2 text-sm text-muted-foreground">Updating results...</span></div>
      )}

      {!isLoading && !error && displayedProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProfiles.map((entrepreneur) => (
            <EntrepreneurCard 
              key={entrepreneur.id} 
              entrepreneur={entrepreneur}
              initialRequestStatus={getRequestStatusForEntrepreneur(entrepreneur.id)}
              onRequestSent={() => fetchInvestorDashboardData(localStorage.getItem('bizlinkToken')!, searchTerm, fundingKeywords)} 
              isBookmarked={bookmarkedProfileIds.has(entrepreneur.id)}
              onBookmarkToggle={() => fetchInvestorDashboardData(localStorage.getItem('bizlinkToken')!, searchTerm, fundingKeywords)} 
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && displayedProfiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No entrepreneurs found matching your filters.</p>
          <p className="text-sm text-muted-foreground">Try different keywords or clear filters.</p>
        </div>
      )}
    </div>
  );
}
