
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
        const isInvestorBaseDashboard = pathname === ('/dashboard/investor');
        const isEntrepreneurBaseDashboard = pathname === ('/dashboard/entrepreneur');
        const isPitchAnalyzer = pathname.startsWith('/dashboard/pitch-analyzer');
        const isDiscoverInvestors = pathname.startsWith('/dashboard/discover-investors');
        const isProfilePage = pathname.startsWith('/dashboard/profile'); // Own profile or other users'
        const isChatPage = pathname.startsWith('/dashboard/chat'); // Chat pages

        let allowed = false;

        if (user.role === 'investor') {
          if (isInvestorBaseDashboard || isProfilePage || isChatPage) {
            allowed = true;
          } else if (isEntrepreneurBaseDashboard || isPitchAnalyzer || isDiscoverInvestors) {
             router.replace('/dashboard/investor');
             return;
          }
        } else if (user.role === 'entrepreneur') {
          if (isEntrepreneurBaseDashboard || isPitchAnalyzer || isDiscoverInvestors || isProfilePage || isChatPage) {
            allowed = true;
          } else if (isInvestorBaseDashboard) {
             router.replace('/dashboard/entrepreneur');
             return;
          }
        }
        
        // If not explicitly allowed and not a general shared page like profile/chat, redirect.
        // This handles cases like trying to access `/dashboard` directly or other unknown sub-routes.
        if (!allowed && !(isProfilePage || isChatPage)) {
             // Fallback for any other /dashboard root access or undefined paths
            if (pathname === '/dashboard' || pathname === '/dashboard/'){
                if (user.role === 'investor') router.replace('/dashboard/investor');
                else router.replace('/dashboard/entrepreneur');
                return;
            }
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
