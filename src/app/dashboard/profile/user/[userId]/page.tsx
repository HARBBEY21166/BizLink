
'use client';

import ProfileDisplay from '@/components/dashboard/profile/profile-display';
import { getMockUserById } from '@/lib/mockData';
import type { User } from '@/types';
import { Loader2, UserX } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAuthenticatedUser } from '@/lib/mockAuth';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  
  const [profileUser, setProfileUser] = useState<User | null | undefined>(undefined); // undefined for loading, null for not found
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authUser = getAuthenticatedUser();
    setCurrentUser(authUser);

    if (userId) {
      // Simulate API call to fetch user by ID
      const fetchedUser = getMockUserById(userId);
      setProfileUser(fetchedUser || null);
    }
    setIsLoading(false);
  }, [userId]);

  if (isLoading || profileUser === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <UserX className="h-16 w-16 text-destructive mb-4" />
        <h1 className="font-headline text-2xl font-bold text-foreground">Profile Not Found</h1>
        <p className="text-muted-foreground mt-2">
          The user profile you are looking for does not exist or could not be loaded.
        </p>
        <Button asChild className="mt-6">
          <Link href={currentUser?.role === 'investor' ? '/dashboard/investor' : '/dashboard/entrepreneur'}>
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }
  
  // Do not allow users to see their own profile through this dynamic route, redirect to main profile page
  if (currentUser && currentUser.id === profileUser.id) {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/profile';
    }
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Redirecting to your profile...</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold text-foreground">
        {profileUser.name}'s Profile
      </h1>
      <ProfileDisplay user={profileUser} />
       <div className="mt-6 text-center">
         <Button asChild variant="outline">
            <Link href={currentUser?.role === 'investor' ? '/dashboard/investor' : '/dashboard/entrepreneur'}>
                Back to Dashboard
            </Link>
         </Button>
       </div>
    </div>
  );
}
