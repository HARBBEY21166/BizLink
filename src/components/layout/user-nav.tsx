
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, LayoutDashboard, Brain, ShieldCheck } from 'lucide-react'; // Added ShieldCheck
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from '@/types';


export default function UserNav() {
  const [user, setUser] = useState<{ name: string; email: string; role: Role, avatarUrl?: string } | null>(null);
  const router = useRouter();

  const fetchUser = useCallback(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('bizlinkUser');
      setUser(userStr ? JSON.parse(userStr) : null);
    }
  }, []);

  useEffect(() => {
    fetchUser(); // Initial fetch

    const handleAuthChange = () => {
      fetchUser();
    };

    window.addEventListener('authChange', handleAuthChange);
    // Also listen to general storage events, though custom event is more reliable for this case
    window.addEventListener('storage', handleAuthChange); 

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [fetchUser]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bizlinkUser');
      localStorage.removeItem('bizlinkToken');
      window.dispatchEvent(new CustomEvent('authChange')); // Notify of auth change
    }
    router.push('/login');
    // setUser(null); // This will be handled by the event listener
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Register</Link>
        </Button>
      </div>
    );
  }

  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  let dashboardPath = '/dashboard/profile'; // Default
  let dashboardIcon = LayoutDashboard;
  if (user.role === 'admin') {
    dashboardPath = '/dashboard/admin';
    dashboardIcon = ShieldCheck;
  } else if (user.role === 'investor') {
    dashboardPath = '/dashboard/investor';
  } else if (user.role === 'entrepreneur') {
    dashboardPath = '/dashboard/entrepreneur';
  }
  
  const avatarSrc = user.avatarUrl || `https://placehold.co/100x100.png?text=${getInitials(user.name)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarSrc} alt={user.name} data-ai-hint="user avatar" />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={dashboardPath}>
              <dashboardIcon className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          {(user.role === 'entrepreneur' || user.role === 'admin') && ( // Admin can also see pitch analyzer
             <DropdownMenuItem asChild>
                <Link href="/dashboard/pitch-analyzer">
                    <Brain className="mr-2 h-4 w-4" />
                    <span>Pitch Analyzer</span>
                </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
