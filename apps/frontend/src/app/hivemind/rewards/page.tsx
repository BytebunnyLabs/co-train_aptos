'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Button } from '@heroui/react';
import { Tabs, Tab } from '@heroui/react';
import { Progress } from '@heroui/react';
import { Badge } from '@heroui/react';
import { Tooltip } from '@heroui/react';
import { Select, SelectItem } from '@heroui/react';
import { DateRangePicker } from '@heroui/react';
import { 
  Coins, 
  TrendingUp, 
  Award, 
  Users, 
  Calendar,
  Gift,
  BarChart3,
  Trophy,
  Target,
  Zap,
  Filter,
  Download,
  Eye,
  Clock,
  Star,
  Medal,
  RefreshCw,
  TrendingDown
} from 'lucide-react';

interface RewardDistribution {
  sessionId: number;
  totalRewardPool: number;
  distributions: Record<string, number>;
  timestamp: string;
  recipientsCount: number;
}

interface NodeRewardMetrics {
  nodeId: string;
  totalRewardsEarned: number;
  sessionsParticipated: number;
  averageRewardPerSession: number;
  lastRewardDate: string;
  weeklyEarnings: number;
  monthlyEarnings: number;
  efficiency: number;
  reputationScore: number;
  category: 'elite' | 'performer' | 'standard' | 'newcomer';
  rankChange: number;
  currentRank: number;
}

interface ProjectedReward {
  baseReward: number;
  bonusReward: number;
  totalProjected: number;
  ranking: number;
}

interface RewardAnalytics {
  totalDistributed: number;
  avgSessionReward: number;
  topEarnerReward: number;
  distributionTrend: 'up' | 'down' | 'stable';
  participationRate: number;
  rewardEfficiency: number;
}

export default function RewardsPage() {
  const [rewardHistory, setRewardHistory] = useState<RewardDistribution[]>([]);
  const [nodeMetrics, setNodeMetrics] = useState<NodeRewardMetrics[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [projectedRewards, setProjectedRewards] = useState<ProjectedReward | null>(null);
  const [analytics, setAnalytics] = useState<RewardAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [sortBy, setSortBy] = useState<string>('totalEarnings');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRewardData();
    const interval = setInterval(fetchRewardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchRewardData = async () => {
    try {
      const [historyResponse, metricsResponse] = await Promise.all([
        fetch('/api/hivemind/rewards/history?limit=20'),
        fetch('/api/hivemind/rewards/all-metrics'),
      ]);

      const [history, metrics] = await Promise.all([
        historyResponse.json(),
        metricsResponse.json(),
      ]);

      setRewardHistory(history);
      setNodeMetrics(metrics);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch reward data:', error);
      setIsLoading(false);
    }
  };

  const fetchProjectedRewards = async (nodeId: string, sessionId: string) => {
    try {
      const response = await fetch(
        `/api/hivemind/rewards/projected/${nodeId}/${sessionId}?estimatedTotalReward=10000`
      );
      const data = await response.json();
      setProjectedRewards(data);
    } catch (error) {
      console.error('Failed to fetch projected rewards:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalRewardsDistributed = () => {
    return rewardHistory.reduce((sum, dist) => sum + dist.totalRewardPool, 0);
  };

  const getTopEarners = () => {
    return nodeMetrics
      .sort((a, b) => b.totalRewardsEarned - a.totalRewardsEarned)
      .slice(0, 10);
  };

  const getMostActiveNodes = () => {
    return nodeMetrics
      .sort((a, b) => b.sessionsParticipated - a.sessionsParticipated)
      .slice(0, 10);
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'elite':
        return { color: 'warning', icon: <Medal className="h-4 w-4" />, label: 'Elite' };
      case 'performer':
        return { color: 'secondary', icon: <Award className="h-4 w-4" />, label: 'Performer' };
      case 'standard':
        return { color: 'primary', icon: <Target className="h-4 w-4" />, label: 'Standard' };
      case 'newcomer':
        return { color: 'default', icon: <Star className="h-4 w-4" />, label: 'Newcomer' };
      default:
        return { color: 'default', icon: <Star className="h-4 w-4" />, label: 'Unknown' };
    }
  };

  const getFilteredAndSortedNodes = () => {
    let filtered = nodeMetrics;
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(node => node.category === filterCategory);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'totalEarnings':
          return b.totalRewardsEarned - a.totalRewardsEarned;
        case 'weeklyEarnings':
          return b.weeklyEarnings - a.weeklyEarnings;
        case 'efficiency':
          return b.efficiency - a.efficiency;
        case 'sessions':
          return b.sessionsParticipated - a.sessionsParticipated;
        case 'reputation':
          return b.reputationScore - a.reputationScore;
        case 'rank':
          return a.currentRank - b.currentRank;
        default:
          return b.totalRewardsEarned - a.totalRewardsEarned;
      }
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reward Analytics & Distribution</h1>
          <p className="text-default-400">
            Comprehensive earnings tracking and performance insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            selectedKeys={timeRange ? [timeRange] : []}
            onSelectionChange={(keys) => setTimeRange(Array.from(keys)[0] as string)}
            placeholder="Time Range"
            size="sm"
            className="min-w-[120px]"
          >
            <SelectItem key="24h">24 Hours</SelectItem>
            <SelectItem key="7d">7 Days</SelectItem>
            <SelectItem key="30d">30 Days</SelectItem>
            <SelectItem key="90d">90 Days</SelectItem>
          </Select>
          <Button variant="bordered" size="sm" startContent={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
          <Button variant="bordered" size="sm" startContent={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Distributed</h3>
            <Coins className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">
              {formatCurrency(getTotalRewardsDistributed())}
            </div>
            <p className="text-xs text-default-400">
              Across {rewardHistory.length} sessions
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Earners</h3>
            <Users className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{nodeMetrics.length}</div>
            <p className="text-xs text-default-400">
              Nodes earning rewards
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Avg Session Reward</h3>
            <Award className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">
              {rewardHistory.length > 0 
                ? formatCurrency(getTotalRewardsDistributed() / rewardHistory.length)
                : '$0'
              }
            </div>
            <p className="text-xs text-default-400">
              Per training session
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Latest Distribution</h3>
            <Calendar className="h-4 w-4 text-default-400" />
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">
              {rewardHistory.length > 0 
                ? formatDate(rewardHistory[0].timestamp)
                : 'N/A'
              }
            </div>
            <p className="text-xs text-default-400">
              Most recent payout
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs aria-label="Reward System Tabs" className="space-y-4">
        <Tab key="history" title="Distribution History">
          <div className="mt-4">
          <Card>
             <CardHeader>
               <h3 className="text-lg font-semibold">Reward Distribution History</h3>
               <p className="text-default-400">
                 Recent reward distributions across training sessions
               </p>
             </CardHeader>
             <CardBody>
              <div className="space-y-4">
                {rewardHistory.map((distribution) => (
                  <div
                    key={`${distribution.sessionId}-${distribution.timestamp}`}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        Session #{distribution.sessionId}
                      </div>
                      <div className="text-sm text-default-400">
                        {formatDate(distribution.timestamp)}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="font-bold text-green-600">
                        {formatCurrency(distribution.totalRewardPool)}
                      </div>
                      <div className="text-xs text-default-400">
                        Total Pool
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{distribution.recipientsCount}</span>
                      </div>
                      <div className="text-xs text-default-400">
                        Recipients
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {formatCurrency(distribution.totalRewardPool / distribution.recipientsCount)}
                      </div>
                      <div className="text-xs text-default-400">
                        Avg Reward
                      </div>
                    </div>

                    <Button variant="bordered" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}

                {rewardHistory.length === 0 && !isLoading && (
                   <div className="text-center py-8 text-default-400">
                     <Gift className="h-8 w-8 mx-auto mb-2" />
                     <p>No reward distributions yet</p>
                   </div>
                 )}
              </div>
            </CardBody>
          </Card>
          </div>
        </Tab>

        <Tab key="leaderboard" title="Leaderboard">
          <div className="mt-4 space-y-6">
            {/* Leaderboard Controls */}
            <Card>
              <CardBody>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Select
                      selectedKeys={sortBy ? [sortBy] : []}
                      onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
                      placeholder="Sort by"
                      startContent={<Filter className="h-4 w-4" />}
                    >
                      <SelectItem key="totalEarnings">Total Earnings</SelectItem>
                      <SelectItem key="weeklyEarnings">Weekly Earnings</SelectItem>
                      <SelectItem key="efficiency">Efficiency</SelectItem>
                      <SelectItem key="sessions">Session Count</SelectItem>
                      <SelectItem key="reputation">Reputation</SelectItem>
                      <SelectItem key="rank">Overall Rank</SelectItem>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select
                      selectedKeys={filterCategory !== 'all' ? [filterCategory] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setFilterCategory(selected || 'all');
                      }}
                      placeholder="Filter by Category"
                    >
                      <SelectItem key="all">All Categories</SelectItem>
                      <SelectItem key="elite">Elite Performers</SelectItem>
                      <SelectItem key="performer">Performers</SelectItem>
                      <SelectItem key="standard">Standard</SelectItem>
                      <SelectItem key="newcomer">Newcomers</SelectItem>
                    </Select>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Enhanced Leaderboard */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center w-full">
                  <div>
                    <h3 className="text-lg font-semibold">Performance Leaderboard</h3>
                    <p className="text-default-400">
                      Ranked by {sortBy.replace(/([A-Z])/g, ' $1').toLowerCase()} • {getFilteredAndSortedNodes().length} nodes
                    </p>
                  </div>
                  <Badge color="primary" variant="flat">
                    {timeRange.toUpperCase()} View
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {getFilteredAndSortedNodes().slice(0, 20).map((node, index) => {
                    const categoryInfo = getCategoryInfo(node.category);
                    const globalRank = index + 1;
                    
                    return (
                      <div
                        key={node.nodeId}
                        className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          {/* Rank Badge */}
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                            globalRank <= 3 
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg' 
                              : globalRank <= 10
                              ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                              : 'bg-gradient-to-br from-primary/20 to-primary/30 text-primary'
                          }`}>
                            #{globalRank}
                          </div>

                          {/* Node Info */}
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="font-medium text-lg">{node.nodeId}</div>
                              <Chip
                                color={categoryInfo.color as any}
                                variant="flat"
                                size="sm"
                                startContent={categoryInfo.icon}
                              >
                                {categoryInfo.label}
                              </Chip>
                              {globalRank <= 10 && (
                                <Badge color="warning" variant="flat" size="sm">
                                  Top 10
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-default-400">
                              Last reward: {formatDate(node.lastRewardDate)}
                            </div>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="grid grid-cols-4 gap-6 text-center">
                          <div>
                            <div className="font-bold text-green-600 text-lg">
                              {formatCurrency(node.totalRewardsEarned)}
                            </div>
                            <div className="text-xs text-default-400">Total Earned</div>
                          </div>
                          
                          <div>
                            <div className="font-bold text-blue-600 text-lg">
                              {formatCurrency(node.weeklyEarnings)}
                            </div>
                            <div className="text-xs text-default-400">Weekly</div>
                          </div>
                          
                          <div>
                            <div className="font-bold text-purple-600 text-lg">
                              {node.efficiency}%
                            </div>
                            <div className="text-xs text-default-400">Efficiency</div>
                          </div>
                          
                          <div>
                            <div className="font-bold text-orange-600 text-lg">
                              {node.sessionsParticipated}
                            </div>
                            <div className="text-xs text-default-400">Sessions</div>
                          </div>
                        </div>

                        {/* Rank Change & Actions */}
                        <div className="flex items-center space-x-3">
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-1">
                              {node.rankChange > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : node.rankChange < 0 ? (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              ) : (
                                <span className="w-4 h-4 text-gray-400">—</span>
                              )}
                              <span className="text-sm font-medium">
                                {Math.abs(node.rankChange) || 0}
                              </span>
                            </div>
                            <div className="text-xs text-default-400">Rank Change</div>
                          </div>
                          
                          <Tooltip content="View Details">
                            <Button variant="bordered" size="sm" isIconOnly>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}

                  {getFilteredAndSortedNodes().length === 0 && (
                    <div className="text-center py-8 text-default-400">
                      <Trophy className="h-8 w-8 mx-auto mb-2" />
                      <p>No rewards data found for the selected criteria</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="calculator" title="Reward Calculator">
          <div className="mt-4">
          <Card>
             <CardHeader>
               <h3 className="text-lg font-semibold">Reward Calculator</h3>
               <p className="text-default-400">
                 Calculate projected rewards for specific sessions
               </p>
             </CardHeader>
             <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Node ID</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="Enter node ID"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Session ID</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="Enter session ID"
                    />
                  </div>
                  <Button className="w-full">Calculate Rewards</Button>
                </div>

                {projectedRewards && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Projected Rewards</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Base Reward:</span>
                        <span className="font-medium">
                          {formatCurrency(projectedRewards.baseReward)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Bonus Reward:</span>
                        <span className="font-medium text-yellow-600">
                          {formatCurrency(projectedRewards.bonusReward)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Total Projected:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(projectedRewards.totalProjected)}
                        </span>
                      </div>
                      
                      <div className="text-center">
                        <Chip variant="bordered">
                         Ranking: #{projectedRewards.ranking}
                       </Chip>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
          </div>
        </Tab>

        <Tab key="analytics" title="Analytics">
          <div className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card>
               <CardHeader>
                 <h3 className="text-lg font-semibold">Reward Distribution Trend</h3>
               </CardHeader>
               <CardBody>
                 <div className="h-64 flex items-center justify-center text-default-400">
                   Chart placeholder - Reward distribution over time
                 </div>
               </CardBody>
             </Card>

             <Card>
               <CardHeader>
                 <h3 className="text-lg font-semibold">Node Performance vs Rewards</h3>
               </CardHeader>
               <CardBody>
                 <div className="h-64 flex items-center justify-center text-default-400">
                   Chart placeholder - Performance correlation
                 </div>
               </CardBody>
             </Card>
           </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}