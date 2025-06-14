
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, UserCircle, Briefcase, MessageSquare, Brain, LogOut, Settings, SearchCode, Bookmark, ShieldCheck } from 'lucide-react'; // Added ShieldCheck for Admin
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
     // Dispatch custom event to notify other components (like UserNav)
    window.dispatchEvent(new CustomEvent('authChange'));
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
  { href: '/dashboard/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/dashboard/chat', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/pitch-analyzer', label: 'Pitch Analyzer', icon: Brain, roles: ['entrepreneur', 'admin'] }, // Admin can also see
  { href: '/dashboard/discover-investors', label: 'Discover Investors', icon: SearchCode, roles: ['entrepreneur', 'admin'] }, // Admin can also see
  // { href: '/dashboard/settings', label: 'Settings', icon: Settings }, // Example for future
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const router = useRouter();

  useEffect(() => {
    const role = getMockUserRole();
    setUserRole(role);

    const handleAuthChange = () => {
        setUserRole(getMockUserRole());
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => {
        window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // Determine the correct dashboard link based on role for the main "Dashboard" item
  let dashboardLink = '/dashboard/profile'; // Default
  let dashboardLabel = 'Dashboard';
  let dashboardIcon = LayoutDashboard;

  if (userRole === 'admin') {
    dashboardLink = '/dashboard/admin';
    dashboardLabel = 'Admin Panel';
    dashboardIcon = ShieldCheck;
  } else if (userRole === 'investor') {
    dashboardLink = '/dashboard/investor';
    dashboardLabel = 'Investor Dashboard';
    dashboardIcon = Users;
  } else if (userRole === 'entrepreneur') {
    dashboardLink = '/dashboard/entrepreneur';
    dashboardLabel = 'My Requests';
    dashboardIcon = Briefcase;
  }
  
  // Create a dynamic "Dashboard" nav item
  const dynamicDashboardItem: NavItem = {
    href: dashboardLink,
    label: dashboardLabel, 
    icon: dashboardIcon,
  };

  // Construct final navigation list: dynamic dashboard item first, then filtered common items
  const displayNavItems = userRole ? [ 
    dynamicDashboardItem,
    ...navItems.filter(item => {
      if (userRole === 'admin') return true; // Admins see most non-role-specific items
      if (!item.roles) return true;
      return item.roles.includes(userRole);
    })
  ] : [];


  return (
    <aside className="w-64 space-y-6 p-4 border-r border-border h-full bg-sidebar flex flex-col">
      <nav className="flex-grow space-y-1">
        {displayNavItems.map((item) => (
          <Button
            key={item.label}
            variant={pathname.startsWith(item.href) ? 'default' : 'ghost'} 
            className={cn(
              'w-full justify-start',
              (pathname.startsWith(item.href)) ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
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
      {userRole && ( 
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
      )}
    </aside>
  );
}
