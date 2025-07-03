'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/cotrain/ui/card';
import { Badge } from '@/components/cotrain/ui/badge';
import { Button } from '@/components/cotrain/ui/button';
import { Separator } from '@/components/cotrain/ui/separator';
import { User, Wallet, Mail, Calendar, Shield, Copy } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { account } = useWallet();

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString());
      toast.success('Wallet address copied to clipboard!');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'secondary';
      case 'premium':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">User Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and view your information
            </p>
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and authentication information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Username
                  </label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{user?.username}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{user?.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Role
                  </label>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Badge variant={getRoleBadgeVariant(user?.role || 'user')}>
                      {user?.role?.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    User ID
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{user?.id}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Wallet Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Information
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Connected Wallet Address
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <span className="font-mono text-sm flex-1">
                        {account?.address.toString()}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyAddress}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Registered Wallet Address
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <span className="font-mono text-sm flex-1">
                        {user?.walletAddress}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (user?.walletAddress) {
                            navigator.clipboard.writeText(user.walletAddress);
                            toast.success('Registered wallet address copied!');
                          }
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {account?.ansName && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        ANS Name
                      </label>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="font-medium">{account.ansName}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline">
                  Edit Profile
                </Button>
                <Button variant="outline">
                  Security Settings
                </Button>
                <Button variant="outline">
                  Privacy Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;