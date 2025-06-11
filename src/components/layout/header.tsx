
import Link from 'next/link';
import Logo from './logo';
import UserNav from './user-nav';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle'; // Import ThemeToggle

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-4">
          <Button variant="link" asChild className="font-medium text-foreground hover:text-primary transition-colors">
            <Link href="/#features">Features</Link>
          </Button>
          <Button variant="link" asChild className="font-medium text-foreground hover:text-primary transition-colors">
             <Link href="/dashboard/chat">Messages</Link>
          </Button>
          <ThemeToggle /> 
          <UserNav />
        </nav>
      </div>
    </header>
  );
}
