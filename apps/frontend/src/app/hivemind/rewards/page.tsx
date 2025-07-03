'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/cotrain/ui/card';
import { Badge } from '@/components/cotrain/ui/badge';
import { Button } from '@/components/cotrain/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/cotrain/ui/tabs';
import { Progress } from '@/components/cotrain/ui/progress';
import { 
  Coins, 
  TrendingUp, 
  Award, 
  Users, 
  Calendar,
  Gift,
  BarChart3,
  Trophy
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
}

interface ProjectedReward {
  baseReward: number;
  bonusReward: number;
  totalProjected: number;
  ranking: number;
}

export default function RewardsPage() {
  const [rewardHistory, setRewardHistory] = useState<RewardDistribution[]>([]);
  const [nodeMetrics, setNodeMetrics] = useState<NodeRewardMetrics[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [projectedRewards, setProjectedRewards] = useState<ProjectedReward | null>(null);
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Reward System</h1>
        <p className="text-muted-foreground">
          Track earnings, distributions, and performance metrics
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distributed</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getTotalRewardsDistributed())}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {rewardHistory.length} sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Earners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nodeMetrics.length}</div>
            <p className="text-xs text-muted-foreground">
              Nodes earning rewards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Reward</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rewardHistory.length > 0 
                ? formatCurrency(getTotalRewardsDistributed() / rewardHistory.length)
                : '$0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Per training session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Distribution</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rewardHistory.length > 0 
                ? formatDate(rewardHistory[0].timestamp)
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Most recent payout
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Distribution History</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="calculator">Reward Calculator</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Reward Distribution History</CardTitle>
              <CardDescription>
                Recent reward distributions across training sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      <div className="text-sm text-muted-foreground">
                        {formatDate(distribution.timestamp)}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="font-bold text-green-600">
                        {formatCurrency(distribution.totalRewardPool)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Pool
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{distribution.recipientsCount}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Recipients
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {formatCurrency(distribution.totalRewardPool / distribution.recipientsCount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg Reward
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}

                {rewardHistory.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="h-8 w-8 mx-auto mb-2" />
                    <p>No reward distributions yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span>Top Earners</span>
                </CardTitle>
                <CardDescription>
                  Nodes with highest total rewards earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getTopEarners().map((node, index) => (
                    <div key={node.nodeId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                          <span className="text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">{node.nodeId}</div>
                          <div className="text-xs text-muted-foreground">
                            {node.sessionsParticipated} sessions
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {formatCurrency(node.totalRewardsEarned)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Avg: {formatCurrency(node.averageRewardPerSession)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <span>Most Active</span>
                </CardTitle>
                <CardDescription>
                  Nodes with most training sessions participated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getMostActiveNodes().map((node, index) => (
                    <div key={node.nodeId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <span className="text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">{node.nodeId}</div>
                          <div className="text-xs text-muted-foreground">
                            Last: {formatDate(node.lastRewardDate)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">
                          {node.sessionsParticipated}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Sessions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle>Reward Calculator</CardTitle>
              <CardDescription>
                Calculate projected rewards for specific sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                        <Badge variant="outline">
                          Ranking: #{projectedRewards.ranking}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reward Distribution Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart placeholder - Reward distribution over time
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Node Performance vs Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart placeholder - Performance correlation
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}