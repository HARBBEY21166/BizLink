import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { CollaborationRequest } from "@/types";
import { Check, MessageSquare, X, Briefcase } from "lucide-react";
import Link from "next/link";

interface RequestCardProps {
  request: CollaborationRequest;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export default function RequestCard({ request, onAccept, onReject }: RequestCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  const statusColors = {
    pending: 'bg-yellow-500 hover:bg-yellow-500/90',
    accepted: 'bg-green-500 hover:bg-green-500/90',
    rejected: 'bg-red-500 hover:bg-red-500/90',
  };

  return (
    <Card className="w-full transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar className="h-16 w-16 border-2 border-primary">
          {/* Use a placeholder for investor avatar */}
          <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(request.investorName)}`} alt={request.investorName} data-ai-hint="person suit" />
          <AvatarFallback>{getInitials(request.investorName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">{request.investorName}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            Investor
          </CardDescription>
          <p className="text-xs text-muted-foreground mt-1">
            Requested on: {new Date(request.requestedAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className={`${statusColors[request.status]} text-white capitalize`}>{request.status}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground mb-2 line-clamp-2">
          {request.message || (request.investorBioSnippet || "Interested in learning more about your venture and exploring potential collaboration.")}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/chat/${request.investorId}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> Message
          </Link>
        </Button>
        {request.status === 'pending' && (
          <>
            <Button size="sm" variant="destructive" onClick={() => onReject(request.id)}>
              <X className="mr-2 h-4 w-4" /> Reject
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onAccept(request.id)}>
              <Check className="mr-2 h-4 w-4" /> Accept
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
