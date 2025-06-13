
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
import { io, type Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';


export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string; // This is the chatPartner's ID
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chatPartner, setChatPartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [isLoadingPartner, setIsLoadingPartner] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize current user
  useEffect(() => {
    const user = getAuthenticatedUser();
    console.log('[ChatPage] Current Authenticated User:', user);
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
      if (!chatId && currentUser) console.warn("[ChatPage] Chat partner ID missing.");
      if (!currentUser) console.warn("[ChatPage] Current user not loaded for partner fetch.");
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
    console.log(`[ChatPage] Fetching chat partner with ID: ${chatId}`);
    fetch(`/api/users/${chatId}`)
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `Failed to load chat partner (Status: ${res.status})` }));
          throw new Error(errorData.message);
        }
        return res.json();
      })
      .then((data: User) => {
        console.log('[ChatPage] Chat Partner Fetched:', data);
        setChatPartner(data);
      })
      .catch((err) => {
        console.error("[ChatPage] Error fetching chat partner:", err);
        setPartnerError(err.message || "Could not load chat partner details.");
        setChatPartner(null);
      })
      .finally(() => setIsLoadingPartner(false));
  }, [chatId, currentUser]);

  // Fetch historical messages
  useEffect(() => {
    if (!currentUser || !chatPartner) {
        if (!currentUser) console.warn("[ChatPage] Current user not available for fetching messages.");
        if (!chatPartner) console.warn("[ChatPage] Chat partner not available for fetching messages.");
        setIsLoadingMessages(false);
        return;
    }
    const token = localStorage.getItem('bizlinkToken');
    if (!token) {
        setMessagesError("Authentication token not found for fetching messages.");
        setIsLoadingMessages(false);
        return;
    }

    setIsLoadingMessages(true);
    setMessagesError(null);
    console.log(`[ChatPage] Fetching messages for partner: ${chatPartner.id}`);
    fetch(`/api/messages/${chatPartner.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `Failed to load messages (Status: ${res.status})` }));
          throw new Error(errorData.message);
        }
        return res.json();
      })
      .then((data: ChatMessage[]) => {
        console.log('[ChatPage] Historical Messages Fetched:', data);
        setMessages(data);
      })
      .catch((err) => {
        console.error("[ChatPage] Error fetching messages:", err);
        setMessagesError(err.message || "Could not load messages.");
        setMessages([]);
      })
      .finally(() => setIsLoadingMessages(false));
  }, [currentUser, chatPartner]);


  // Socket.IO setup
  useEffect(() => {
    if (!currentUser) {
      console.log('[ChatPage SocketSetup] No current user, skipping socket setup.');
      return;
    }

    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
    console.log('[ChatPage SocketSetup] Attempting to connect to Socket.IO server at:', socketServerUrl);

    if (!socketServerUrl) {
        console.error("[ChatPage SocketSetup] NEXT_PUBLIC_SOCKET_SERVER_URL is not set!");
        setSocketError("Socket server URL is not configured in environment variables.");
        return; // Do not attempt to connect if URL is missing
    }

    const newSocket = io(socketServerUrl);
    setSocket(newSocket);
    setSocketError(null);

    newSocket.on('connect', () => {
      console.log('[ChatPage Socket.IO] Connected to server:', newSocket.id);
      setSocketConnected(true);
      setSocketError(null);
      if (currentUser?.id) {
        newSocket.emit('storeUserId', currentUser.id);
        console.log('[ChatPage Socket.IO] Emitted storeUserId:', currentUser.id);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('[ChatPage Socket.IO] Connection error:', err);
      setSocketError(`Connection failed: ${err.message}. Ensure the socket server is running and accessible.`);
      setSocketConnected(false);
      toast({ variant: 'destructive', title: 'Chat Error', description: 'Could not connect to chat server.'});
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[ChatPage Socket.IO] Disconnected from server:', reason);
      setSocketConnected(false);
      if (reason !== 'io client disconnect') { 
        setSocketError('Disconnected from chat server. Attempting to reconnect...');
      }
    });

    newSocket.on('receiveMessage', (newMessage: ChatMessage) => {
      console.log('[ChatPage Socket.IO] Received message:', newMessage);
      setMessages((prevMessages) => {
        if (newMessage.tempId) {
          const existingMsgIndex = prevMessages.findIndex(msg => msg.tempId === newMessage.tempId);
          if (existingMsgIndex > -1) {
            const updatedMessages = [...prevMessages];
            updatedMessages[existingMsgIndex] = { ...newMessage, tempId: undefined };
            return updatedMessages;
          }
        }
        if (!prevMessages.some(msg => msg.id === newMessage.id)) {
            return [...prevMessages, newMessage];
        }
        return prevMessages;
      });
    });

    newSocket.on('messageError', ({ tempId, error }: {tempId?: string, error: string}) => {
        console.error(`[ChatPage Socket.IO] Message error (tempId: ${tempId}):`, error);
        toast({variant: 'destructive', title: 'Message Failed', description: error});
        if (tempId) {
            setMessages(prev => prev.map(m => m.tempId === tempId ? {...m, message: `${m.message} (Failed to send)`} : m));
        }
    });

    return () => {
      console.log('[ChatPage Socket.IO] Disconnecting socket.');
      newSocket.disconnect();
      setSocket(null);
      setSocketConnected(false);
    };
  }, [currentUser, toast]); // Only currentUser and toast are direct dependencies for setting up the socket.

  // Join chat room once socket is connected and chatPartner is identified
  useEffect(() => {
    if (socket && socketConnected && currentUser && chatPartner) {
      console.log(`[ChatPage Socket.IO] Emitting joinChat for partner: ${chatPartner.id}`);
      socket.emit('joinChat', { chatPartnerId: chatPartner.id });
    }
  }, [socket, socketConnected, currentUser, chatPartner]);


  // Scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback((messageText: string) => {
    if (!socket || !socketConnected) {
        toast({variant: 'destructive', title: 'Chat Error', description: 'Not connected to chat server.'});
        return;
    }
    if (!currentUser || !chatPartner) {
      toast({variant: 'destructive', title: 'Chat Error', description: 'User or chat partner not identified.'});
      return;
    }

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
    console.log('[ChatPage Socket.IO] Emitting sendMessage:', optimisticMessage);
    socket.emit('sendMessage', { 
        senderId: currentUser.id, 
        receiverId: chatPartner.id, 
        message: messageText,
        tempId: tempId 
    });
  }, [socket, socketConnected, currentUser, chatPartner, toast]);
  
  const getInitials = (name: string = "") => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const overallLoading = isLoadingPartner || (isLoadingMessages && !messagesError);

  if (!currentUser && !isLoadingPartner && !isLoadingMessages) { // Added !isLoadingMessages to wait for partner check
     return <div className="flex items-center justify-center h-full"><p className="text-center py-10 text-muted-foreground">User not authenticated. Please log in.</p></div>;
  }
  
  if (currentUser && currentUser.id === chatId && !isLoadingPartner) {
     return <div className="flex items-center justify-center h-full"><p className="text-center py-10 text-muted-foreground">Cannot chat with yourself.</p></div>;
  }

  if (overallLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading chat...</span></div>;
  }
  
  if (partnerError || !chatPartner) { // If partnerError is set or chatPartner is null after loading
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
             {socketConnected ? (
                <>
                    <div className={`h-2.5 w-2.5 rounded-full ${chatPartner.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <p className="text-xs text-muted-foreground capitalize">
                    {chatPartner.isOnline ? 'Online' : 'Offline'} - {chatPartner.role}
                    </p>
                </>
             ) : (
                <>
                    <WifiOff className="h-3 w-3 text-destructive" />
                    <p className="text-xs text-destructive">Chat Disconnected</p>
                </>
             )}
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
      
      {socketError && <p className="text-xs text-destructive text-center p-2 bg-destructive/10">{socketError}</p>}
      <ChatInput onSendMessage={handleSendMessage} isLoading={!socketConnected || isLoadingPartner || isLoadingMessages} />
    </div>
  );
}

