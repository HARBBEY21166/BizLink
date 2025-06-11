
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { User, CollaborationRequest } from "@/types";
import { Briefcase, MessageSquare, UserPlus, CheckCircle, Loader2, Eye } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAuthenticatedUser } from "@/lib/mockAuth";
import { useToast } from "@/hooks/use-toast";

interface EntrepreneurCardProps {
  entrepreneur: User;
}

export default function EntrepreneurCard({ entrepreneur }: EntrepreneurCardProps) {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestStatus, setRequestStatus] = useState<CollaborationRequest['status'] | null>(null);


  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);

    if (user && typeof window !== 'undefined') {
      const existingRequestsStr = localStorage.getItem('collaborationRequests');
      if (existingRequestsStr) {
        const existingRequests: CollaborationRequest[] = JSON.parse(existingRequestsStr);
        const sentRequest = existingRequests.find(
          req => req.investorId === user.id && req.entrepreneurId === entrepreneur.id
        );
        if (sentRequest) {
          setRequestSent(true);
          setRequestStatus(sentRequest.status);
        }
      }
    }
  }, [entrepreneur.id]);

  const getInitials = (name: string) => {
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
    try {
      await new Promise(resolve => setTimeout(resolve, 700));

      const newRequest: CollaborationRequest = {
        id: `collab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        investorId: currentUser.id,
        investorName: currentUser.name,
        investorBioSnippet: currentUser.bio?.substring(0, 150) || "An interested investor.",
        entrepreneurId: entrepreneur.id,
        entrepreneurName: entrepreneur.name,
        entrepreneurStartup: entrepreneur.startupDescription,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        message: `Hi ${entrepreneur.name}, I'm impressed by ${entrepreneur.startupDescription || 'your venture'} and would like to learn more.`,
      };

      if (typeof window !== 'undefined') {
        const existingRequestsStr = localStorage.getItem('collaborationRequests');
        let allRequests: CollaborationRequest[] = [];
        if (existingRequestsStr) {
          allRequests = JSON.parse(existingRequestsStr);
        }
        // Prevent duplicate pending requests
        const alreadyPending = allRequests.some(req => req.investorId === currentUser.id && req.entrepreneurId === entrepreneur.id && req.status === 'pending');
        if (alreadyPending) {
            toast({
                title: "Request Already Pending",
                description: `You already have a pending request with ${entrepreneur.name}.`,
                variant: "default"
            });
            setIsRequesting(false);
            return;
        }
        allRequests.push(newRequest);
        localStorage.setItem('collaborationRequests', JSON.stringify(allRequests));
      }

      toast({
        title: "Request Sent!",
        description: `Your collaboration request to ${entrepreneur.name} has been sent.`,
      });
      setRequestSent(true);
      setRequestStatus('pending');
    } catch (error) {
      toast({
        title: "Error Sending Request",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };
  
  const getRequestButtonText = () => {
    if (isRequesting) return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    if (requestSent) {
      if (requestStatus === 'accepted') return <><CheckCircle className="mr-2 h-4 w-4" /> Accepted</>;
      if (requestStatus === 'rejected') return <> <UserPlus className="mr-2 h-4 w-4" /> Rejected</>; // Or some other icon like XCircle
      return <><CheckCircle className="mr-2 h-4 w-4" /> Request Sent</>;
    }
    return <><UserPlus className="mr-2 h-4 w-4" /> Request Collaboration</>;
  };

  const getRequestButtonClass = () => {
    if (requestSent) {
        if (requestStatus === 'accepted') return "bg-green-600 hover:bg-green-700 text-white";
        if (requestStatus === 'rejected') return "bg-red-600 hover:bg-red-700 text-white";
        return "bg-primary hover:bg-primary/90 text-primary-foreground"; // Pending
    }
    return "bg-primary hover:bg-primary/90 text-primary-foreground"; // Default
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
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
          <Link href={`/dashboard/chat/${entrepreneur.id}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> Message
          </Link>
        </Button>
        <Button 
          size="sm" 
          onClick={handleRequestCollaboration} 
          disabled={isRequesting || (requestSent && requestStatus !== 'rejected')} // Allow re-request if rejected
          className={`${getRequestButtonClass()} w-full sm:w-auto`}
        >
          {getRequestButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
}
