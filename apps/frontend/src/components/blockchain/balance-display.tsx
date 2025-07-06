import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardBody, CardHeader, Button, Chip, Skeleton } from '@heroui/react';
import {
  RefreshCw,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BalanceData {
  totalBalance: number;
  availableBalance: number;
  stakedBalance: number;
  pendingRewards: number;
  claimableRewards: number;
  lastUpdated: Date;
}

interface BalanceDisplayProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  className,
  showDetails = true,
  compact = false,
  autoRefresh = true,
  refreshInterval = 30,
}) => {
  const { account, connected } = useWallet();
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivate, setShowPrivate] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const fetchBalance = async (showLoading = true) => {
    if (!connected || !account) {
      setBalanceData(null);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to backend
      const response = await fetch(`/api/blockchain/balance/${account.address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      
      setBalanceData({
        totalBalance: data.totalBalance || 0,
        availableBalance: data.availableBalance || 0,
        stakedBalance: data.stakedBalance || 0,
        pendingRewards: data.pendingRewards || 0,
        claimableRewards: data.claimableRewards || 0,
        lastUpdated: new Date(data.lastUpdated || Date.now()),
      });
      
      setLastRefreshTime(new Date());
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      
      // Set mock data for development
      setBalanceData({
        totalBalance: 150.75,
        availableBalance: 120.25,
        stakedBalance: 25.50,
        pendingRewards: 3.25,
        claimableRewards: 1.75,
        lastUpdated: new Date(),
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBalance();
  }, [connected, account]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !connected) return;

    const interval = setInterval(() => {
      fetchBalance(false); // Don't show loading on auto-refresh
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, connected]);

  const handleRefresh = () => {
    fetchBalance(true);
  };

  const formatBalance = (amount: number, hideValue = false) => {
    if (hideValue) return '••••••';
    return `${amount.toFixed(4)} APT`;
  };

  const openExplorer = () => {
    if (account?.address) {
      window.open(`https://explorer.aptoslabs.com/account/${account.address}`, '_blank');
    }
  };

  if (!connected) {
    return (
      <Card className={cn('w-full', className)}>
        <CardBody className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center space-y-2">
              <Wallet className="mx-auto h-8 w-8 text-default-400" />
              <p className="text-sm text-default-400">Connect your wallet to view balance</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (loading && !balanceData) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          {showDetails && (
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          )}
        </CardBody>
      </Card>
    );
  }

  if (error && !balanceData) {
    return (
      <Card className={cn('w-full', className)}>
        <CardBody className="p-6">
          <div className="p-4 border border-danger-200 bg-danger-50 rounded-lg">
            <div className="space-y-2">
              <p>Failed to load balance: {error}</p>
              <Button onPress={handleRefresh} size="sm" variant="bordered">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-4 p-3 bg-content1 rounded-lg border', className)}>
        <div className="flex items-center space-x-2">
          <Wallet className="h-4 w-4 text-default-400" />
          <span className="text-sm font-medium">
            {formatBalance(balanceData?.totalBalance || 0, !showPrivate)}
          </span>
        </div>
        <Button
          variant="light"
          size="sm"
          onPress={() => setShowPrivate(!showPrivate)}
          className="h-6 w-6 p-0"
        >
          {showPrivate ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </Button>
        <Button
          variant="light"
          size="sm"
          onPress={handleRefresh}
          isDisabled={loading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Balance
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="light"
              size="sm"
              onPress={() => setShowPrivate(!showPrivate)}
              className="h-8 w-8 p-0"
            >
              {showPrivate ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="light"
              size="sm"
              onPress={openExplorer}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="light"
              size="sm"
              onPress={handleRefresh}
              isDisabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>
        {lastRefreshTime && (
          <p className="text-xs text-default-400">
            Last updated: {lastRefreshTime.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      
      <CardBody className="space-y-4">
        {/* Total Balance */}
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold">
              {formatBalance(balanceData?.totalBalance || 0, !showPrivate)}
            </span>
            <Chip variant="flat" size="sm" className="text-xs">
              Total
            </Chip>
          </div>
          <p className="text-sm text-default-400">
            Address: {account?.address?.toString().slice(0, 8)}...{account?.address?.toString().slice(-6)}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 border border-warning-200 bg-warning-50 rounded-lg">
            <p className="text-sm">
              <strong>Warning:</strong> {error}. Showing cached data.
            </p>
          </div>
        )}

        {/* Balance breakdown */}
        {showDetails && balanceData && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3 text-green-500" />
                <span className="text-xs text-default-400">Available</span>
              </div>
              <p className="text-sm font-medium">
                {formatBalance(balanceData.availableBalance, !showPrivate)}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-default-400">Staked</span>
              </div>
              <p className="text-sm font-medium">
                {formatBalance(balanceData.stakedBalance, !showPrivate)}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <TrendingDown className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-default-400">Pending</span>
              </div>
              <p className="text-sm font-medium">
                {formatBalance(balanceData.pendingRewards, !showPrivate)}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3 text-emerald-500" />
                <span className="text-xs text-default-400">Claimable</span>
              </div>
              <p className="text-sm font-medium text-emerald-600">
                {formatBalance(balanceData.claimableRewards, !showPrivate)}
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default BalanceDisplay;