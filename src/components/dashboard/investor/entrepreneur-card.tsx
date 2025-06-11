
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { User, CollaborationRequest } from "@/types";
import { Briefcase, MessageSquare, UserPlus, CheckCircle, Loader2 } from "lucide-react";
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

  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);

    // Check if a request was already sent to this entrepreneur by this investor
    if (user && typeof window !== 'undefined') {
      const existingRequestsStr = localStorage.getItem('collaborationRequests');
      if (existingRequestsStr) {
        const existingRequests: CollaborationRequest[] = JSON.parse(existingRequestsStr);
        const alreadySent = existingRequests.some(
          req => req.investorId === user.id && req.entrepreneurId === entrepreneur.id
        );
        setRequestSent(alreadySent);
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
      // Simulate API delay
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
        allRequests.push(newRequest);
        localStorage.setItem('collaborationRequests', JSON.stringify(allRequests));
      }

      toast({
        title: "Request Sent!",
        description: `Your collaboration request to ${entrepreneur.name} has been sent.`,
      });
      setRequestSent(true);
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
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/chat/${entrepreneur.id}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> Message
          </Link>
        </Button>
        <Button 
          size="sm" 
          onClick={handleRequestCollaboration} 
          disabled={isRequesting || requestSent}
          className={requestSent ? "bg-green-600 hover:bg-green-700 text-white" : ""}
        >
          {isRequesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : requestSent ? (
            <CheckCircle className="mr-2 h-4 w-4" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          {requestSent ? "Request Sent" : "Request Collaboration"}
        </Button>
      </CardFooter>
    </Card>
  );
}
