import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/types";
import { Briefcase, MessageSquare, UserPlus } from "lucide-react";
import Link from "next/link";

interface EntrepreneurCardProps {
  entrepreneur: User; // Assuming User type has relevant fields for entrepreneur
}

export default function EntrepreneurCard({ entrepreneur }: EntrepreneurCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="w-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={entrepreneur.avatarUrl || `https://placehold.co/100x100.png?text=${getInitials(entrepreneur.name)}`} alt={entrepreneur.name} data-ai-hint="person business" />
          <AvatarFallback>{getInitials(entrepreneur.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">{entrepreneur.name}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            {entrepreneur.startupDescription || "Innovative Startup"}
          </CardDescription>
           <p className="text-xs text-muted-foreground mt-1">Funding Need: {entrepreneur.fundingNeed || "Not specified"}</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground line-clamp-3">
          {entrepreneur.bio || "A brief bio about the entrepreneur and their venture will appear here. Seeking opportunities for growth and collaboration."}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/chat/${entrepreneur.id}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> Message
          </Link>
        </Button>
        <Button size="sm">
          <UserPlus className="mr-2 h-4 w-4" /> Request Collaboration
        </Button>
      </CardFooter>
    </Card>
  );
}
