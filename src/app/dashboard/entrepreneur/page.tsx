
'use client';

import RequestCard from '@/components/dashboard/entrepreneur/request-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CollaborationRequest, User } from '@/types';
import { useState, useEffect } from 'react';
import { MailWarning, CheckCheck, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthenticatedUser } from '@/lib/mockAuth';

// Initial mock data, will be overridden by localStorage if available
const initialMockRequests: CollaborationRequest[] = [
  {
    id: 'r1-initial',
    investorId: 'i1-mock',
    investorName: 'Victoria Venture (Mock)',
    investorBioSnippet: 'Seasoned investor with a focus on SaaS and Fintech. Looking for disruptive ideas.',
    entrepreneurId: 'defaultUser', // This will be replaced by the current user's ID if they are an entrepreneur
    entrepreneurName: 'Alice Innovator',
    status: 'pending',
    requestedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    message: 'Impressed by EcoTech Solutions. Would love to discuss your vision.'
  },
  {
    id: 'r2-initial',
    investorId: 'i2-mock',
    investorName: 'Mark Moneywise (Mock)',
    investorBioSnippet: 'Early-stage angel investor passionate about impact-driven startups.',
    entrepreneurId: 'defaultUser',
    entrepreneurName: 'Alice Innovator',
    status: 'accepted',
    requestedAt: new Date(Date.now() - 2 * 86400000).toISOString(), 
  },
];

export default function EntrepreneurDashboardPage() {
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    setIsLoading(true);

    if (user && user.role === 'entrepreneur' && typeof window !== 'undefined') {
      let storedRequests: CollaborationRequest[] = [];
      const storedRequestsStr = localStorage.getItem('collaborationRequests');
      
      if (storedRequestsStr) {
        storedRequests = JSON.parse(storedRequestsStr);
      } else {
        // If no requests in localStorage, use initial mocks and save them
        // Make sure entrepreneurId in initial mocks matches the current user
        storedRequests = initialMockRequests.map(req => ({...req, entrepreneurId: user.id, entrepreneurName: user.name}));
        localStorage.setItem('collaborationRequests', JSON.stringify(storedRequests));
      }
      
      // Filter requests for the current entrepreneur
      const myRequests = storedRequests.filter(req => req.entrepreneurId === user.id);
      setRequests(myRequests);
    }
    setIsLoading(false);
  }, []);

  const updateRequestStatusInLocalStorage = (requestId: string, status: CollaborationRequest['status']) => {
    if (typeof window !== 'undefined') {
      const storedRequestsStr = localStorage.getItem('collaborationRequests');
      if (storedRequestsStr) {
        let allRequests: CollaborationRequest[] = JSON.parse(storedRequestsStr);
        allRequests = allRequests.map(r => 
          r.id === requestId ? { ...r, status: status } : r
        );
        localStorage.setItem('collaborationRequests', JSON.stringify(allRequests));
      }
    }
  };

  const handleAccept = (requestId: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r));
    updateRequestStatusInLocalStorage(requestId, 'accepted');
    toast({ title: "Request Accepted", description: "You can now chat with the investor." });
  };

  const handleReject = (requestId: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
    updateRequestStatusInLocalStorage(requestId, 'rejected');
    toast({ title: "Request Rejected", variant: "default" });
  };

  const filteredRequests = (status: CollaborationRequest['status']) => requests.filter(r => r.status === status);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!currentUser || currentUser.role !== 'entrepreneur') {
    return <p className="text-center py-10 text-muted-foreground">This dashboard is for entrepreneurs.</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold text-foreground">Collaboration Requests</h1>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <MailWarning className="mr-2 h-4 w-4" />Pending ({filteredRequests('pending').length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <CheckCheck className="mr-2 h-4 w-4" />Accepted ({filteredRequests('accepted').length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <XCircle className="mr-2 h-4 w-4" />Rejected ({filteredRequests('rejected').length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
          {filteredRequests('pending').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests('pending').map((request) => (
                <RequestCard key={request.id} request={request} onAccept={handleAccept} onReject={handleReject} />
              ))}
            </div>
          ) : <p className="text-center py-10 text-muted-foreground">No pending requests.</p>}
        </TabsContent>
        <TabsContent value="accepted" className="mt-6">
          {filteredRequests('accepted').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests('accepted').map((request) => (
                <RequestCard key={request.id} request={request} onAccept={handleAccept} onReject={handleReject} />
              ))}
            </div>
          ) : <p className="text-center py-10 text-muted-foreground">No accepted requests yet.</p>}
        </TabsContent>
        <TabsContent value="rejected" className="mt-6">
          {filteredRequests('rejected').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests('rejected').map((request) => (
                <RequestCard key={request.id} request={request} onAccept={handleAccept} onReject={handleReject} />
              ))}
            </div>
          ) : <p className="text-center py-10 text-muted-foreground">No rejected requests.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
