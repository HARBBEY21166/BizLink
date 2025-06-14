
'use client';

import type { Notification } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Check } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => Promise<void>;
}

export default function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const getInitials = (name?: string) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
      : 'NN'; // No Name
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  const handleItemClick = async () => {
    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }
    // Navigation will be handled by the Link component if link exists
  };

  const content = (
    <div className="flex items-start space-x-3">
      <Avatar className="h-10 w-10 mt-1">
        <AvatarImage src={notification.actorAvatarUrl || `https://placehold.co/80x80.png?text=${getInitials(notification.actorName)}`} alt={notification.actorName || 'Notification actor'} data-ai-hint="person avatar" />
        <AvatarFallback>{getInitials(notification.actorName)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <p className="text-sm text-foreground">
          {notification.message}
        </p>
        <p className={cn('text-xs', notification.isRead ? 'text-muted-foreground' : 'text-primary font-medium')}>
          {timeAgo}
        </p>
      </div>
      {!notification.isRead && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => {
            e.preventDefault(); // Prevent link navigation if it's part of a link
            e.stopPropagation();
            onMarkAsRead(notification.id);
          }}
          aria-label="Mark as read"
        >
          <Check className="h-4 w-4 text-primary" />
        </Button>
      )}
    </div>
  );

  return (
    <Card
      className={cn(
        'hover:bg-muted/50 transition-colors',
        notification.isRead ? 'bg-card' : 'bg-primary/5 border-primary/30',
        notification.link ? 'cursor-pointer' : ''
      )}
      onClick={notification.link ? handleItemClick : undefined} // Only make card clickable if it's also a link
    >
      <CardContent className="p-3">
        {notification.link ? (
          <Link href={notification.link} passHref legacyBehavior>
            <a className="block focus:outline-none" onClick={handleItemClick}>
              {content}
            </a>
          </Link>
        ) : (
          content
        )}
      </CardContent>
    </Card>
  );
}
