
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import NotificationsPanel from '@/components/notifications/notifications-panel';
import { getAuthenticatedUser } from '@/lib/mockAuth';

const POLLING_INTERVAL = 30000; // 30 seconds for unread count

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem('bizlinkToken');
    if (!token) {
      setUnreadCount(0); // Not authenticated, no unread messages
      setIsAuthenticated(false);
      return;
    }
    setIsAuthenticated(true);

    try {
      const response = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        // Silently fail for polling, or log if needed
        console.warn('Failed to poll unread notifications count');
        return;
      }
      const data = await response.json();
      const count = data.filter((n: { isRead: boolean }) => !n.isRead).length;
      setUnreadCount(count);
    } catch (error) {
      console.warn('Error polling unread notifications:', error);
    }
  }, []);

  useEffect(() => {
    const user = getAuthenticatedUser();
    setIsAuthenticated(!!user);

    const handleAuthChange = () => {
        const authUser = getAuthenticatedUser();
        setIsAuthenticated(!!authUser);
        if (authUser) {
            fetchUnreadCount(); // Fetch count immediately on auth change
        } else {
            setUnreadCount(0); // Clear count on logout
        }
    };

    window.addEventListener('authChange', handleAuthChange);
    // Initial fetch
    if (user) {
        fetchUnreadCount();
    }

    return () => {
        window.removeEventListener('authChange', handleAuthChange);
    };
  }, [fetchUnreadCount]);


  useEffect(() => {
    if (isAuthenticated) {
      // Clear existing interval if any
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
      // Setup new polling
      const intervalId = setInterval(fetchUnreadCount, POLLING_INTERVAL);
      setPollingIntervalId(intervalId);

      // Cleanup polling on component unmount or when auth status changes
      return () => {
        clearInterval(intervalId);
        setPollingIntervalId(null);
      };
    } else {
      // If not authenticated, clear any existing interval
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        setPollingIntervalId(null);
      }
    }
  }, [isAuthenticated, fetchUnreadCount]); // Re-run effect if isAuthenticated changes


  const handleUnreadCountChange = (newCount: number) => {
    setUnreadCount(newCount);
  };
  
  if (!isAuthenticated) {
    return null; // Don't show the bell if user is not logged in
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
          {unreadCount > 0 && (
            <span className="absolute top-[-4px] right-[-4px] inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full sm:w-[380px] p-0" align="end">
        <NotificationsPanel onClose={() => setIsOpen(false)} onUnreadCountChange={handleUnreadCountChange} />
      </PopoverContent>
    </Popover>
  );
}
