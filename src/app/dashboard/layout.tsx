
'use client';

import Sidebar from '@/components/dashboard/sidebar';
import { isAuthenticated, getAuthenticatedUser } from '@/lib/mockAuth';
import type { User } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const authenticated = isAuthenticated();
    if (!authenticated) {
      setAuthStatus('unauthenticated');
      router.replace('/login');
    } else {
      const user = getAuthenticatedUser();
      setCurrentUser(user);
      setAuthStatus('authenticated');

      // Role-based route protection
      if (user) {
        const isInvestorDashboard = pathname.startsWith('/dashboard/investor');
        const isEntrepreneurDashboard = pathname.startsWith('/dashboard/entrepreneur');
        const isPitchAnalyzer = pathname.startsWith('/dashboard/pitch-analyzer');
        const isProfilePage = pathname.startsWith('/dashboard/profile'); // Own profile
        const isChatPage = pathname.startsWith('/dashboard/chat'); // Chat pages

        if (user.role === 'investor') {
          if (isEntrepreneurDashboard || isPitchAnalyzer) {
            router.replace('/dashboard/investor');
          }
        } else if (user.role === 'entrepreneur') {
          if (isInvestorDashboard) {
            router.replace('/dashboard/entrepreneur');
          }
        }
        
        // Allow access to own profile, chat, and specific user profiles for all authenticated users
        // The specific user profile page (/dashboard/profile/user/[userId]) will handle its own logic
        // if needed, but basic access is granted here.
         if (!(isInvestorDashboard || isEntrepreneurDashboard || isPitchAnalyzer || isProfilePage || isChatPage || pathname.startsWith('/dashboard/profile/user/'))) {
            // If it's some other unknown dashboard route, redirect to their default.
            // This case might not be hit if all routes are well-defined.
            if (user.role === 'investor') router.replace('/dashboard/investor');
            else router.replace('/dashboard/entrepreneur');
         }

      }
    }
  }, [router, pathname]);

  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (authStatus === 'unauthenticated' || !currentUser) {
    // This will typically not be seen due to redirect, but good for safety
    return null; 
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]"> {/* Adjust height considering header */}
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 bg-background">
        {children}
      </main>
    </div>
  );
}
