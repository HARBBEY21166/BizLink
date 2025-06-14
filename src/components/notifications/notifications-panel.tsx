
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Notification } from '@/types';
import NotificationItem from './notification-item';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, BellOff, CheckCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface NotificationsPanelProps {
  onClose?: () => void; // Optional: To close the panel after an action
  onUnreadCountChange: (count: number) => void;
}

export default function NotificationsPanel({ onClose, onUnreadCountChange }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('bizlinkToken');
    if (!token) {
      setError("Not authenticated.");
      setIsLoading(false);
      onUnreadCountChange(0);
      return;
    }
    try {
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch notifications');
      }
      const data: Notification[] = await response.json();
      setNotifications(data);
      onUnreadCountChange(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Error loading notifications', description: errorMessage });
      onUnreadCountChange(0);
    } finally {
      setIsLoading(false);
    }
  }, [toast, onUnreadCountChange]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    const token = localStorage.getItem('bizlinkToken');
    if (!token) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to mark as read');
      }
      // Optimistically update UI or refetch
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      onUnreadCountChange(notifications.filter(n => !n.isRead && n.id !== notificationId).length);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not mark notification as read.';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('bizlinkToken');
    if (!token) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT', // This marks all as read on the base route
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to mark all as read');
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      onUnreadCountChange(0);
      toast({ title: 'Success', description: 'All notifications marked as read.' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not mark all notifications as read.';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="p-4 text-center text-destructive">{error}</p>;
  }

  return (
    <div className="flex flex-col h-full max-h-[70vh] w-full sm:w-[380px]">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold font-headline">Notifications</h3>
        {notifications.some(n => !n.isRead) && (
            <Button variant="link" size="sm" onClick={handleMarkAllAsRead} className="text-primary hover:text-primary/80">
                <CheckCheck className="mr-1 h-4 w-4" /> Mark all as read
            </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
          <BellOff className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">You have no notifications yet.</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        </ScrollArea>
      )}
      <Separator />
       <div className="p-3 text-center">
        <Button variant="ghost" size="sm" onClick={onClose} className="w-full text-muted-foreground">
            Close
        </Button>
       </div>
    </div>
  );
}
