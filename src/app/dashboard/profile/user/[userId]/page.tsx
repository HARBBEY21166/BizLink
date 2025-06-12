
'use client';

import ProfileDisplay from '@/components/dashboard/profile/profile-display';
import type { User } from '@/types';
import { Loader2, UserX } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAuthenticatedUser } from '@/lib/mockAuth'; // For current user context

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authUser = getAuthenticatedUser(); // Get currently logged-in user
    setCurrentUser(authUser);

    if (authUser && authUser.id === userId) {
      router.replace('/dashboard/profile'); // Redirect to own profile page
      return;
    }

    async function fetchUserProfile() {
      if (!userId) {
        setError("User ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          if (response.status === 404) {
             setProfileUser(null); // Explicitly set to null for "not found"
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch user profile');
          }
        } else {
          const userData: User = await response.json();
          setProfileUser(userData);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setProfileUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserProfile();
  }, [userId, router]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !profileUser) { // Show general error if profileUser is not set to null specifically for 404
     return <p className="text-center text-destructive">Error: {error}</p>;
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
  
  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold text-foreground">
        {profileUser.name}'s Profile
      </h1>
      <ProfileDisplay user={profileUser} />
       <div className="mt-6 text-center">
         <Button asChild variant="outline">
            <Link href={currentUser?.role === 'investor' ? '/dashboard/investor' : (currentUser?.role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard')}>
                Back to Dashboard
            </Link>
         </Button>
       </div>
    </div>
  );
}
