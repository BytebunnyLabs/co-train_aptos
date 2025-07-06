import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardBody, CardHeader, Button, Chip, Skeleton, Progress, Tabs, Tab } from '@heroui/react';
import {
  RefreshCw,
  Gift,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Users,
  Target,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';

export interface RewardItem {
  id: string;
  type: 'participation' | 'performance' | 'completion' | 'bonus';
  amount: number;
  status: 'pending' | 'claimable' | 'claimed' | 'expired';
  sessionId: string;
  sessionName: string;
  earnedAt: Date;
  claimedAt?: Date;
  expiresAt?: Date;
  metadata?: {
    participationTime?: number;
    score?: number;
    rank?: number;
    [key: string]: any;
  };
}

export interface RewardStats {
  totalEarned: number;
  totalClaimed: number;
  totalPending: number;
  rewardsByType: Record<string, number>;
  recentRewards: RewardItem[];
}

interface RewardsDashboardProps {
  className?: string;
  showStats?: boolean;
  limit?: number;
}

export const RewardsDashboard: React.FC<RewardsDashboardProps> = ({
  className,
  showStats = true,
  limit = 10,
}) => {
  const { account, connected } = useWallet();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [stats, setStats] = useState<RewardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('claimable');

  const fetchRewards = async () => {
    if (!connected || !account) {
      setRewards([]);
      setStats(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API calls
      const [rewardsResponse, statsResponse] = await Promise.all([
        fetch(`/api/blockchain/rewards/${account.address}?limit=${limit}`),
        fetch(`/api/blockchain/rewards/${account.address}/stats`)
      ]);

      if (!rewardsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch rewards data');
      }

      const rewardsData = await rewardsResponse.json();
      const statsData = await statsResponse.json();

      setRewards(rewardsData.rewards || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rewards');
      
      // Set mock data for development
      const mockRewards: RewardItem[] = [
        {
          id: '1',
          type: 'participation',
          amount: 5.25,
          status: 'claimable',
          sessionId: 'session-1',
          sessionName: 'AI Model Training - Computer Vision',
          earnedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
          metadata: { participationTime: 120, score: 85 },
        },
        {
          id: '2',
          type: 'performance',
          amount: 12.50,
          status: 'claimable',
          sessionId: 'session-2',
          sessionName: 'Federated Learning Experiment',
          earnedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
          metadata: { participationTime: 180, score: 92, rank: 2 },
        },
        {
          id: '3',
          type: 'completion',
          amount: 8.75,
          status: 'claimed',
          sessionId: 'session-3',
          sessionName: 'Language Model Fine-tuning',
          earnedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          claimedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          metadata: { participationTime: 90, score: 78 },
        },
      ];
      
      setRewards(mockRewards);
      setStats({
        totalEarned: 156.75,
        totalClaimed: 89.25,
        totalPending: 67.50,
        rewardsByType: {
          participation: 45.25,
          performance: 67.50,
          completion: 32.75,
          bonus: 11.25,
        },
        recentRewards: mockRewards,
      });
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (rewardId: string) => {
    if (!account || claimingIds.has(rewardId)) return;

    try {
      setClaimingIds(prev => new Set(prev).add(rewardId));

      // TODO: Replace with actual API call
      const response = await fetch(`/api/blockchain/rewards/${rewardId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account.address }),
      });

      if (!response.ok) {
        throw new Error('Failed to claim reward');
      }

      // Update local state
      setRewards(prev => prev.map(reward => 
        reward.id === rewardId 
          ? { ...reward, status: 'claimed' as const, claimedAt: new Date() }
          : reward
      ));

      // Refresh stats
      await fetchRewards();
    } catch (err) {
      console.error('Failed to claim reward:', err);
      // TODO: Show error toast
    } finally {
      setClaimingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(rewardId);
        return newSet;
      });
    }
  };

  const batchClaim = async () => {
    const claimableRewards = filteredRewards.filter(r => r.status === 'claimable');
    if (claimableRewards.length === 0) return;

    try {
      setLoading(true);

      // TODO: Replace with actual API call
      const response = await fetch(`/api/blockchain/rewards/batch-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: account?.address,
          rewardIds: claimableRewards.map(r => r.id),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to batch claim rewards');
      }

      // Refresh data
      await fetchRewards();
    } catch (err) {
      console.error('Failed to batch claim:', err);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, [connected, account]);

  const filteredRewards = useMemo(() => {
    switch (activeTab) {
      case 'claimable':
        return rewards.filter(r => r.status === 'claimable');
      case 'claimed':
        return rewards.filter(r => r.status === 'claimed');
      case 'pending':
        return rewards.filter(r => r.status === 'pending');
      case 'all':
      default:
        return rewards;
    }
  }, [rewards, activeTab]);

  const getRewardIcon = (type: RewardItem['type']) => {
    switch (type) {
      case 'participation': return <Users className="h-4 w-4" />;
      case 'performance': return <Target className="h-4 w-4" />;
      case 'completion': return <CheckCircle className="h-4 w-4" />;
      case 'bonus': return <Award className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: RewardItem['status']) => {
    switch (status) {
      case 'claimable': return 'bg-green-100 text-green-800 border-green-200';
      case 'claimed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysUntilExpiry = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (!connected) {
    return (
      <Card className={cn('w-full', className)}>
        <CardBody className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center space-y-2">
              <Gift className="mx-auto h-8 w-8 text-default-400" />
              <p className="text-sm text-default-400">Connect your wallet to view rewards</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (loading && rewards.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardBody className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-default-400">Total Earned</p>
                  <p className="text-lg font-semibold">{stats.totalEarned.toFixed(2)} APT</p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-default-400">Total Claimed</p>
                  <p className="text-lg font-semibold">{stats.totalClaimed.toFixed(2)} APT</p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-default-400">Pending</p>
                  <p className="text-lg font-semibold">{stats.totalPending.toFixed(2)} APT</p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-sm text-default-400">Claim Rate</p>
                  <p className="text-lg font-semibold">
                    {((stats.totalClaimed / stats.totalEarned) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Rewards List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Rewards
            </h3>
            <div className="flex items-center space-x-2">
              {filteredRewards.filter(r => r.status === 'claimable').length > 1 && (
                <Button onPress={batchClaim} isDisabled={loading} size="sm">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Claim All
                </Button>
              )}
              <Button
                variant="light"
                size="sm"
                onPress={fetchRewards}
                isDisabled={loading}
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardBody>
          <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)} className="w-full">
            <Tab key="claimable" title="Claimable">
              <div className="mt-4">
                {error && (
                  <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning-600 mt-0.5" />
                    <p className="text-sm text-warning-700">
                      {error}. Showing cached data.
                    </p>
                  </div>
                )}
              
              {filteredRewards.length === 0 ? (
                 <div className="text-center py-8">
                   <Gift className="mx-auto h-12 w-12 text-default-400 mb-4" />
                   <p className="text-default-400">
                     No {activeTab} rewards found
                   </p>
                 </div>
               ) : (
                <div className="space-y-3">
                  {filteredRewards.map((reward) => {
                    const daysUntilExpiry = reward.expiresAt ? getDaysUntilExpiry(reward.expiresAt) : null;
                    
                    return (
                      <div
                        key={reward.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-default-100">
                           {getRewardIcon(reward.type)}
                         </div>
                         
                         <div className="space-y-1">
                           <div className="flex items-center space-x-2">
                             <h4 className="font-medium">{reward.sessionName}</h4>
                             <Chip size="sm" className={cn('text-xs', getStatusColor(reward.status))}>
                               {reward.status}
                             </Chip>
                           </div>
                           
                           <div className="flex items-center space-x-4 text-sm text-default-400">
                             <span className="capitalize">{reward.type} reward</span>
                             <span>•</span>
                             <span>{reward.earnedAt.toLocaleDateString()}</span>
                             {reward.metadata?.score && (
                               <>
                                 <span>•</span>
                                 <span>Score: {reward.metadata.score}%</span>
                               </>
                             )}
                           </div>
                            
                            {daysUntilExpiry !== null && daysUntilExpiry <= 7 && reward.status === 'claimable' && (
                              <div className="flex items-center space-x-1 text-xs text-orange-600">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                             <p className="font-semibold">{reward.amount.toFixed(4)} APT</p>
                             {reward.claimedAt && (
                               <p className="text-xs text-default-400">
                                 Claimed {reward.claimedAt.toLocaleDateString()}
                               </p>
                             )}
                           </div>
                          
                          {reward.status === 'claimable' && (
                            <Button
                              onPress={() => claimReward(reward.id)}
                              isDisabled={claimingIds.has(reward.id)}
                              size="sm"
                            >
                              {claimingIds.has(reward.id) ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                'Claim'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                   })}
                 </div>
               )}
               </div>
            </Tab>
            <Tab key="claimed" title="Claimed">
              <div className="mt-4">
                {error && (
                  <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning-600 mt-0.5" />
                    <p className="text-sm text-warning-700">
                      {error}. Showing cached data.
                    </p>
                  </div>
                )}
                {filteredRewards.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="mx-auto h-12 w-12 text-default-400 mb-4" />
                    <p className="text-default-400">
                      No {activeTab} rewards found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRewards.map((reward) => {
                      const daysUntilExpiry = reward.expiresAt ? getDaysUntilExpiry(reward.expiresAt) : null;
                      
                      return (
                        <div
                          key={reward.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-default-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-default-100">
                              {getRewardIcon(reward.type)}
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{reward.sessionName}</h4>
                                <Chip size="sm" className={cn('text-xs', getStatusColor(reward.status))}>
                                  {reward.status}
                                </Chip>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-default-400">
                                <span className="capitalize">{reward.type} reward</span>
                                <span>•</span>
                                <span>{reward.earnedAt.toLocaleDateString()}</span>
                                {reward.metadata?.score && (
                                  <>
                                    <span>•</span>
                                    <span>Score: {reward.metadata.score}%</span>
                                  </>
                                )}
                              </div>
                              
                              {daysUntilExpiry !== null && daysUntilExpiry <= 7 && reward.status === 'claimable' && (
                                <div className="flex items-center space-x-1 text-xs text-orange-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-semibold">{reward.amount.toFixed(4)} APT</p>
                              {reward.claimedAt && (
                                <p className="text-xs text-default-400">
                                  Claimed {reward.claimedAt.toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            
                            {reward.status === 'claimable' && (
                              <Button
                                onPress={() => claimReward(reward.id)}
                                isDisabled={claimingIds.has(reward.id)}
                                size="sm"
                              >
                                {claimingIds.has(reward.id) ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Claim'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Tab>
            <Tab key="pending" title="Pending">
              <div className="mt-4">
                {error && (
                  <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning-600 mt-0.5" />
                    <p className="text-sm text-warning-700">
                      {error}. Showing cached data.
                    </p>
                  </div>
                )}
                {filteredRewards.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="mx-auto h-12 w-12 text-default-400 mb-4" />
                    <p className="text-default-400">
                      No {activeTab} rewards found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRewards.map((reward) => {
                      const daysUntilExpiry = reward.expiresAt ? getDaysUntilExpiry(reward.expiresAt) : null;
                      
                      return (
                        <div
                          key={reward.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-default-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-default-100">
                              {getRewardIcon(reward.type)}
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{reward.sessionName}</h4>
                                <Chip size="sm" className={cn('text-xs', getStatusColor(reward.status))}>
                                  {reward.status}
                                </Chip>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-default-400">
                                <span className="capitalize">{reward.type} reward</span>
                                <span>•</span>
                                <span>{reward.earnedAt.toLocaleDateString()}</span>
                                {reward.metadata?.score && (
                                  <>
                                    <span>•</span>
                                    <span>Score: {reward.metadata.score}%</span>
                                  </>
                                )}
                              </div>
                              
                              {daysUntilExpiry !== null && daysUntilExpiry <= 7 && reward.status === 'claimable' && (
                                <div className="flex items-center space-x-1 text-xs text-orange-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-semibold">{reward.amount.toFixed(4)} APT</p>
                              {reward.claimedAt && (
                                <p className="text-xs text-default-400">
                                  Claimed {reward.claimedAt.toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            
                            {reward.status === 'claimable' && (
                              <Button
                                onPress={() => claimReward(reward.id)}
                                isDisabled={claimingIds.has(reward.id)}
                                size="sm"
                              >
                                {claimingIds.has(reward.id) ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Claim'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Tab>
            <Tab key="all" title="All">
              <div className="mt-4">
                {error && (
                  <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning-600 mt-0.5" />
                    <p className="text-sm text-warning-700">
                      {error}. Showing cached data.
                    </p>
                  </div>
                )}
                {filteredRewards.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="mx-auto h-12 w-12 text-default-400 mb-4" />
                    <p className="text-default-400">
                      No {activeTab} rewards found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRewards.map((reward) => {
                      const daysUntilExpiry = reward.expiresAt ? getDaysUntilExpiry(reward.expiresAt) : null;
                      
                      return (
                        <div
                          key={reward.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-default-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-default-100">
                              {getRewardIcon(reward.type)}
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{reward.sessionName}</h4>
                                <Chip size="sm" className={cn('text-xs', getStatusColor(reward.status))}>
                                  {reward.status}
                                </Chip>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-default-400">
                                <span className="capitalize">{reward.type} reward</span>
                                <span>•</span>
                                <span>{reward.earnedAt.toLocaleDateString()}</span>
                                {reward.metadata?.score && (
                                  <>
                                    <span>•</span>
                                    <span>Score: {reward.metadata.score}%</span>
                                  </>
                                )}
                              </div>
                              
                              {daysUntilExpiry !== null && daysUntilExpiry <= 7 && reward.status === 'claimable' && (
                                <div className="flex items-center space-x-1 text-xs text-orange-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-semibold">{reward.amount.toFixed(4)} APT</p>
                              {reward.claimedAt && (
                                <p className="text-xs text-default-400">
                                  Claimed {reward.claimedAt.toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            
                            {reward.status === 'claimable' && (
                              <Button
                                onPress={() => claimReward(reward.id)}
                                isDisabled={claimingIds.has(reward.id)}
                                size="sm"
                              >
                                {claimingIds.has(reward.id) ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Claim'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
};

export default RewardsDashboard;