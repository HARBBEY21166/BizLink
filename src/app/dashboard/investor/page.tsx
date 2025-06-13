
'use client';

import EntrepreneurCard from '@/components/dashboard/investor/entrepreneur-card';
import { Input } from '@/components/ui/input';
import type { User, CollaborationRequest } from '@/types';
import { Search, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { getAuthenticatedUser } from '@/lib/mockAuth';
import { useToast } from '@/hooks/use-toast';

export default function InvestorDashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [entrepreneurs, setEntrepreneurs] = useState<User[]>([]);
  const [sentRequests, setSentRequests] = useState<CollaborationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchInvestorData = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [entrepreneursResponse, sentRequestsResponse] = await Promise.all([
        fetch('/api/users?role=entrepreneur', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/collaboration-requests/sent', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!entrepreneursResponse.ok) {
        const errorData = await entrepreneursResponse.json();
        throw new Error(errorData.message || `Failed to fetch entrepreneurs: ${entrepreneursResponse.statusText}`);
      }
      const entrepreneursData: User[] = await entrepreneursResponse.json();
      setEntrepreneurs(entrepreneursData);

      if (!sentRequestsResponse.ok) {
        const errorData = await sentRequestsResponse.json();
        throw new Error(errorData.message || `Failed to fetch sent requests: ${sentRequestsResponse.statusText}`);
      }
      const sentRequestsData: CollaborationRequest[] = await sentRequestsResponse.json();
      setSentRequests(sentRequestsData);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Could not load dashboard data."});
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    const token = localStorage.getItem('bizlinkToken');

    if (user && user.role === 'investor' && token) {
      fetchInvestorData(token);
    } else if (user && user.role !== 'investor') {
      setIsLoading(false); // Not an investor
    } else {
      setIsLoading(false); // No user or no token
    }
  }, [fetchInvestorData]);

  const handleRequestSentOrUpdated = useCallback(() => {
    const token = localStorage.getItem('bizlinkToken');
    if (currentUser && currentUser.role === 'investor' && token) {
        fetchInvestorData(token); // Refetch both entrepreneurs and sent requests
    }
  }, [currentUser, fetchInvestorData]);


  const filteredEntrepreneurs = entrepreneurs.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.startupDescription && e.startupDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (e.bio && e.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRequestStatusForEntrepreneur = (entrepreneurId: string): CollaborationRequest['status'] | 'not_sent' => {
    const request = sentRequests.find(r => r.entrepreneurId === entrepreneurId);
    return request ? request.status : 'not_sent';
  }

  if (!currentUser && !isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Please log in to view this page.</p>;
  }

  if (currentUser && currentUser.role !== 'investor' && !isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Access Denied. This dashboard is for investors.</p>;
  }
  
  if (isLoading && !error) { // Show loader only if actively loading and no error yet
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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
      
      {!isLoading && !error && filteredEntrepreneurs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntrepreneurs.map((entrepreneur) => (
            <EntrepreneurCard 
              key={entrepreneur.id} 
              entrepreneur={entrepreneur}
              initialRequestStatus={getRequestStatusForEntrepreneur(entrepreneur.id)}
              onRequestSent={handleRequestSentOrUpdated}
            />
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
