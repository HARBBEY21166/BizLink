
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
import AdminStatsCards from '@/components/dashboard/admin/admin-stats-cards'; // New import

interface AdminStats {
  totalUsers: number;
  usersByRole: {
    admin: number;
    investor: number;
    entrepreneur: number;
  };
  totalCollaborationRequests: number;
  collaborationRequestsByStatus: {
    pending: number;
    accepted: number;
    rejected: number;
  };
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchAdminData = useCallback(async (token: string) => {
    setIsLoadingUsers(true);
    setIsLoadingStats(true);
    setError(null);
    try {
      // Fetch Users
      const usersResponse = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      const usersData: User[] = await usersResponse.json();
      setUsers(usersData);
      setIsLoadingUsers(false);

      // Fetch Stats
      const statsResponse = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!statsResponse.ok) {
        const errorData = await statsResponse.json();
        throw new Error(errorData.message || 'Failed to fetch statistics');
      }
      const statsData: AdminStats = await statsResponse.json();
      setStats(statsData);
      setIsLoadingStats(false);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Error Loading Admin Data', description: errorMessage });
      setIsLoadingUsers(false);
      setIsLoadingStats(false);
    }
  }, [toast]);

  useEffect(() => {
    const user = getAuthenticatedUser();
    setCurrentUser(user);
    const token = localStorage.getItem('bizlinkToken');

    if (user && user.role === 'admin' && token) {
      fetchAdminData(token);
    } else {
      setError("Access denied or not authenticated as admin.");
      setIsLoadingUsers(false);
      setIsLoadingStats(false);
    }
  }, [fetchAdminData]);

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

  if (currentUser?.role !== 'admin' && !isLoadingUsers && !isLoadingStats) {
     return <p className="text-center py-10 text-muted-foreground">Access Denied. This page is for administrators only.</p>;
  }
  
  if (error) {
    return <p className="text-center py-10 text-destructive">Error: {error}</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold text-foreground">Admin Panel</h1>
      
      <section>
        <h2 className="text-2xl font-semibold font-headline mb-4 text-foreground">Platform Statistics</h2>
        {isLoadingStats && !stats ? <AdminStatsCards stats={null} /> : <AdminStatsCards stats={stats} />}
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold font-headline mb-4 text-foreground">User Management</h2>
        {isLoadingUsers && (
            <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Users...</span></div>
        )}
        {!isLoadingUsers && users.length === 0 && (
            <p className="text-center py-10 text-muted-foreground">No users found.</p>
        )}
        {!isLoadingUsers && users.length > 0 && (
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
      </section>
    </div>
  );
}
