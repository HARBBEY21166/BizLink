'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { getAuthenticatedUser } from '@/lib/mockAuth';
import type { Conversation, User } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader2, Search, MessageSquarePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';


// Mock data
const mockConversations: Conversation[] = [
  {
    id: 'i1', // This ID will be used as chatId, typically the other user's ID
    participantA: { id: 'currentUser', name: 'Me', email: '', role: 'entrepreneur', createdAt: '' }, // Placeholder for current user
    participantB: { id: 'i1', name: 'Victoria Venture', email: 'victoria@example.com', role: 'investor', createdAt: '', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: "woman ceo" },
    lastMessage: { id: 'm3', senderId: 'i1', receiverId: 'currentUser', message: 'Could we schedule a call?', timestamp: new Date(Date.now() - 3 * 60000).toISOString() },
    unreadCount: 1,
  },
  {
    id: 'e2',
    participantA: { id: 'currentUser', name: 'Me', email: '', role: 'investor', createdAt: '' },
    participantB: { id: 'e2', name: 'Bob Builder', email: 'bob@example.com', role: 'entrepreneur', createdAt: '', startupDescription: "LearnAI Co.", avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: "man tech" },
    lastMessage: { id: 'm5', senderId: 'e2', receiverId: 'currentUser', message: 'Thanks! Appreciate that. Are you an investor?', timestamp: new Date(Date.now() - 9 * 60000).toISOString() },
    unreadCount: 0,
  },
  {
    id: 'i3',
    participantA: { id: 'currentUser', name: 'Me', email: '', role: 'entrepreneur', createdAt: '' },
    participantB: { id: 'i3', name: 'Sarah Strategist', email: 'sarah@example.com', role: 'investor', createdAt: '', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: "business person" },
    lastMessage: { id: 'm6', senderId: 'i3', receiverId: 'currentUser', message: "Let's connect next week.", timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString() }, // 2 hours ago
    unreadCount: 3,
  }
];


export default function ChatListPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    if (user) {
      // In a real app, fetch conversations for `user.id`
      // For mock, replace 'currentUser' in participantA with the actual user details
      const userConversations = mockConversations.map(conv => ({
        ...conv,
        participantA: conv.participantA.id === 'currentUser' ? user : conv.participantA,
      }));
      setConversations(userConversations);
    }
    setIsLoading(false);
  }, []);
  
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
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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
                        {conv.lastMessage && (
                          <p className={cn("text-sm text-muted-foreground truncate", conv.unreadCount && conv.unreadCount > 0 && "font-bold text-foreground")}>
                            {conv.lastMessage.senderId === currentUser?.id ? "You: " : ""}{conv.lastMessage.message}
                          </p>
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
          <p className="text-sm text-muted-foreground">Start networking to initiate chats.</p>
        </div>
      )}
    </div>
  );
}
