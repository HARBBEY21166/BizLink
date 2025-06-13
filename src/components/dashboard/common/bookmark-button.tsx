
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthenticatedUser } from '@/lib/mockAuth'; // For user context for API calls

interface BookmarkButtonProps {
  profileId: string;
  initialIsBookmarked: boolean;
  onBookmarkToggle: (profileId: string, isBookmarked: boolean) => void;
  className?: string;
}

export default function BookmarkButton({ 
  profileId, 
  initialIsBookmarked, 
  onBookmarkToggle,
  className 
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getAuthenticatedUser>>(null);

  useEffect(() => {
    setIsBookmarked(initialIsBookmarked);
  }, [initialIsBookmarked]);

  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
  }, []);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent link navigation if button is inside an anchor
    e.stopPropagation(); // Prevent card click if button is on a card

    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to bookmark profiles.' });
      return;
    }
    
    const token = localStorage.getItem('bizlinkToken');
    if (!token) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication token not found.' });
        return;
    }

    setIsLoading(true);
    const newBookmarkedState = !isBookmarked;

    try {
      let response;
      if (newBookmarkedState) { // Add bookmark
        response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ profileId }),
        });
      } else { // Remove bookmark
        response = await fetch(`/api/bookmarks/${profileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to ${newBookmarkedState ? 'add' : 'remove'} bookmark`);
      }

      setIsBookmarked(newBookmarkedState);
      onBookmarkToggle(profileId, newBookmarkedState); // Notify parent
      toast({
        title: newBookmarkedState ? 'Bookmarked!' : 'Bookmark Removed',
        description: `Profile ${newBookmarkedState ? 'added to' : 'removed from'} your bookmarks.`,
      });

    } catch (error) {
      console.error('Bookmark error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Could not update bookmark.',
      });
      // Revert optimistic update on error if needed, though parent manages source of truth
    } finally {
      setIsLoading(false);
    }
  };

  const Icon = isBookmarked ? Bookmark : BookmarkPlus;
  const buttonText = isBookmarked ? 'Bookmarked' : 'Bookmark';

  return (
    <Button
      variant={isBookmarked ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icon className="mr-2 h-4 w-4" />
      )}
      {buttonText}
    </Button>
  );
}
