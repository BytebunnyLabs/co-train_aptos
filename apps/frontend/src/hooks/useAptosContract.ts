import { useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { InputTransactionData } from '@aptos-labs/wallet-adapter-core';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Contract address and configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x1';
const NETWORK = (process.env.NEXT_PUBLIC_APTOS_NETWORK as Network) || Network.TESTNET;

// Initialize Aptos client
const aptosConfig = new AptosConfig({ network: NETWORK });
const aptos = new Aptos(aptosConfig);

interface CreateSessionParams {
  name: string;
  rewardAmount: number;
  maxParticipants: number;
  description?: string;
  duration?: number;
}

interface SessionDetails {
  id: string;
  name: string;
  description: string;
  rewardAmount: number;
  maxParticipants: number;
  currentParticipants: number;
  duration: number;
  status: string;
  createdAt: Date;
  completedAt?: Date;
  creator: string;
  participants: string[];
}

interface TransactionResult {
  success: boolean;
  hash?: string;
  message: string;
  error?: string;
}

export const useAptosContract = () => {
  const { signAndSubmitTransaction, account, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Create training session
  const createTrainingSession = useCallback(async (
    params: CreateSessionParams
  ): Promise<TransactionResult> => {
    if (!connected || !account) {
      const errorMsg = 'Wallet not connected';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }

    setIsLoading(true);
    setError(null);

    try {
      const transaction: InputTransactionData = {
        data: {
          function: `${CONTRACT_ADDRESS}::training_rewards::create_training_session`,
          functionArguments: [
            params.name,
            params.rewardAmount,
            params.maxParticipants,
            params.description || '',
            params.duration || 0,
          ],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      
      // Wait for transaction confirmation
      const executedTransaction = await aptos.waitForTransaction({
        transactionHash: response.hash,
      });

      return {
        success: true,
        hash: response.hash,
        message: 'Training session created successfully',
      };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create training session';
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [connected, account, signAndSubmitTransaction]);

  // Register for session
  const registerForSession = useCallback(async (
    sessionId: string
  ): Promise<TransactionResult> => {
    if (!connected || !account) {
      const errorMsg = 'Wallet not connected';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }

    setIsLoading(true);
    setError(null);

    try {
      const transaction: InputTransactionData = {
        data: {
          function: `${CONTRACT_ADDRESS}::training_rewards::register_participant`,
          functionArguments: [sessionId, account.address],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      
      await aptos.waitForTransaction({
        transactionHash: response.hash,
      });

      return {
        success: true,
        hash: response.hash,
        message: 'Successfully registered for session',
      };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to register for session';
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [connected, account, signAndSubmitTransaction]);

  // Submit contribution
  const submitContribution = useCallback(async (
    sessionId: string,
    score: number,
    contributionHash?: string,
    metadata?: string
  ): Promise<TransactionResult> => {
    if (!connected || !account) {
      const errorMsg = 'Wallet not connected';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }

    setIsLoading(true);
    setError(null);

    try {
      const transaction: InputTransactionData = {
        data: {
          function: `${CONTRACT_ADDRESS}::training_rewards::submit_contribution`,
          functionArguments: [
            sessionId,
            account.address,
            score,
            contributionHash || '',
            metadata || '',
          ],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      
      await aptos.waitForTransaction({
        transactionHash: response.hash,
      });

      return {
        success: true,
        hash: response.hash,
        message: 'Contribution submitted successfully',
      };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to submit contribution';
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [connected, account, signAndSubmitTransaction]);

  // Complete session
  const completeSession = useCallback(async (
    sessionId: string
  ): Promise<TransactionResult> => {
    if (!connected || !account) {
      const errorMsg = 'Wallet not connected';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }

    setIsLoading(true);
    setError(null);

    try {
      const transaction: InputTransactionData = {
        data: {
          function: `${CONTRACT_ADDRESS}::training_rewards::complete_training_session`,
          functionArguments: [sessionId],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      
      await aptos.waitForTransaction({
        transactionHash: response.hash,
      });

      return {
        success: true,
        hash: response.hash,
        message: 'Session completed successfully',
      };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to complete session';
      setError(errorMsg);
      return { success: false, message: errorMsg, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [connected, account, signAndSubmitTransaction]);

  // Get session details
  const getSessionDetails = useCallback(async (
    sessionId: string
  ): Promise<SessionDetails | null> => {
    try {
      // Get session resource from contract
      const sessionResource = await aptos.getAccountResource({
        accountAddress: CONTRACT_ADDRESS,
        resourceType: `${CONTRACT_ADDRESS}::training_rewards::SessionStore`,
      });

      const sessionData = (sessionResource.data as any).sessions[sessionId];
      
      if (!sessionData) {
        return null;
      }

      return {
        id: sessionId,
        name: sessionData.name,
        description: sessionData.description || '',
        rewardAmount: parseInt(sessionData.reward_amount),
        maxParticipants: parseInt(sessionData.max_participants),
        currentParticipants: sessionData.participants?.length || 0,
        duration: parseInt(sessionData.duration) || 0,
        status: sessionData.status,
        createdAt: new Date(parseInt(sessionData.created_at) * 1000),
        completedAt: sessionData.completed_at ? new Date(parseInt(sessionData.completed_at) * 1000) : undefined,
        creator: sessionData.creator,
        participants: sessionData.participants || [],
      };
    } catch (err: any) {
      console.error('Failed to get session details:', err);
      setError(`Failed to get session details: ${err.message}`);
      return null;
    }
  }, []);

  // Get account balance
  const getAccountBalance = useCallback(async (
    address?: string
  ): Promise<number> => {
    try {
      const targetAddress = address || account?.address;
      if (!targetAddress) {
        throw new Error('No address provided');
      }

      const resources = await aptos.getAccountResources({
        accountAddress: targetAddress,
      });

      const coinResource = resources.find(
        (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );

      if (!coinResource) {
        return 0;
      }

      const balance = parseFloat((coinResource.data as any).coin.value) / 100000000; // Convert octas to APT
      return balance;
    } catch (err: any) {
      console.error('Failed to get account balance:', err);
      setError(`Failed to get account balance: ${err.message}`);
      return 0;
    }
  }, [account]);

  // Get participant score
  const getParticipantScore = useCallback(async (
    sessionId: string,
    participantAddress?: string
  ): Promise<number> => {
    try {
      const targetAddress = participantAddress || account?.address;
      if (!targetAddress) {
        throw new Error('No address provided');
      }

      const sessionDetails = await getSessionDetails(sessionId);
      if (!sessionDetails) {
        throw new Error('Session not found');
      }

      // Find participant in session data
      const sessionResource = await aptos.getAccountResource({
        accountAddress: CONTRACT_ADDRESS,
        resourceType: `${CONTRACT_ADDRESS}::training_rewards::SessionStore`,
      });

      const sessionData = (sessionResource.data as any).sessions[sessionId];
      const participantData = sessionData.participants.find(
        (p: any) => p.address === targetAddress
      );

      return participantData ? parseInt(participantData.score) : 0;
    } catch (err: any) {
      console.error('Failed to get participant score:', err);
      setError(`Failed to get participant score: ${err.message}`);
      return 0;
    }
  }, [account, getSessionDetails]);

  // Get my rewards (claimable rewards)
  const getMyRewards = useCallback(async (): Promise<number> => {
    if (!connected || !account) {
      return 0;
    }

    try {
      // This would typically query a user's claimable rewards
      // Implementation depends on contract structure
      const balance = await getAccountBalance();
      return balance;
    } catch (err: any) {
      console.error('Failed to get rewards:', err);
      setError(`Failed to get rewards: ${err.message}`);
      return 0;
    }
  }, [connected, account, getAccountBalance]);

  return {
    // Transaction methods
    createTrainingSession,
    registerForSession,
    submitContribution,
    completeSession,
    
    // Query methods
    getSessionDetails,
    getAccountBalance,
    getParticipantScore,
    getMyRewards,
    
    // State
    isLoading,
    error,
    clearError,
    
    // Wallet state
    connected,
    account,
  };
};

export default useAptosContract;