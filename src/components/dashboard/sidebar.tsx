
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, UserCircle, Briefcase, MessageSquare, Brain, LogOut, Settings, SearchCode } from 'lucide-react';
import type { Role } from '@/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Mock auth functions - replace with actual auth context/hook
const getMockUserRole = (): Role | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('bizlinkUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.role;
    }
  }
  return null;
};

const mockLogout = (router: ReturnType<typeof useRouter>) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bizlinkUser');
    localStorage.removeItem('bizlinkToken');
  }
  router.push('/login');
};


interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: Role[]; // If specific to roles
}

// Base navigation items, dashboard link will be prepended dynamically
const navItems: NavItem[] = [
  // Dashboard item is added dynamically first
  { href: '/dashboard/profile', label: 'My Profile', icon: UserCircle },
  { href: '/dashboard/chat', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/pitch-analyzer', label: 'Pitch Analyzer', icon: Brain, roles: ['entrepreneur'] },
  { href: '/dashboard/discover-investors', label: 'Discover Investors', icon: SearchCode, roles: ['entrepreneur'] },
  // { href: '/dashboard/settings', label: 'Settings', icon: Settings }, // Example for future
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const router = useRouter();

  useEffect(() => {
    setUserRole(getMockUserRole());
  }, []);

  // Determine the correct dashboard link based on role for the main "Dashboard" item
  const dashboardLink = userRole === 'investor' ? '/dashboard/investor' : '/dashboard/entrepreneur';
  
  // Create a dynamic "Dashboard" nav item
  const dynamicDashboardItem: NavItem = {
    href: dashboardLink,
    label: userRole === 'investor' ? 'Investor Dashboard' : 'My Requests', // Changed for entrepreneur
    icon: LayoutDashboard,
  };

  // Construct final navigation list: dynamic dashboard item first, then filtered common items
  const displayNavItems = [
    dynamicDashboardItem,
    ...navItems.filter(item => {
      // Always show items without specific roles defined
      if (!item.roles) return true;
      // If roles are defined, check if current user's role is included
      return userRole ? item.roles.includes(userRole) : false;
    })
  ];


  return (
    <aside className="w-64 space-y-6 p-4 border-r border-border h-full bg-sidebar flex flex-col">
      <nav className="flex-grow space-y-1">
        {displayNavItems.map((item) => (
          <Button
            key={item.label}
            variant={pathname === item.href || (item.href === '/dashboard/chat' && pathname.startsWith('/dashboard/chat/')) ? 'default' : 'ghost'}
            className={cn(
              'w-full justify-start',
              (pathname === item.href || (item.href === '/dashboard/chat' && pathname.startsWith('/dashboard/chat/'))) ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="mt-auto">
        <Button
            variant={'ghost'}
            className={cn(
              'w-full justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
            onClick={() => mockLogout(router)}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
      </div>
    </aside>
  );
}
