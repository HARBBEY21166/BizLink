import type { ChatMessage, User } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatMessageProps {
  message: ChatMessage;
  currentUser: User; // To determine if message is sent or received
  chatPartner: User; // To display avatar for received messages
}

export default function ChatMessageDisplay({ message, currentUser, chatPartner }: ChatMessageProps) {
  const isSender = message.senderId === currentUser.id;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  const senderAvatar = isSender ? currentUser.avatarUrl : chatPartner.avatarUrl;
  const senderName = isSender ? currentUser.name : chatPartner.name;
  const senderInitials = getInitials(senderName);

  return (
    <div className={cn('flex items-end gap-2 my-3', isSender ? 'justify-end' : 'justify-start')}>
      {!isSender && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={senderAvatar || `https://placehold.co/40x40.png?text=${senderInitials}`} alt={senderName} data-ai-hint="person face" />
          <AvatarFallback>{senderInitials}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2 shadow-md',
          isSender ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none'
        )}
      >
        <p className="text-sm">{message.message}</p>
        <p className={cn('text-xs mt-1', isSender ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left')}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
       {isSender && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={senderAvatar || `https://placehold.co/40x40.png?text=${senderInitials}`} alt={senderName} data-ai-hint="person face" />
          <AvatarFallback>{senderInitials}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
