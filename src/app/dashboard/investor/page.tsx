
'use client';

import EntrepreneurCard from '@/components/dashboard/investor/entrepreneur-card';
import { Input } from '@/components/ui/input';
import type { User, CollaborationRequest } from '@/types';
import { Search, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { getAuthenticatedUser } from '@/lib/mockAuth';
import { useToast } from '@/hooks/use-toast';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayedProfiles, setDisplayedProfiles] = useState<User[]>([]); // Combined real and mock
  const [sentRequests, setSentRequests] = useState<CollaborationRequest[]>([]);
  const [bookmarkedProfileIds, setBookmarkedProfileIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchInvestorDashboardData = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [entrepreneursResponse, sentRequestsResponse, bookmarksResponse] = await Promise.all([
        fetch('/api/users?role=entrepreneur', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/collaboration-requests/sent', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/bookmarks/ids', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      // Entrepreneurs
      if (!entrepreneursResponse.ok) {
        const errorData = await entrepreneursResponse.json();
        throw new Error(errorData.message || `Failed to fetch entrepreneurs: ${entrepreneursResponse.statusText}`);
      }
      const entrepreneursData: User[] = await entrepreneursResponse.json();
      const allProfiles = [...entrepreneursData, ...mockEntrepreneurs];
      setDisplayedProfiles(allProfiles);

      // Sent Requests
      if (!sentRequestsResponse.ok) {
        const errorData = await sentRequestsResponse.json();
        throw new Error(errorData.message || `Failed to fetch sent requests: ${sentRequestsResponse.statusText}`);
      }
      const sentRequestsData: CollaborationRequest[] = await sentRequestsResponse.json();
      setSentRequests(sentRequestsData);

      // Bookmarked IDs
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
      setDisplayedProfiles([...mockEntrepreneurs]); // Show mocks even if API fails
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    const token = localStorage.getItem('bizlinkToken');

    if (user && user.role === 'investor' && token) {
      fetchInvestorDashboardData(token);
    } else if (user && user.role !== 'investor') {
      setIsLoading(false);
      setDisplayedProfiles([]);
    } else {
      setIsLoading(false);
      setDisplayedProfiles([]);
    }
  }, [fetchInvestorDashboardData]);

  const handleDataRefresh = useCallback(() => {
    const token = localStorage.getItem('bizlinkToken');
    if (currentUser && currentUser.role === 'investor' && token) {
        fetchInvestorDashboardData(token); 
    }
  }, [currentUser, fetchInvestorDashboardData]);

  const filteredDisplayProfiles = displayedProfiles.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.startupDescription && e.startupDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (e.bio && e.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRequestStatusForEntrepreneur = (entrepreneurId: string): CollaborationRequest['status'] | 'not_sent' => {
    // Mock profiles won't have sent requests in the DB
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
  
  if (isLoading && !error) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Entrepreneurs...</span></div>;
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
      
      {error && <p className="text-center py-10 text-destructive">Error: {error}</p>}
      
      {!isLoading && !error && filteredDisplayProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDisplayProfiles.map((entrepreneur) => (
            <EntrepreneurCard 
              key={entrepreneur.id} 
              entrepreneur={entrepreneur}
              initialRequestStatus={getRequestStatusForEntrepreneur(entrepreneur.id)}
              onRequestSent={handleDataRefresh} 
              isBookmarked={bookmarkedProfileIds.has(entrepreneur.id)}
              onBookmarkToggle={handleDataRefresh} 
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && filteredDisplayProfiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No entrepreneurs found matching your search.</p>
          <p className="text-sm text-muted-foreground">Try different keywords or check back later.</p>
        </div>
      )}
    </div>
  );
}
