
'use client';

import ResetPasswordForm from '@/components/auth/reset-password-form';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    if (token && token.trim() !== '') {
      setIsValidToken(true);
    } else {
      setIsValidToken(false);
    }
  }, [token]);

  if (isValidToken === null) {
    // Still determining if token exists
    return <div className="flex items-center justify-center min-h-[calc(100vh-15rem)]">Loading...</div>;
  }

  if (!isValidToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-12">
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader className="items-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
            <CardTitle className="font-headline text-2xl text-center">Invalid or Missing Token</CardTitle>
            <CardDescription className="text-center">
              The password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/forgot-password">Request New Reset Link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-12">
      <ResetPasswordForm token={token!} />
    </div>
  );
}
