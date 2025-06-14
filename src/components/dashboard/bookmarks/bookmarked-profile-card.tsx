
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/types";
import { Eye, MessageSquare, TrendingUp, UserCircle } from "lucide-react";
import Link from "next/link";
import BookmarkButton from "@/components/dashboard/common/bookmark-button";
import { Badge } from "@/components/ui/badge";

interface BookmarkedProfileCardProps {
  user: User;
  onBookmarkToggle: (profileId: string, isBookmarked: boolean) => void;
}

export default function BookmarkedProfileCard({ user, onBookmarkToggle }: BookmarkedProfileCardProps) {
  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const roleIcon = user.role === 'investor' ? <TrendingUp className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />;
  const roleText = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return (
    <Card className="w-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={user.avatarUrl || `https://placehold.co/100x100.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint={user.role === 'investor' ? "person investor" : "person business"} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">{user.name}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-sm text-primary">
            {roleIcon}
            {roleText}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground mb-3 line-clamp-3">
          {user.bio || (user.role === 'investor' ? "Investor looking for opportunities." : "Entrepreneur with a vision.")}
        </p>
        {user.role === 'entrepreneur' && user.startupDescription && (
          <div className="mb-2">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Startup</h4>
            <p className="text-sm text-foreground">{user.startupDescription}</p>
          </div>
        )}
        {user.role === 'investor' && user.investmentInterests && user.investmentInterests.length > 0 && (
          <div className="mb-2">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Interests</h4>
            <div className="flex flex-wrap gap-1">
              {user.investmentInterests.slice(0, 3).map(interest => (
                <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 mt-auto pt-4 border-t">
        <BookmarkButton
          profileId={user.id}
          initialIsBookmarked={true} // On this page, it's always initially bookmarked
          onBookmarkToggle={onBookmarkToggle}
          className="w-full sm:w-auto"
        />
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
          <Link href={`/dashboard/profile/user/${user.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View Profile
          </Link>
        </Button>
        <Button variant="default" size="sm" asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/dashboard/chat/${user.id}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> Message
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
