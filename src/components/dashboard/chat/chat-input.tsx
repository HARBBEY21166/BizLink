'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-4 bg-background">
      <Input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 rounded-full px-4 py-2 border-border focus-visible:ring-primary"
        disabled={isLoading}
      />
      <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90" disabled={isLoading || !message.trim()}>
        <Send className="h-5 w-5 text-primary-foreground" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}
