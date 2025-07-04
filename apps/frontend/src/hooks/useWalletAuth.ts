import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api';

interface WalletAuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    walletAddress: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

interface UseWalletAuthReturn {
  isLoading: boolean;
  login: () => Promise<WalletAuthResponse | null>;
  logout: () => void;
}

export const useWalletAuth = (): UseWalletAuthReturn => {
  const { account, signMessage } = useWallet();
  const { setUser, setIsAuthenticated, logout: authLogout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (): Promise<WalletAuthResponse | null> => {
    if (!account || !signMessage) {
      toast.error('Please connect your wallet first');
      return null;
    }

    setIsLoading(true);

    try {
      // Create a unique message for signing
      const timestamp = Date.now();
      const message = `Sign this message to authenticate with Co-Train Aptos.\n\nWallet: ${account.address}\nTimestamp: ${timestamp}`;

      // Sign the message
      const response = await signMessage({ 
        message,
        nonce: timestamp.toString()
      });
      
      if (!response || !response.signature) {
        throw new Error('Failed to sign message');
      }

      // Send login request to backend using API client
      const authResponse = await apiClient.post('/api/v1/auth/wallet-login', {
        walletAddress: account.address,
        signature: response.signature,
        message: message,
      });

      if (!authResponse.success || !authResponse.data) {
        throw new Error(authResponse.error || 'Authentication failed');
      }

      const authData = authResponse.data as WalletAuthResponse;

      // Store tokens in localStorage
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('user', JSON.stringify(authData.user));

      // Update auth context
      setUser(authData.user);
      setIsAuthenticated(true);

      toast.success('Successfully logged in with wallet!');
      return authData;
    } catch (error) {
      console.error('Wallet login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [account, signMessage]);

  const logout = useCallback(() => {
    // Use auth context logout which handles clearing tokens and user data
    authLogout();
    
    toast.success('Successfully logged out');
  }, [authLogout]);

  return {
    isLoading,
    login,
    logout,
  };
};