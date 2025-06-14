
'use client';

import type { User } from '@/types';
import { calculateProfileCompleteness, type ProfileCompleteness } from '@/lib/profileUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ListChecks, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProfileCompletionCardProps {
  user: User | null;
}

export default function ProfileCompletionCard({ user }: ProfileCompletionCardProps) {
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);

  useEffect(() => {
    if (user) {
      setCompleteness(calculateProfileCompleteness(user));
    } else {
      setCompleteness(null);
    }
  }, [user]);

  if (!user || !completeness || completeness.percentage === 100) {
    // Don't show if user is null, completeness not calculated, or profile is 100% complete
    // Or if there are no fields to complete (totalFields is 0, which means percentage is 100 already)
    return null;
  }

  return (
    <Card className="w-full shadow-lg border-primary/50 mb-8">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ListChecks className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-xl">Complete Your Profile</CardTitle>
            <CardDescription>
              {`Your profile is ${completeness.percentage}% complete. Enhance your visibility!`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={completeness.percentage} className="w-full h-3 [&>div]:bg-primary" />
        
        {completeness.missingFields.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 text-foreground">To improve your profile:</h4>
            <ul className="space-y-2">
              {completeness.missingFields.map((field) => (
                <li key={field.fieldName} className="flex items-center text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 mr-2 text-amber-600 shrink-0" />
                  <span>{field.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <Button asChild className="w-full sm:w-auto mt-4">
          <Link href="/dashboard/profile">Go to Profile Settings</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
