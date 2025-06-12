
'use client';

import ProfileDisplay from '@/components/dashboard/profile/profile-display';
import ProfileEditForm from '@/components/dashboard/profile/profile-edit-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { User } from '@/types';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUserProfile() {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('bizlinkToken');
      if (!token) {
        setError("Not authenticated.");
        setIsLoading(false);
        // Optionally redirect to login
        return;
      }

      try {
        const response = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch profile');
        }
        const userData: User = await response.json();
        setUser(userData);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserProfile();
  }, []);

  const handleSaveProfile = async (updatedUserData: Partial<User>) => {
    setIsLoading(true); // Consider a different loading state for save operation
    const token = localStorage.getItem('bizlinkToken');
    if (!token) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication token not found.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedUserData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      const savedUser: User = await response.json();
      setUser(savedUser); // Update local state with the saved user data
      localStorage.setItem('bizlinkUser', JSON.stringify(savedUser)); // Update localStorage as well
      toast({ title: 'Profile Updated', description: 'Your profile has been saved successfully.' });
    } catch (error) {
      console.error('Save profile error:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Could not save profile changes.',
      });
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-destructive">Error: {error}. Please try logging in again.</p>;
  }

  if (!user) {
    return <p className="text-center text-muted-foreground">User not found or not authenticated. Please log in.</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold text-foreground">My Profile</h1>
      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="view" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">View Profile</TabsTrigger>
          <TabsTrigger value="edit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Edit Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="view" className="mt-6">
          <ProfileDisplay user={user} />
        </TabsContent>
        <TabsContent value="edit" className="mt-6">
          <ProfileEditForm user={user} onSave={handleSaveProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
