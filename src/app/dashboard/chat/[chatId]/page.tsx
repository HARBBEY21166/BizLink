
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

// Mock data - replace with API calls and real-time updates for messages
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
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    console.log("ChatPage useEffect: Fired. ChatId from params:", chatId);
    setIsLoading(true);
    setErrorReason(null); // Reset error reason

    const user = getAuthenticatedUser();
    setCurrentUser(user);
    console.log("ChatPage useEffect: currentUser from localStorage:", user);

    if (!user) {
      console.error("ChatPage useEffect Error: No authenticated user found (currentUser is null).");
      setChatPartner(null);
      setErrorReason("Current user not authenticated.");
      setIsLoading(false);
      return;
    }

    if (!chatId) {
      console.error("ChatPage useEffect Error: No chatId provided in URL params.");
      setChatPartner(null);
      setErrorReason("Chat partner ID missing from URL.");
      setIsLoading(false);
      return;
    }

    if (user.id === chatId) {
        console.warn("ChatPage useEffect Warning: Attempting to chat with oneself. User ID and Chat ID are the same:", chatId);
        setChatPartner(null); 
        setErrorReason("Cannot initiate a chat with yourself.");
        setIsLoading(false);
        return;
    }

    async function fetchChatPartnerAndMessages(partnerId: string) {
      console.log("ChatPage fetchChatPartnerAndMessages: Fetching partner with ID:", partnerId);
      try {
        const response = await fetch(`/api/users/${partnerId}`);
        console.log("ChatPage fetchChatPartnerAndMessages: API response status for partner:", response.status);
        if (!response.ok) {
          setChatPartner(null);
          if (response.status === 404) {
            console.warn(`ChatPage fetchChatPartnerAndMessages: Chat partner with ID ${partnerId} not found (404).`);
            setErrorReason(`Chat partner (ID: ${partnerId}) not found.`);
          } else {
            const errorText = await response.text().catch(() => "Could not read error text");
            console.error(`ChatPage fetchChatPartnerAndMessages: Failed to fetch chat partner. Status: ${response.status}. Response: ${errorText}`);
            setErrorReason(`Failed to load chat partner (Status: ${response.status}).`);
          }
        } else {
          const partnerData: User = await response.json();
          console.log("ChatPage fetchChatPartnerAndMessages: Successfully fetched chatPartner:", partnerData);
          setChatPartner(partnerData);
          
          // Still using mock messages, keyed by chatPartner.id (which is chatId)
          // Ensure 'user' is the one from the top of useEffect, not a stale closure.
          const currentAuthUser = getAuthenticatedUser(); // Re-fetch to be absolutely sure for message mapping
          if (currentAuthUser) {
            const chatMsgs = (mockMessages[partnerId as string] || []).map(msg => ({
              ...msg,
              senderId: msg.senderId === 'currentUser' ? currentAuthUser.id : msg.senderId,
              receiverId: msg.receiverId === 'currentUser' ? currentAuthUser.id : msg.receiverId,
            }));
            setMessages(chatMsgs);
            console.log("ChatPage fetchChatPartnerAndMessages: Mock messages set for partnerId:", partnerId);
          } else {
            console.warn("ChatPage fetchChatPartnerAndMessages: currentUser became null before setting messages.");
            setMessages([]);
          }
        }
      } catch (err) {
        console.error("ChatPage fetchChatPartnerAndMessages: Error during fetch operation:", err);
        setChatPartner(null);
        setErrorReason("An unexpected error occurred while fetching chat partner data.");
      } finally {
        console.log("ChatPage fetchChatPartnerAndMessages: Setting isLoading to false.");
        setIsLoading(false);
      }
    }

    fetchChatPartnerAndMessages(chatId);

  }, [chatId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (messageText: string) => {
    if (!currentUser || !chatPartner) {
        console.warn("handleSendMessage: Cannot send message, currentUser or chatPartner is null.");
        return;
    }

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: chatPartner.id,
      message: messageText,
      timestamp: new Date().toISOString(),
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    // TODO: Send message to backend API
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
    // Determine a more specific reason if not already set by useEffect
    let displayReason = errorReason;
    if (!displayReason) {
        if (!currentUser && !chatPartner) {
            displayReason = "User authentication and chat partner details are missing.";
        } else if (!currentUser) {
            displayReason = "User not authenticated or session expired.";
        } else if (!chatPartner) {
            displayReason = "Chat partner not found or could not be loaded.";
        } else {
            displayReason = "Please try again or select a different chat."
        }
    }
    console.warn(`ChatPage render: Displaying 'Chat not found or user not authenticated'. Reason: ${displayReason}. CurrentUser exists: ${!!currentUser}, ChatPartner exists: ${!!chatPartner}`);
    return <p className="text-center py-10 text-muted-foreground">Chat not found or user not authenticated. ({displayReason})</p>;
  }
  
  return (
    <div className="flex flex-col h-full bg-card shadow-lg rounded-lg overflow-hidden">
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
          <div className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${chatPartner.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <p className="text-xs text-muted-foreground capitalize">
              {chatPartner.isOnline ? 'Online' : 'Offline'} - {chatPartner.role}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map((msg) => (
          <ChatMessageDisplay key={msg.id} message={msg} currentUser={currentUser} chatPartner={chatPartner} />
        ))}
      </ScrollArea>

      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
