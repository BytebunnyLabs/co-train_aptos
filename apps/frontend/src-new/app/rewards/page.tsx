'use client';

import React, { useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Button } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Progress } from '@heroui/react';
import { Tabs, Tab } from '@heroui/react';
import { 
  Coins,
  Gift,
  Wallet,
  TrendingUp,
  Award,
  Zap,
  Clock,
  Star,
  Target,
  Trophy,
  Flame,
  Activity,
  CreditCard,
  Banknote,
  PieChart
} from 'lucide-react';
import { useRewardsStore, useUIStore } from '@/lib/stores';
import { WalletConnection } from '@/components/rewards/wallet-connection';
import { TokenBalances } from '@/components/rewards/token-balances';
import { ClaimableRewards } from '@/components/rewards/claimable-rewards';
import { NFTCollection } from '@/components/rewards/nft-collection';
import { StakingPools } from '@/components/rewards/staking-pools';
import { RewardHistory } from '@/components/rewards/reward-history';
import { RewardStatistics } from '@/components/rewards/reward-statistics';

export default function RewardsPage() {
  const { setPageTitle, setPageDescription, setBreadcrumbs } = useUIStore();
  const { 
    isWalletConnected,
    walletAddress,
    totalUsdValue,
    stats,
    claimableRewards,
    totalClaimableUsd,
    totalStaked,
    totalPendingRewards,
    refreshAll
  } = useRewardsStore();

  useEffect(() => {
    setPageTitle('Rewards & Staking');
    setPageDescription('Manage your tokens, NFTs, and staking rewards from AI training contributions');
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Rewards', href: '/rewards' }
    ]);
  }, [setPageTitle, setPageDescription, setBreadcrumbs]);

  const claimableCount = claimableRewards.filter(r => r.isClaimable).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Rewards & Staking</h1>
          <p className="text-foreground-600 mt-1">
            Manage your earnings from distributed AI training contributions
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            color="primary"
            variant="flat"
            startContent={<Gift className="h-4 w-4" />}
            isDisabled={claimableCount === 0}
          >
            Claim All ({claimableCount})
          </Button>
          <Button
            color="secondary"
            variant="flat"
            startContent={<Zap className="h-4 w-4" />}
            onClick={refreshAll}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Wallet Connection */}
      {!isWalletConnected ? (
        <WalletConnection />
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardBody className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-full bg-success/10">
                    <Wallet className="h-6 w-6 text-success" />
                  </div>
                </div>
                <p className="text-2xl font-bold">${totalUsdValue.toFixed(2)}</p>
                <p className="text-sm text-foreground-600">Total Portfolio</p>
                <div className="mt-2">
                  <p className="text-xs text-foreground-500">
                    Wallet: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-full bg-warning/10">
                    <Gift className="h-6 w-6 text-warning" />
                  </div>
                </div>
                <p className="text-2xl font-bold">${totalClaimableUsd.toFixed(2)}</p>
                <p className="text-sm text-foreground-600">Claimable Rewards</p>
                <div className="mt-2">
                  <Chip size="sm" color="warning" variant="flat">
                    {claimableCount} pending
                  </Chip>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold">${(totalStaked * 0.1).toFixed(2)}</p>
                <p className="text-sm text-foreground-600">Total Staked</p>
                <div className="mt-2">
                  <p className="text-xs text-success">
                    ${(totalPendingRewards * 0.1).toFixed(2)} pending
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 rounded-full bg-secondary/10">
                    <Trophy className="h-6 w-6 text-secondary" />
                  </div>
                </div>
                <p className="text-2xl font-bold">#{stats.rank}</p>
                <p className="text-sm text-foreground-600">Global Rank</p>
                <div className="mt-2">
                  <div className="flex items-center justify-center space-x-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span className="text-xs">{stats.streak} day streak</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Achievements Section */}
          <Card className="border-l-4 border-l-warning bg-warning/5">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Star className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Recent Achievement</h3>
                    <p className="text-sm text-foreground-600">
                      Congratulations! You've earned the "AI Trainer" badge for contributing 100+ hours
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="flat" color="warning">
                  View All
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Main Content Tabs */}
          <Tabs aria-label="Rewards tabs" size="lg" color="primary">
            <Tab 
              key="overview" 
              title={
                <div className="flex items-center space-x-2">
                  <PieChart className="h-4 w-4" />
                  <span>Overview</span>
                </div>
              }
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="space-y-6">
                  <TokenBalances />
                  <ClaimableRewards />
                </div>
                <div className="space-y-6">
                  <RewardStatistics />
                  <NFTCollection />
                </div>
              </div>
            </Tab>

            <Tab 
              key="staking" 
              title={
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Staking</span>
                </div>
              }
            >
              <div className="mt-6">
                <StakingPools />
              </div>
            </Tab>

            <Tab 
              key="history" 
              title={
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Transaction History</span>
                </div>
              }
            >
              <div className="mt-6">
                <RewardHistory />
              </div>
            </Tab>

            <Tab 
              key="nfts" 
              title={
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>NFT Collection</span>
                </div>
              }
            >
              <div className="mt-6">
                <NFTCollection expanded />
              </div>
            </Tab>
          </Tabs>
        </>
      )}
    </div>
  );
}