
'use client';

import BookmarkedProfileCard from '@/components/dashboard/bookmarks/bookmarked-profile-card';
import type { User } from '@/types';
import { BookmarkX, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAuthenticatedUser } from '@/lib/mockAuth';

export default function BookmarksPage() {
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchBookmarkedProfiles = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bookmarks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch bookmarked profiles: ${response.statusText}`);
      }
      const profilesData: User[] = await response.json();
      setBookmarkedProfiles(profilesData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Could not load bookmarked profiles." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    const token = localStorage.getItem('bizlinkToken');

    if (user && token) {
      fetchBookmarkedProfiles(token);
    } else {
      setError("User not authenticated. Please log in.");
      setIsLoading(false);
    }
  }, [fetchBookmarkedProfiles]);

  const handleBookmarkToggle = useCallback((profileId: string, isBookmarked: boolean) => {
    // If a profile is unbookmarked from this page, remove it from the list
    if (!isBookmarked) {
      setBookmarkedProfiles(prevProfiles => prevProfiles.filter(p => p.id !== profileId));
    }
    // If it was somehow bookmarked again (not typical from this page), refetch to be safe
    // or if the parent component needs to know, we could pass it up. For now, just filtering.
    // To be more robust, one might refetch the entire list:
    // const token = localStorage.getItem('bizlinkToken');
    // if (token && currentUser) fetchBookmarkedProfiles(token);
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Bookmarks...</span></div>;
  }

  if (error) {
    return <p className="text-center py-10 text-destructive">Error: {error}</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold text-foreground">My Bookmarks</h1>

      {bookmarkedProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarkedProfiles.map((profile) => (
            <BookmarkedProfileCard
              key={profile.id}
              user={profile}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookmarkX className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">No Bookmarked Profiles Yet.</p>
          <p className="text-sm text-muted-foreground">
            Browse and save profiles from the 'Discover Investors' or 'Discover Entrepreneurs' pages.
          </p>
        </div>
      )}
    </div>
  );
}
