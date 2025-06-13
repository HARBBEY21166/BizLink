
'use client';

import ChatInput from '@/components/dashboard/chat/chat-input';
import ChatMessageDisplay from '@/components/dashboard/chat/chat-message';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAuthenticatedUser } from '@/lib/mockAuth';
import type { ChatMessage, User } from '@/types';
import { ArrowLeft, Loader2, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const POLLING_INTERVAL = 5000; // 5 seconds

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string; // This is the chatPartner's ID
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chatPartner, setChatPartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [isLoadingPartner, setIsLoadingPartner] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingMessagesRef = useRef(false); // To prevent concurrent fetches

  // Initialize current user
  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    if (!user) {
      setPartnerError("Current user not authenticated.");
      setIsLoadingPartner(false);
      setIsLoadingMessages(false);
    }
  }, []);

  // Fetch chat partner details
  useEffect(() => {
    if (!currentUser || !chatId) {
      setIsLoadingPartner(false);
      return;
    }
    if (currentUser.id === chatId) {
      setPartnerError("Cannot initiate a chat with yourself.");
      setIsLoadingPartner(false);
      setIsLoadingMessages(false);
      return;
    }
    
    setIsLoadingPartner(true);
    setPartnerError(null);
    fetch(`/api/users/${chatId}`)
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `Failed to load chat partner (Status: ${res.status})` }));
          throw new Error(errorData.message);
        }
        return res.json();
      })
      .then((data: User) => setChatPartner(data))
      .catch((err) => {
        setPartnerError(err.message || "Could not load chat partner details.");
        setChatPartner(null);
      })
      .finally(() => setIsLoadingPartner(false));
  }, [chatId, currentUser]);

  // Function to fetch messages
  const fetchMessages = useCallback(async (isInitialFetch = false) => {
    if (!currentUser || !chatPartner || isFetchingMessagesRef.current) {
      if (isInitialFetch) setIsLoadingMessages(false);
      return;
    }
    
    isFetchingMessagesRef.current = true;
    if (isInitialFetch) {
        setIsLoadingMessages(true);
        setMessagesError(null);
    }

    const token = localStorage.getItem('bizlinkToken');
    if (!token) {
        if (isInitialFetch) {
            setMessagesError("Authentication token not found for fetching messages.");
            setIsLoadingMessages(false);
        }
        isFetchingMessagesRef.current = false;
        return;
    }

    try {
      const response = await fetch(`/api/messages/${chatPartner.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to load messages (Status: ${response.status})` }));
        throw new Error(errorData.message);
      }
      const data: ChatMessage[] = await response.json();
      setMessages(data);
    } catch (err) {
      if (isInitialFetch) {
        setMessagesError(err instanceof Error ? err.message : "Could not load messages.");
      }
      // Don't show toast for polling errors unless it's critical
      console.error("[ChatPage] Error fetching messages:", err);
    } finally {
      if (isInitialFetch) {
        setIsLoadingMessages(false);
      }
      isFetchingMessagesRef.current = false;
    }
  }, [currentUser, chatPartner]);

  // Initial fetch and setup polling
  useEffect(() => {
    if (currentUser && chatPartner) {
      fetchMessages(true); // Initial fetch

      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      // Setup polling
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(false);
      }, POLLING_INTERVAL);
    }
    // Cleanup polling on component unmount or when dependencies change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [currentUser, chatPartner, fetchMessages]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!currentUser || !chatPartner) {
      toast({variant: 'destructive', title: 'Chat Error', description: 'User or chat partner not identified.'});
      return;
    }
    const token = localStorage.getItem('bizlinkToken');
    if (!token) {
      toast({variant: 'destructive', title: 'Chat Error', description: 'Authentication token not found.'});
      return;
    }

    setIsSendingMessage(true);

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId, 
      tempId: tempId,
      senderId: currentUser.id,
      receiverId: chatPartner.id,
      message: messageText,
      timestamp: new Date().toISOString(),
      isRead: false, 
    };
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);

    try {
      const response = await fetch(`/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: chatPartner.id,
          message: messageText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }
      // const savedMessage: ChatMessage = await response.json();
      // Message will be updated by the next poll. Or we can manually update it here.
      // For simplicity, let polling handle it.
      // Or, remove optimistic and refetch immediately:
      setMessages(prev => prev.filter(m => m.id !== tempId)); // Remove optimistic
      await fetchMessages(false); // Refetch messages immediately

    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId)); // Remove optimistic on error
      toast({variant: 'destructive', title: 'Message Failed', description: error instanceof Error ? error.message : "Could not send message."});
      // Optionally, re-add optimistic message with error state if desired
    } finally {
      setIsSendingMessage(false);
    }
  }, [currentUser, chatPartner, toast, fetchMessages]);
  
  const getInitials = (name: string = "") => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const overallLoading = isLoadingPartner || (isLoadingMessages && !messagesError);

  if (!currentUser && !isLoadingPartner && !isLoadingMessages) { 
     return <div className="flex items-center justify-center h-full"><p className="text-center py-10 text-muted-foreground">User not authenticated. Please log in.</p></div>;
  }
  
  if (currentUser && currentUser.id === chatId && !isLoadingPartner) {
     return <div className="flex items-center justify-center h-full"><p className="text-center py-10 text-muted-foreground">Cannot chat with yourself.</p></div>;
  }

  if (overallLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading chat...</span></div>;
  }
  
  if (partnerError || !chatPartner) { 
    return <p className="text-center py-10 text-destructive">Error: {partnerError || "Could not load chat partner details. Ensure they exist and you have permission."}</p>;
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
        {messagesError && <p className="text-center text-destructive">Error loading messages: {messagesError}</p>}
        {!messagesError && messages.length === 0 && !isLoadingMessages && (
            <p className="text-center text-muted-foreground py-10">No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => (
          <ChatMessageDisplay key={msg.id || msg.tempId} message={msg} currentUser={currentUser!} chatPartner={chatPartner!} />
        ))}
      </ScrollArea>
      
      <ChatInput onSendMessage={handleSendMessage} isLoading={isSendingMessage || isLoadingPartner || isLoadingMessages} />
    </div>
  );
}
