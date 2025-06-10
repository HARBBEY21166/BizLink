import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, DollarSign, Users, Info, Mail, CalendarDays } from 'lucide-react';

interface ProfileDisplayProps {
  user: User | null;
}

export default function ProfileDisplay({ user }: ProfileDisplayProps) {
  if (!user) {
    return <p>Loading profile...</p>;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6 p-6 bg-primary/5 rounded-t-lg">
        <Avatar className="h-24 w-24 text-3xl border-4 border-primary shadow-md">
          <AvatarImage src={user.avatarUrl || `https://placehold.co/150x150.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="person professional" />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="font-headline text-3xl mb-1">{user.name}</CardTitle>
          <CardDescription className="text-lg capitalize text-primary">{user.role}</CardDescription>
          <div className="mt-2 text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="font-headline text-lg font-semibold mb-2 flex items-center gap-2"><Info className="h-5 w-5 text-primary" />Bio</h3>
          <p className="text-foreground whitespace-pre-wrap">{user.bio || 'No bio provided.'}</p>
        </div>

        {user.role === 'entrepreneur' && (
          <>
            <div>
              <h3 className="font-headline text-lg font-semibold mb-2 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" />Startup Description</h3>
              <p className="text-foreground whitespace-pre-wrap">{user.startupDescription || 'No startup description provided.'}</p>
            </div>
            <div>
              <h3 className="font-headline text-lg font-semibold mb-2 flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Funding Need</h3>
              <p className="text-foreground">{user.fundingNeed || 'Not specified.'}</p>
            </div>
            {user.pitchDeckUrl && (
              <div>
                <h3 className="font-headline text-lg font-semibold mb-2 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" />Pitch Deck</h3>
                <a href={user.pitchDeckUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  View Pitch Deck
                </a>
              </div>
            )}
          </>
        )}

        {user.role === 'investor' && (
          <>
            <div>
              <h3 className="font-headline text-lg font-semibold mb-2 flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Investment Interests</h3>
              {user.investmentInterests && user.investmentInterests.length > 0 ? (
                <ul className="list-disc list-inside">
                  {user.investmentInterests.map((interest, index) => (
                    <li key={index} className="text-foreground">{interest}</li>
                  ))}
                </ul>
              ) : <p className="text-foreground">No investment interests specified.</p>}
            </div>
            <div>
              <h3 className="font-headline text-lg font-semibold mb-2 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" />Portfolio Companies</h3>
              {user.portfolioCompanies && user.portfolioCompanies.length > 0 ? (
                 <ul className="list-disc list-inside">
                  {user.portfolioCompanies.map((company, index) => (
                    <li key={index} className="text-foreground">{company}</li>
                  ))}
                </ul>
              ) : <p className="text-foreground">No portfolio companies listed.</p>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
