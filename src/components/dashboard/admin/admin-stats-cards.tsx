
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserPlus, FileText, CheckCircle, XCircle, MailWarning } from "lucide-react";

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

interface AdminStatsCardsProps {
  stats: AdminStats | null;
}

export default function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  if (!stats) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                 <Card key={i} className="animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium h-5 bg-muted rounded w-3/4"></CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold h-8 bg-muted rounded w-1/2"></div>
                        <p className="text-xs text-muted-foreground h-4 bg-muted rounded mt-1 w-1/4"></p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">All registered users</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Investors</CardTitle>
          <UserCheck className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.usersByRole.investor}</div>
          <p className="text-xs text-muted-foreground">Registered investors</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entrepreneurs</CardTitle>
          <UserPlus className="h-5 w-5 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.usersByRole.entrepreneur}</div>
          <p className="text-xs text-muted-foreground">Registered entrepreneurs</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
          <Users className="h-5 w-5 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.usersByRole.admin}</div>
          <p className="text-xs text-muted-foreground">System administrators</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Collab. Requests</CardTitle>
          <FileText className="h-5 w-5 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCollaborationRequests}</div>
          <p className="text-xs text-muted-foreground">All requests sent</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          <MailWarning className="h-5 w-5 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.collaborationRequestsByStatus.pending}</div>
           <p className="text-xs text-muted-foreground">Awaiting response</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Accepted Requests</CardTitle>
          <CheckCircle className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.collaborationRequestsByStatus.accepted}</div>
           <p className="text-xs text-muted-foreground">Successful collaborations</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected Requests</CardTitle>
          <XCircle className="h-5 w-5 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.collaborationRequestsByStatus.rejected}</div>
           <p className="text-xs text-muted-foreground">Declined collaborations</p>
        </CardContent>
      </Card>
    </div>
  );
}
