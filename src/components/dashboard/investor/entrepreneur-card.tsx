
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { User, CollaborationRequest } from "@/types";
import { Briefcase, MessageSquare, UserPlus, CheckCircle, Loader2, Eye, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAuthenticatedUser } from '@/lib/mockAuth'; // For current user context for now
import { useToast } from "@/hooks/use-toast";

interface EntrepreneurCardProps {
  entrepreneur: User;
  // We will need to fetch existing requests or pass them down if this card needs to know status
  // For now, it will assume no prior request unless it successfully makes one.
}

export default function EntrepreneurCard({ entrepreneur }: EntrepreneurCardProps) {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<CollaborationRequest['status'] | 'not_sent' | 'error_sending'>('not_sent');
  const [sentRequestId, setSentRequestId] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuthenticatedUser(); // This uses localStorage
    setCurrentUser(user);
    // In a real app with full backend state, you might fetch existing request status here
    // For now, we'll simplify and only track requests made in this session or if the page re-fetches data.
  }, [entrepreneur.id]);

  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleRequestCollaboration = async () => {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "Please log in to send requests.", variant: "destructive" });
      return;
    }
    if (currentUser.role !== 'investor') {
        toast({ title: "Permission Denied", description: "Only investors can send collaboration requests.", variant: "destructive" });
        return;
    }

    setIsRequesting(true);
    setRequestStatus('not_sent'); // Reset status for new attempt

    const token = localStorage.getItem('bizlinkToken');
    if (!token) {
        toast({ title: "Authentication Error", description: "Missing token.", variant: "destructive" });
        setIsRequesting(false);
        return;
    }

    try {
      const response = await fetch('/api/collaboration-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ entrepreneurId: entrepreneur.id }), // Add message field if desired
      });

      const responseData = await response.json();

      if (!response.ok) {
        setRequestStatus('error_sending');
        throw new Error(responseData.message || `Failed to send request: ${response.statusText}`);
      }
      
      const createdRequest: CollaborationRequest = responseData;
      setSentRequestId(createdRequest.id);
      setRequestStatus(createdRequest.status); // Should be 'pending'

      toast({
        title: "Request Sent!",
        description: `Your collaboration request to ${entrepreneur.name} has been sent.`,
      });
    } catch (error) {
      setRequestStatus('error_sending');
      toast({
        title: "Error Sending Request",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };
  
  const getRequestButtonContent = () => {
    if (isRequesting) return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>;
    switch (requestStatus) {
        case 'pending':
            return <><CheckCircle className="mr-2 h-4 w-4" /> Request Sent</>;
        case 'accepted':
            return <><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Accepted</>;
        case 'rejected':
            return <><XCircle className="mr-2 h-4 w-4 text-red-500" /> Rejected</>;
        case 'error_sending':
             return <><UserPlus className="mr-2 h-4 w-4" /> Request Collaboration</>; // Allow retry
        case 'not_sent':
        default:
            return <><UserPlus className="mr-2 h-4 w-4" /> Request Collaboration</>;
    }
  };

  const isButtonDisabled = () => {
    return isRequesting || requestStatus === 'pending' || requestStatus === 'accepted';
    // Allow re-sending if rejected or if there was an error
  }


  return (
    <Card className="w-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={entrepreneur.avatarUrl || `https://placehold.co/100x100.png?text=${getInitials(entrepreneur.name)}`} alt={entrepreneur.name} data-ai-hint="person business" />
          <AvatarFallback>{getInitials(entrepreneur.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">{entrepreneur.name}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            {entrepreneur.startupDescription || "Innovative Startup"}
          </CardDescription>
           <p className="text-xs text-muted-foreground mt-1">Funding Need: {entrepreneur.fundingNeed || "Not specified"}</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground line-clamp-3">
          {entrepreneur.bio || "A brief bio about the entrepreneur and their venture will appear here. Seeking opportunities for growth and collaboration."}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
          <Link href={`/dashboard/profile/user/${entrepreneur.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View Profile
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto" disabled={requestStatus !== 'accepted'}>
          <Link href={`/dashboard/chat/${entrepreneur.id}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> Message
          </Link>
        </Button>
        <Button 
          size="sm" 
          onClick={handleRequestCollaboration} 
          disabled={isButtonDisabled()}
          className={`w-full sm:w-auto ${
            requestStatus === 'accepted' ? 'bg-green-600 hover:bg-green-700' : 
            requestStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 
            'bg-primary hover:bg-primary/90'
          } text-primary-foreground`}
        >
          {getRequestButtonContent()}
        </Button>
      </CardFooter>
    </Card>
  );
}

