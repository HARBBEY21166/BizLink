
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getAuthenticatedUser } from '@/lib/mockAuth';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchAllUsers = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      const data: User[] = await response.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    const token = localStorage.getItem('bizlinkToken');

    if (user && user.role === 'admin' && token) {
      fetchAllUsers(token);
    } else {
      setError("Access denied or not authenticated as admin.");
      setIsLoading(false);
    }
  }, [fetchAllUsers]);

  const getInitials = (name: string = "") => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const roleBadgeVariant = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'investor': return 'secondary';
      case 'entrepreneur': return 'default';
      default: return 'outline';
    }
  };


  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Users...</span></div>;
  }

  if (error) {
    return <p className="text-center py-10 text-destructive">Error: {error}</p>;
  }
  
  if (currentUser?.role !== 'admin') {
     return <p className="text-center py-10 text-muted-foreground">Access Denied. This page is for administrators only.</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold text-foreground">Admin Panel - User Management</h1>
      
      {users.length === 0 && !isLoading && (
        <p className="text-center py-10 text-muted-foreground">No users found.</p>
      )}

      {users.length > 0 && (
        <Table>
          <TableCaption>A list of all users in the system.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarUrl || `https://placehold.co/80x80.png?text=${getInitials(user.name)}`} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariant(user.role)} className="capitalize">{user.role}</Badge>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/profile/user/${user.id}`}>
                      <Eye className="mr-2 h-4 w-4" /> View
                    </Link>
                  </Button>
                  {/* Future actions: Edit role, Deactivate, etc. */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
