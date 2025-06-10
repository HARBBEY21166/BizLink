'use client';

import Sidebar from '@/components/dashboard/sidebar';
import { isAuthenticated } from '@/lib/mockAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const authenticated = isAuthenticated();
    setIsAuth(authenticated);
    if (!authenticated) {
      router.replace('/login');
    }
  }, [router]);

  if (isAuth === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuth) {
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
