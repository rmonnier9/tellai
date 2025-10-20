'use client';

import { client } from '@workspace/auth/client';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/avatar';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Input } from '@workspace/ui/components/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { AlertCircle, LogOut, Search, UserCog } from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
}

export function AdminUserImpersonation() {
  const session = client.useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = session.data?.user?.id;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/users');

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (userId: string) => {
    // Prevent self-impersonation
    if (userId === currentUserId) {
      setError('You cannot impersonate yourself.');
      return;
    }

    try {
      setImpersonating(userId);
      setError(null);

      await client.admin.impersonateUser({
        userId,
        fetchOptions: {
          onSuccess: () => {
            // Force a full page reload to ensure session is refreshed
            window.location.href = '/';
          },
          onError: (ctx) => {
            console.error('Impersonation error:', ctx.error);
            setError(
              ctx.error.message ||
                'Failed to impersonate user. Please try again.'
            );
            setImpersonating(null);
          },
        },
      });
    } catch (err) {
      console.error('Error impersonating user:', err);
      setError('Failed to impersonate user. Please try again.');
      setImpersonating(null);
    }
  };

  const handleStopImpersonation = async () => {
    try {
      await client.admin.stopImpersonating();
      window.location.reload();
    } catch (err) {
      console.error('Error stopping impersonation:', err);
      setError('Failed to stop impersonation. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User List</CardTitle>
            <CardDescription>
              Search and impersonate users for support purposes
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStopImpersonation}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Stop Impersonation
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading users...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">
              {searchQuery
                ? 'No users found matching your search'
                : 'No users found'}
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.emailVerified ? (
                        <Badge variant="default" className="bg-green-500">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.id === currentUserId ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="gap-2"
                          title="You cannot impersonate yourself"
                        >
                          <UserCog className="h-4 w-4" />
                          You
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleImpersonate(user.id)}
                          disabled={impersonating === user.id}
                          className="gap-2"
                        >
                          <UserCog className="h-4 w-4" />
                          {impersonating === user.id
                            ? 'Impersonating...'
                            : 'Impersonate'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}
      </CardContent>
    </Card>
  );
}
