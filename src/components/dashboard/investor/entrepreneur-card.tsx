
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { User, CollaborationRequest } from "@/types";
import { Briefcase, MessageSquare, UserPlus, CheckCircle, Loader2, Eye, XCircle, Send } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAuthenticatedUser } from '@/lib/mockAuth'; 
import { useToast } from "@/hooks/use-toast";
import BookmarkButton from "@/components/dashboard/common/bookmark-button"; // Added import

interface EntrepreneurCardProps {
  entrepreneur: User;
  initialRequestStatus: CollaborationRequest['status'] | 'not_sent';
  onRequestSent: () => void; // Callback to notify parent to refresh data
  isBookmarked: boolean; // Added prop
  onBookmarkToggle: (profileId: string, isBookmarked: boolean) => void; // Added prop
}

export default function EntrepreneurCard({ 
  entrepreneur, 
  initialRequestStatus, 
  onRequestSent,
  isBookmarked,
  onBookmarkToggle 
}: EntrepreneurCardProps) {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentDisplayStatus, setCurrentDisplayStatus] = useState(initialRequestStatus);

  useEffect(() => {
    const user = getAuthenticatedUser(); 
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    setCurrentDisplayStatus(initialRequestStatus);
  }, [initialRequestStatus]);

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
        body: JSON.stringify({ entrepreneurId: entrepreneur.id }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        setCurrentDisplayStatus('not_sent'); 
        throw new Error(responseData.message || `Failed to send request: ${response.statusText}`);
      }
      const createdRequest: CollaborationRequest = responseData;
      setCurrentDisplayStatus(createdRequest.status); 
      toast({
        title: "Request Sent!",
        description: `Your collaboration request to ${entrepreneur.name} has been sent.`,
      });
      onRequestSent(); 
    } catch (error) {
      setCurrentDisplayStatus('not_sent'); 
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
    switch (currentDisplayStatus) {
        case 'pending':
            return <><Send className="mr-2 h-4 w-4" /> Request Sent</>;
        case 'accepted':
            return <><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Accepted</>;
        case 'rejected':
            return <><XCircle className="mr-2 h-4 w-4 text-red-500" /> Rejected</>;
        case 'not_sent':
        default:
            return <><UserPlus className="mr-2 h-4 w-4" /> Request Collaboration</>;
    }
  };

  const isButtonDisabled = () => {
    return isRequesting || currentDisplayStatus === 'pending' || currentDisplayStatus === 'accepted';
  }

  return (
    <Card className="w-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col">
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
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground line-clamp-3">
          {entrepreneur.bio || "A brief bio about the entrepreneur and their venture will appear here. Seeking opportunities for growth and collaboration."}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 mt-auto pt-4 border-t">
        <BookmarkButton
          profileId={entrepreneur.id}
          initialIsBookmarked={isBookmarked}
          onBookmarkToggle={onBookmarkToggle}
          className="w-full sm:w-auto"
        />
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
          <Link href={`/dashboard/profile/user/${entrepreneur.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View Profile
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto" disabled={currentDisplayStatus !== 'accepted'}>
          <Link href={`/dashboard/chat/${entrepreneur.id}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> Message
          </Link>
        </Button>
        <Button 
          size="sm" 
          onClick={handleRequestCollaboration} 
          disabled={isButtonDisabled()}
          className={`w-full sm:w-auto ${
            currentDisplayStatus === 'accepted' ? 'bg-green-600 hover:bg-green-700' : 
            currentDisplayStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 
            currentDisplayStatus === 'pending' ? 'bg-blue-500 hover:bg-blue-600' : 
            'bg-primary hover:bg-primary/90'
          } text-primary-foreground`}
        >
          {getRequestButtonContent()}
        </Button>
      </CardFooter>
    </Card>
  );
}
