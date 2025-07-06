'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardBody, CardHeader, Button, Chip, Divider } from '@heroui/react';
import { User, Wallet, Mail, Calendar, Shield, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { account } = useWallet();

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString());
      toast.success('Wallet address copied to clipboard!');
    }
  };

  const getRoleChipColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'danger';
      case 'moderator':
        return 'secondary';
      case 'premium':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">User Profile</h1>
            <p className="text-default-400">
              Manage your account settings and view your information
            </p>
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </h3>
              <p className="text-sm text-default-400">
                Your account details and authentication information
              </p>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-default-400">
                    Username
                  </label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-default-400" />
                    <span className="font-medium">{user?.username}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-default-400">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-default-400" />
                    <span className="font-medium">{user?.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-default-400">
                    Role
                  </label>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-default-400" />
                    <Chip color={getRoleChipColor(user?.role || 'user')} variant="flat" size="sm">
                      {user?.role?.toUpperCase()}
                    </Chip>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-default-400">
                    User ID
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{user?.id}</span>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Wallet Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Information
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-default-400">
                      Connected Wallet Address
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-default-100 rounded-lg">
                      <span className="font-mono text-sm flex-1">
                        {account?.address.toString()}
                      </span>
                      <Button
                        variant="bordered"
                        size="sm"
                        onPress={copyAddress}
                        className="h-8 w-8 p-0 min-w-8"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-default-400">
                      Registered Wallet Address
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-default-100 rounded-lg">
                      <span className="font-mono text-sm flex-1">
                        {user?.walletAddress}
                      </span>
                      <Button
                        variant="bordered"
                        size="sm"
                        onPress={() => {
                          if (user?.walletAddress) {
                            navigator.clipboard.writeText(user.walletAddress);
                            toast.success('Registered wallet address copied!');
                          }
                        }}
                        className="h-8 w-8 p-0 min-w-8"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {account?.ansName && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-default-400">
                        ANS Name
                      </label>
                      <div className="p-3 bg-default-100 rounded-lg">
                        <span className="font-medium">{account.ansName}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Account Actions</h3>
              <p className="text-sm text-default-400">
                Manage your account settings and preferences
              </p>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-4">
                <Button variant="bordered">
                  Edit Profile
                </Button>
                <Button variant="bordered">
                  Security Settings
                </Button>
                <Button variant="bordered">
                  Privacy Settings
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;