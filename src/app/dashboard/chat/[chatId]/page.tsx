'use client';

import ChatInput from '@/components/dashboard/chat/chat-input';
import ChatMessageDisplay from '@/components/dashboard/chat/chat-message';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAuthenticatedUser } from '@/lib/mockAuth';
import type { ChatMessage, User } from '@/types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

// Mock data - replace with API calls and real-time updates
const mockChatPartners: Record<string, User> = {
  'i1': { id: 'i1', name: 'Victoria Venture', email: 'victoria@example.com', role: 'investor', createdAt: new Date().toISOString(), avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: "woman executive" },
  'e2': { id: 'e2', name: 'Bob Builder', email: 'bob@example.com', role: 'entrepreneur', startupDescription: 'LearnAI Co.', createdAt: new Date().toISOString(), avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: "man developer" },
};

const mockMessages: Record<string, ChatMessage[]> = {
  'i1': [
    { id: 'm1', senderId: 'i1', receiverId: 'currentUser', message: 'Hello! Interested in your startup.', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'm2', senderId: 'currentUser', receiverId: 'i1', message: 'Hi Victoria! Thanks for reaching out. What specifically caught your eye?', timestamp: new Date(Date.now() - 4 * 60000).toISOString() },
    { id: 'm3', senderId: 'i1', receiverId: 'currentUser', message: 'Your innovative approach to sustainable tech is impressive. Could we schedule a call?', timestamp: new Date(Date.now() - 3 * 60000).toISOString() },
  ],
   'e2': [
    { id: 'm4', senderId: 'currentUser', receiverId: 'e2', message: 'Hey Bob, saw your profile. Impressive work with LearnAI!', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'm5', senderId: 'e2', receiverId: 'currentUser', message: 'Thanks! Appreciate that. Are you an investor?', timestamp: new Date(Date.now() - 9 * 60000).toISOString() },
  ],
};


export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chatPartner, setChatPartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);

    if (user && chatId) {
      const partner = mockChatPartners[chatId]; // Fetch partner details
      setChatPartner(partner);
      
      // Replace 'currentUser' in mockMessages sender/receiver IDs with actual current user ID
      const chatMessages = (mockMessages[chatId] || []).map(msg => ({
        ...msg,
        senderId: msg.senderId === 'currentUser' ? user.id : msg.senderId,
        receiverId: msg.receiverId === 'currentUser' ? user.id : msg.receiverId,
      }));
      setMessages(chatMessages);
    }
    setIsLoading(false);
  }, [chatId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (messageText: string) => {
    if (!currentUser || !chatPartner) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: chatPartner.id,
      message: messageText,
      timestamp: new Date().toISOString(),
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    // In a real app, send this message via Socket.io or API
  };
  
  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!currentUser || !chatPartner) {
    return <p className="text-center py-10 text-muted-foreground">Chat not found or user not authenticated.</p>;
  }
  
  return (
    <div className="flex flex-col h-full bg-card shadow-lg rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b bg-background">
        <Button variant="ghost" size="icon" asChild className="mr-2 md:hidden">
          <Link href="/dashboard/chat">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={chatPartner.avatarUrl || `https://placehold.co/80x80.png?text=${getInitials(chatPartner.name)}`} alt={chatPartner.name} data-ai-hint="person profile" />
          <AvatarFallback>{getInitials(chatPartner.name)}</AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <h2 className="font-semibold font-headline text-lg">{chatPartner.name}</h2>
          <p className="text-xs text-muted-foreground capitalize">{chatPartner.role}</p>
        </div>
        {/* Optional: Online/Offline status indicator */}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map((msg) => (
          <ChatMessageDisplay key={msg.id} message={msg} currentUser={currentUser} chatPartner={chatPartner} />
        ))}
      </ScrollArea>

      {/* Message Input */}
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
