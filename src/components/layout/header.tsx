
import Link from 'next/link';
import Logo from './logo';
import UserNav from './user-nav';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import NotificationBell from './notification-bell'; // Added import

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2"> {/* Reduced gap slightly for notification bell */}
          <Button variant="link" asChild className="font-medium text-foreground hover:text-primary transition-colors hidden sm:inline-flex">
            <Link href="/#features">Features</Link>
          </Button>
          <Button variant="link" asChild className="font-medium text-foreground hover:text-primary transition-colors">
             <Link href="/dashboard/chat">Messages</Link>
          </Button>
          <ThemeToggle /> 
          <NotificationBell /> {/* Added NotificationBell */}
          <UserNav />
        </nav>
      </div>
    </header>
  );
}
