'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { WalletSelector } from '@/components/WalletSelector';
import { Loader2, Wallet, Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { connected } = useWallet();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show custom fallback if provided
  if (!isAuthenticated && fallback) {
    return <>{fallback}</>;
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-default-400" />
            </div>
            <h3 className="text-lg font-semibold">Authentication Required</h3>
            <p className="text-sm text-default-400">
              {!connected 
                ? "Please connect your Aptos wallet to access this page."
                : "Please sign in with your wallet to continue."
              }
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            {!connected ? (
              <div className="flex justify-center">
                <WalletSelector />
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm text-default-400">
                  <Wallet className="h-4 w-4" />
                  <span>Wallet Connected</span>
                </div>
                <p className="text-sm text-default-400">
                  Click "Sign In" in the wallet selector to authenticate.
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;