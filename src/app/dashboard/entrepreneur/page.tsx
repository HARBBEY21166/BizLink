
'use client';

import RequestCard from '@/components/dashboard/entrepreneur/request-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CollaborationRequest, User } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { MailWarning, CheckCheck, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthenticatedUser } from '@/lib/mockAuth'; // For current user context for now


export default function EntrepreneurDashboardPage() {
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchReceivedRequests = useCallback(async () => {
    const token = localStorage.getItem('bizlinkToken');
    if (!token) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication token not found.' });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/collaboration-requests/received', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch requests');
      }
      const data: CollaborationRequest[] = await response.json();
      setRequests(data);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Fetch Error', description: err instanceof Error ? err.message : 'Could not fetch requests.' });
      setRequests([]); // Clear requests on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const user = getAuthenticatedUser(); // Uses localStorage
    setCurrentUser(user);
    if (user && user.role === 'entrepreneur') {
      fetchReceivedRequests();
    } else {
      setIsLoading(false); // Not an entrepreneur or no user
    }
  }, [fetchReceivedRequests]);


  const handleUpdateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
    const token = localStorage.getItem('bizlinkToken');
    if (!token) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication token not found.' });
      return;
    }

    // Optimistically update UI
    const originalRequests = [...requests];
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: status } : r));

    try {
      const response = await fetch(`/api/collaboration-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Revert optimistic update
        setRequests(originalRequests);
        throw new Error(responseData.message || `Failed to ${status === 'accepted' ? 'accept' : 'reject'} request`);
      }
      
      // Update with confirmed data from backend (though often same as optimistic)
      setRequests(prev => prev.map(r => r.id === requestId ? responseData : r));

      toast({ 
        title: `Request ${status === 'accepted' ? 'Accepted' : 'Rejected'}`, 
        description: status === 'accepted' ? "You can now chat with the investor." : undefined
      });

    } catch (error) {
      // Revert optimistic update if not already done
      setRequests(originalRequests);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Could not update request status.',
      });
    }
  };


  const handleAccept = (requestId: string) => {
    handleUpdateRequestStatus(requestId, 'accepted');
  };

  const handleReject = (requestId: string) => {
    handleUpdateRequestStatus(requestId, 'rejected');
  };

  const filteredRequests = (status: CollaborationRequest['status']) => requests.filter(r => r.status === status);

  if (!currentUser && !isLoading) {
     // This means getAuthenticatedUser returned null and we are done loading.
    return <p className="text-center py-10 text-muted-foreground">Please log in to view this page.</p>;
  }
  
  if (currentUser && currentUser.role !== 'entrepreneur' && !isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Access Denied. This dashboard is for entrepreneurs.</p>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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

