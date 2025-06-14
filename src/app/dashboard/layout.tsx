
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

      if (user) {
        const isInvestorBaseDashboard = pathname === ('/dashboard/investor');
        const isEntrepreneurBaseDashboard = pathname === ('/dashboard/entrepreneur');
        const isPitchAnalyzer = pathname.startsWith('/dashboard/pitch-analyzer');
        const isDiscoverInvestors = pathname.startsWith('/dashboard/discover-investors');
        const isProfilePage = pathname.startsWith('/dashboard/profile');
        const isChatPage = pathname.startsWith('/dashboard/chat');
        const isBookmarksPage = pathname.startsWith('/dashboard/bookmarks');


        let allowed = false;

        if (user.role === 'investor') {
          if (isInvestorBaseDashboard || isProfilePage || isChatPage || isBookmarksPage) {
            allowed = true;
          } else if (isEntrepreneurBaseDashboard || isPitchAnalyzer || isDiscoverInvestors) {
             router.replace('/dashboard/investor');
             return;
          }
        } else if (user.role === 'entrepreneur') {
          if (isEntrepreneurBaseDashboard || isPitchAnalyzer || isDiscoverInvestors || isProfilePage || isChatPage || isBookmarksPage) {
            allowed = true;
          } else if (isInvestorBaseDashboard) {
             router.replace('/dashboard/entrepreneur');
             return;
          }
        }
        
        if (!allowed && !(isProfilePage || isChatPage || isBookmarksPage)) {
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
    return null; 
  }

  return (
    <div className="flex h-screen max-h-[calc(100vh_-_theme(spacing.16))]"> {/* Header is h-16 (spacing.16) */}
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/30">
        {children}
      </main>
    </div>
  );
}
