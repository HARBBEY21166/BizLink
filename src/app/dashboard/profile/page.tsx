'use client';

import ProfileDisplay from '@/components/dashboard/profile/profile-display';
import ProfileEditForm from '@/components/dashboard/profile/profile-edit-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { User } from '@/types';
import { getAuthenticatedUser } from '@/lib/mockAuth';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchedUser = getAuthenticatedUser();
    setUser(fetchedUser);
    setIsLoading(false);
  }, []);

  const handleSaveProfile = async (updatedUserData: Partial<User>) => {
    // In a real app, this would be an API call
    return new Promise<void>((resolve) => {
      setTimeout(() => { // Simulate API delay
        if (user) {
          const newUser = { ...user, ...updatedUserData };
          setUser(newUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('bizlinkUser', JSON.stringify(newUser));
          }
        }
        resolve();
      }, 1000);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-center text-muted-foreground">User not found. Please log in.</p>;
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
