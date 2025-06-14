
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { getAuthenticatedUser } from '@/lib/mockAuth';
import type { Conversation, User } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Loader2, Search, MessageSquarePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';


export default function ChatListPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchConversations = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch conversations');
      }
      const data: Conversation[] = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Fetch conversations error:', error);
      toast({
        variant: 'destructive',
        title: 'Error Loading Chats',
        description: error instanceof Error ? error.message : 'Could not load your conversations.',
      });
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    const token = localStorage.getItem('bizlinkToken');

    if (user && token) {
      fetchConversations(token);
    } else {
      setIsLoading(false);
      setConversations([]);
    }
  }, [fetchConversations]);
  
  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const filteredConversations = conversations.filter(conv => 
    conv.participantB.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Chats...</span></div>;
  }
  
  if (!currentUser && !isLoading) {
    return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Please log in to view your messages.</p></div>;
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="font-headline text-3xl font-bold text-foreground">Messages</h1>
        <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Search conversations..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {filteredConversations.length > 0 ? (
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-0 h-full overflow-y-auto">
            <ul className="divide-y divide-border">
              {filteredConversations.map((conv) => (
                <li key={conv.id}>
                  <Link href={`/dashboard/chat/${conv.id}`} className="block hover:bg-muted/50 transition-colors">
                    <div className="flex items-center p-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conv.participantB.avatarUrl || `https://placehold.co/80x80.png?text=${getInitials(conv.participantB.name)}`} alt={conv.participantB.name} data-ai-hint="person face"/>
                        <AvatarFallback>{getInitials(conv.participantB.name)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between items-center">
                           <h3 className="font-semibold font-headline">{conv.participantB.name}</h3>
                           {conv.lastMessage && (
                             <p className="text-xs text-muted-foreground">
                               {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </p>
                           )}
                        </div>
                        {conv.lastMessage ? (
                          <p className={cn("text-sm text-muted-foreground truncate", conv.unreadCount && conv.unreadCount > 0 && "font-bold text-foreground")}>
                            {conv.lastMessage.senderId === currentUser?.id ? "You: " : ""}{conv.lastMessage.message}
                          </p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No messages yet.</p>
                        )}
                      </div>
                      {conv.unreadCount && conv.unreadCount > 0 && (
                        <div className="ml-auto flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 flex-1 flex flex-col items-center justify-center">
          <MessageSquarePlus className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">No conversations yet.</p>
          <p className="text-sm text-muted-foreground">Start networking to initiate chats, or check back later if you've recently started one.</p>
        </div>
      )}
    </div>
  );
}
