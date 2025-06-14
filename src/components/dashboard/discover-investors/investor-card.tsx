
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/types";
import { MessageSquare, Eye, TrendingUp } from "lucide-react";
import Link from "next/link";
import BookmarkButton from "@/components/dashboard/common/bookmark-button";

interface InvestorCardProps {
  investor: User;
  isBookmarked: boolean;
  onBookmarkToggle: (profileId: string, isBookmarked: boolean) => void;
}

export default function InvestorCard({ investor, isBookmarked, onBookmarkToggle }: InvestorCardProps) {
  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="w-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={investor.avatarUrl || `https://placehold.co/100x100.png?text=${getInitials(investor.name)}`} alt={investor.name} data-ai-hint="person investor" />
          <AvatarFallback>{getInitials(investor.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">{investor.name}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-sm text-primary">
            <TrendingUp className="h-4 w-4" />
            Investor
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground mb-3 line-clamp-3">
          {investor.bio || "Enthusiastic investor looking for promising ventures."}
        </p>
        {investor.investmentInterests && investor.investmentInterests.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Interests</h4>
            <div className="flex flex-wrap gap-1">
              {investor.investmentInterests.slice(0, 5).map(interest => (
                <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
              ))}
            </div>
          </div>
        )}
        {investor.portfolioCompanies && investor.portfolioCompanies.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Portfolio Highlights</h4>
             <p className="text-xs text-foreground italic line-clamp-2">
                Invested in: {investor.portfolioCompanies.slice(0,3).join(', ')}{investor.portfolioCompanies.length > 3 ? '...' : ''}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 mt-auto pt-4 border-t">
        <BookmarkButton
          profileId={investor.id}
          initialIsBookmarked={isBookmarked}
          onBookmarkToggle={onBookmarkToggle}
          className="w-full sm:w-auto"
        />
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
          <Link href={`/dashboard/profile/user/${investor.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View Profile
          </Link>
        </Button>
        <Button variant="default" size="sm" asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/dashboard/chat/${investor.id}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> Message
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
