'use client';

import RequestCard from '@/components/dashboard/entrepreneur/request-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CollaborationRequest } from '@/types';
import { useState }// Mock data - replace with API call and state management
import { MailWarning, CheckCheck, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const mockRequests: CollaborationRequest[] = [
  {
    id: 'r1',
    investorId: 'i1',
    investorName: 'Victoria Venture',
    investorBioSnippet: 'Seasoned investor with a focus on SaaS and Fintech. Looking for disruptive ideas.',
    entrepreneurId: 'e1', // Assume current user is e1
    entrepreneurName: 'Alice Innovator',
    status: 'pending',
    requestedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    message: 'Impressed by EcoTech Solutions. Would love to discuss your vision.'
  },
  {
    id: 'r2',
    investorId: 'i2',
    investorName: 'Mark Moneywise',
    investorBioSnippet: 'Early-stage angel investor passionate about impact-driven startups.',
    entrepreneurId: 'e1',
    entrepreneurName: 'Alice Innovator',
    status: 'accepted',
    requestedAt: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
  },
  {
    id: 'r3',
    investorId: 'i3',
    investorName: 'Sarah Strategist',
    investorBioSnippet: 'VC firm partner specializing in Series A funding for deep tech.',
    entrepreneurId: 'e1',
    entrepreneurName: 'Alice Innovator',
    status: 'rejected',
    requestedAt: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
    message: 'Interesting concept, but not the right fit for our current portfolio focus.'
  },
];

export default function EntrepreneurDashboardPage() {
  const [requests, setRequests] = useState<CollaborationRequest[]>(mockRequests);
  const { toast } = useToast();

  const handleAccept = (requestId: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r));
    toast({ title: "Request Accepted", description: "You can now chat with the investor." });
    // API call to update status
  };

  const handleReject = (requestId: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
    toast({ title: "Request Rejected", variant: "default" });
    // API call to update status
  };

  const filteredRequests = (status: CollaborationRequest['status']) => requests.filter(r => r.status === status);

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRequests('pending').map((request) => (
                <RequestCard key={request.id} request={request} onAccept={handleAccept} onReject={handleReject} />
              ))}
            </div>
          ) : <p className="text-center py-10 text-muted-foreground">No pending requests.</p>}
        </TabsContent>
        <TabsContent value="accepted" className="mt-6">
          {filteredRequests('accepted').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRequests('accepted').map((request) => (
                <RequestCard key={request.id} request={request} onAccept={handleAccept} onReject={handleReject} />
              ))}
            </div>
          ) : <p className="text-center py-10 text-muted-foreground">No accepted requests yet.</p>}
        </TabsContent>
        <TabsContent value="rejected" className="mt-6">
          {filteredRequests('rejected').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
