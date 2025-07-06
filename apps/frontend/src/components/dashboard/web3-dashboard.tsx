'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardBody, CardHeader, Button, Progress, Tabs, Tab, Chip } from '@heroui/react';
import { 
  TrendingUp, 
  Wallet, 
  Activity, 
  Users, 
  Cpu, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { formatAPT, formatNumber } from '@/utils/formatters';

interface DashboardStats {
  walletBalance: number;
  totalRewards: number;
  pendingRewards: number;
  completedSessions: number;
  networkParticipants: number;
  myRanking: number;
  avgPerformance: number;
}

interface RecentActivity {
  id: string;
  type: 'training' | 'reward' | 'contribution';
  description: string;
  amount?: number;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  txHash?: string;
}

export function Web3Dashboard() {
  const { account, connected } = useWallet();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (connected && isAuthenticated && account) {
      loadDashboardData();
    }
  }, [connected, isAuthenticated, account]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 并行加载所有数据
      const [balanceRes, rewardsRes, activityRes, networkRes] = await Promise.all([
        apiClient.get(`/api/v1/blockchain/balance/${account?.address}`, true),
        apiClient.get(`/api/v1/blockchain/rewards/${account?.address}`, true),
        apiClient.get(`/api/v1/training/history?limit=10`, true),
        apiClient.get('/api/v1/hivemind/network/stats', true)
      ]);

      setStats({
        walletBalance: (balanceRes.data as any)?.balance || 0,
        totalRewards: (rewardsRes.data as any)?.totalRewards || 0,
        pendingRewards: (rewardsRes.data as any)?.pendingRewards || 0,
        completedSessions: (rewardsRes.data as any)?.participationCount || 0,
        networkParticipants: (networkRes.data as any)?.totalNodes || 0,
        myRanking: (rewardsRes.data as any)?.ranking || 0,
        avgPerformance: (rewardsRes.data as any)?.averageScore || 0,
      });

      // 处理最近活动数据
      const activities: RecentActivity[] = (activityRes.data as any)?.sessions?.map((session: any) => ({
        id: session.id,
        type: 'training' as const,
        description: `Participated in ${session.name}`,
        amount: session.reward,
        timestamp: new Date(session.completedAt),
        status: session.status === 'completed' ? 'completed' : 'pending',
        txHash: session.txHash
      })) || [];

      setRecentActivity(activities);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <h3 className="text-lg font-semibold">Welcome to CoTrain</h3>
            <p className="text-default-400">
              Connect your wallet to access the AI training network
            </p>
          </CardHeader>
          <CardBody>
            <div className="text-center">
              <Wallet className="h-16 w-16 mx-auto mb-4 text-default-400" />
              <p className="text-sm text-default-400 mb-4">
                Connect your Aptos wallet to start earning rewards through distributed AI training
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-default-100 rounded w-3/4"></div>
              </CardHeader>
              <CardBody>
                <div className="h-8 bg-default-100 rounded w-1/2"></div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.username}</h1>
          <p className="text-default-400">
            Your AI training network dashboard
          </p>
        </div>
        <Chip variant="bordered" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Network Active
        </Chip>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Wallet Balance</h3>
            <Wallet className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{formatAPT(stats?.walletBalance || 0)}</div>
            <p className="text-xs text-default-400">
              Available for transactions
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Rewards</h3>
            <DollarSign className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{formatAPT(stats?.totalRewards || 0)}</div>
            <p className="text-xs text-default-400">
              Lifetime earnings
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Training Sessions</h3>
            <Activity className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{stats?.completedSessions || 0}</div>
            <p className="text-xs text-default-400">
              Completed sessions
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Network Size</h3>
            <Users className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{formatNumber(stats?.networkParticipants || 0)}</div>
            <p className="text-xs text-default-400">
              Active participants
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)} aria-label="Dashboard tabs">
        <Tab key="overview" title="Overview">
          <div className="space-y-6">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Overview */}
              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Overview
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Average Score</span>
                      <span className="text-sm text-default-400">
                        {(stats?.avgPerformance || 0).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={stats?.avgPerformance || 0} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats?.completedSessions || 0}
                      </div>
                      <div className="text-sm text-default-400">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatAPT(stats?.totalRewards || 0)}
                      </div>
                      <div className="text-sm text-default-400">Earned</div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <h3 className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-default-400 text-center py-4">
                        No recent activity
                      </p>
                    ) : (
                      recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            activity.status === 'completed' ? 'bg-green-100 text-green-600' :
                            activity.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {activity.type === 'training' ? <Cpu className="h-4 w-4" /> :
                             activity.type === 'reward' ? <DollarSign className="h-4 w-4" /> :
                             <Activity className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {activity.description}
                            </p>
                            <p className="text-xs text-default-400">
                              {activity.timestamp.toLocaleDateString()}
                            </p>
                          </div>
                          {activity.amount && (
                            <div className="text-sm font-medium">
                              +{formatAPT(activity.amount)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>

        <Tab key="training" title="Training">
          <Card>
            <CardHeader>
              <h3>Available Training Sessions</h3>
              <p className="text-default-400">
                Join AI training sessions to earn rewards
              </p>
            </CardHeader>
            <CardBody>
              <div className="text-center py-8">
                <Cpu className="h-16 w-16 mx-auto mb-4 text-default-400" />
                <p className="text-lg font-medium mb-2">No Active Sessions</p>
                <p className="text-sm text-default-400 mb-4">
                  Check back later for new training opportunities
                </p>
                <Button>Browse Training History</Button>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="rewards" title="Rewards">
          <Card>
            <CardHeader>
              <h3>Reward Management</h3>
              <p className="text-default-400">
                Claim your earned rewards and view history
              </p>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Pending Rewards</p>
                    <p className="text-sm text-default-400">
                      Ready to claim
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {formatAPT(stats?.pendingRewards || 0)}
                    </p>
                    <Button 
                      isDisabled={(stats?.pendingRewards || 0) === 0}
                      className="mt-2"
                    >
                      Claim Rewards
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="network" title="Network">
          <Card>
            <CardHeader>
              <h3>Network Status</h3>
              <p className="text-default-400">
                Monitor the distributed training network
              </p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(stats?.networkParticipants || 0)}
                  </div>
                  <div className="text-sm text-default-400">Active Nodes</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">99.2%</div>
                  <div className="text-sm text-default-400">Network Uptime</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">1.2PH/s</div>
                  <div className="text-sm text-default-400">Compute Power</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}