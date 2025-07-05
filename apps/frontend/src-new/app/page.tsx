'use client';

import { useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Button } from '@heroui/react';
import { Avatar } from '@heroui/react';
import { Progress } from '@heroui/react';
import { Divider } from '@heroui/react';
import { 
  Brain, 
  Cpu, 
  Coins, 
  Users, 
  Activity,
  TrendingUp,
  Network,
  Zap,
  Award,
  Clock
} from 'lucide-react';
import { 
  useAuthStore, 
  useTrainingStore, 
  useHivemindStore, 
  useRewardsStore,
  useUIStore,
  useWalletStore 
} from '@/lib/stores';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { isTraining, currentSession, totalComputeHours, totalTokensEarned } = useTrainingStore();
  const { isConnected: hivemindConnected, nodes, stats: networkStats } = useHivemindStore();
  const { totalUsdValue, claimableRewards, tokenBalances } = useRewardsStore();
  const { setPageTitle, setPageDescription } = useUIStore();
  const { isConnected: walletConnected, account } = useWalletStore();

  useEffect(() => {
    setPageTitle('Dashboard');
    setPageDescription('Overview of your CoTrain activity and rewards');
  }, [setPageTitle, setPageDescription]);

  const mockStats = {
    globalStats: {
      totalNodes: 2847,
      activeTraining: 156,
      modelsCompleted: 42,
      totalRewardsDistributed: 1247389.56,
    },
    userStats: {
      rank: 142,
      streak: 7,
      efficiency: 94.2,
      uptime: 98.7,
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold cotrain-gradient-text">
          Welcome to CoTrain
        </h1>
        <p className="text-foreground-600">
          {isAuthenticated && user ? `Hello ${user.username}` : 'Connect your wallet to get started'}, 
          ready to contribute to the future of AI training?
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardBody className="flex flex-row items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Cpu className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-foreground-600">Training Status</p>
              <p className="text-lg font-semibold">
                {isTraining ? 'Active' : 'Idle'}
              </p>
              <Chip 
                size="sm" 
                color={isTraining ? 'success' : 'default'}
                variant="flat"
              >
                {isTraining ? 'Contributing' : 'Ready'}
              </Chip>
            </div>
          </CardBody>
        </Card>

        <Card className="card-hover">
          <CardBody className="flex flex-row items-center space-x-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Coins className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-foreground-600">Total Rewards</p>
              <p className="text-lg font-semibold">${totalUsdValue.toFixed(2)}</p>
              <p className="text-xs text-foreground-500">
                {tokenBalances.find(t => t.symbol === 'COTRAIN')?.amount.toFixed(2) || '0'} COTRAIN
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="card-hover">
          <CardBody className="flex flex-row items-center space-x-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Network className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-foreground-600">Network Status</p>
              <p className="text-lg font-semibold">
                {hivemindConnected ? 'Connected' : 'Disconnected'}
              </p>
              <Chip 
                size="sm" 
                color={hivemindConnected ? 'success' : 'warning'}
                variant="flat"
              >
                {nodes.length} peers
              </Chip>
            </div>
          </CardBody>
        </Card>

        <Card className="card-hover">
          <CardBody className="flex flex-row items-center space-x-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Award className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-foreground-600">Global Rank</p>
              <p className="text-lg font-semibold">#{mockStats.userStats.rank}</p>
              <p className="text-xs text-foreground-500">
                {mockStats.userStats.streak} day streak
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Training Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Training Session */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Current Training Session</h3>
                <p className="text-sm text-foreground-600">
                  Monitor your active contribution to the network
                </p>
              </div>
              <Brain className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardBody className="space-y-4">
              {isTraining && currentSession ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-foreground-600">
                      {currentSession.progress}%
                    </span>
                  </div>
                  <Progress 
                    value={currentSession.progress} 
                    color="primary"
                    className="w-full"
                  />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-foreground-600">Compute Contributed</p>
                      <p className="font-semibold">{currentSession.computeContributed.toFixed(2)}h</p>
                    </div>
                    <div>
                      <p className="text-foreground-600">Tokens Earned</p>
                      <p className="font-semibold">{currentSession.tokensEarned.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-foreground-600">Efficiency</p>
                      <p className="font-semibold">{currentSession.metrics.efficiency.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-foreground-600">Uptime</p>
                      <p className="font-semibold">{currentSession.metrics.uptime.toFixed(1)}%</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="p-3 rounded-full bg-foreground/5 w-fit mx-auto mb-4">
                    <Brain className="h-8 w-8 text-foreground-400" />
                  </div>
                  <p className="text-foreground-600 mb-4">No active training session</p>
                  <Button color="primary" size="sm">
                    Start Training
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Network Overview */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Network Overview</h3>
              <p className="text-sm text-foreground-600">
                Real-time statistics from the CoTrain network
              </p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-primary mr-2" />
                    <span className="text-2xl font-bold">{mockStats.globalStats.totalNodes}</span>
                  </div>
                  <p className="text-sm text-foreground-600">Total Nodes</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="h-5 w-5 text-success mr-2" />
                    <span className="text-2xl font-bold">{mockStats.globalStats.activeTraining}</span>
                  </div>
                  <p className="text-sm text-foreground-600">Training Now</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="h-5 w-5 text-warning mr-2" />
                    <span className="text-2xl font-bold">{mockStats.globalStats.modelsCompleted}</span>
                  </div>
                  <p className="text-sm text-foreground-600">Models Trained</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-secondary mr-2" />
                    <span className="text-lg font-bold">
                      ${(mockStats.globalStats.totalRewardsDistributed / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <p className="text-sm text-foreground-600">Total Rewards</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Wallet Status */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Wallet Status</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {walletConnected && account ? (
                <>
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      src={user?.avatar || '/default-avatar.png'} 
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {user?.username || 'Anonymous'}
                      </p>
                      <p className="text-xs text-foreground-600">
                        {account.address.slice(0, 8)}...{account.address.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <Divider />
                  <div className="space-y-2">
                    {tokenBalances.map((token) => (
                      <div key={token.symbol} className="flex justify-between">
                        <span className="text-sm">{token.symbol}</span>
                        <span className="text-sm font-medium">
                          {token.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-foreground-600 mb-4">
                    Connect your wallet to start earning
                  </p>
                  <Button color="primary" size="sm">
                    Connect Wallet
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Claimable Rewards */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Claimable Rewards</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {claimableRewards.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {claimableRewards.slice(0, 3).map((reward) => (
                      <div key={reward.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">
                            {reward.type === 'token' ? `${reward.amount} ${reward.symbol}` : 'NFT Reward'}
                          </p>
                          <p className="text-xs text-foreground-600">
                            From {reward.earnedFrom}
                          </p>
                        </div>
                        <Chip size="sm" color="success" variant="flat">
                          Ready
                        </Chip>
                      </div>
                    ))}
                  </div>
                  <Button color="success" size="sm" className="w-full">
                    Claim All Rewards
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 text-foreground-400 mx-auto mb-2" />
                  <p className="text-sm text-foreground-600">
                    No rewards to claim yet
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </CardHeader>
            <CardBody className="space-y-2">
              <Button 
                variant="flat" 
                color="primary" 
                size="sm" 
                className="w-full justify-start"
              >
                <Brain className="h-4 w-4 mr-2" />
                Browse Training Options
              </Button>
              <Button 
                variant="flat" 
                color="secondary" 
                size="sm" 
                className="w-full justify-start"
              >
                <Network className="h-4 w-4 mr-2" />
                Network Monitor
              </Button>
              <Button 
                variant="flat" 
                color="success" 
                size="sm" 
                className="w-full justify-start"
              >
                <Coins className="h-4 w-4 mr-2" />
                Rewards Dashboard
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}