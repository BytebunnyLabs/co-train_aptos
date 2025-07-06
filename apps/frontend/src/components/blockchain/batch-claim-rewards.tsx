import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardBody, CardHeader, Button, Chip, Checkbox, Progress, Divider, ScrollShadow, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from '@heroui/react';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Gift,
  DollarSign,
  RefreshCw,
  Download,
  Filter,
  X,
  Users,
  Target,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RewardItem } from './rewards-dashboard';

interface BatchClaimRewardsProps {
  className?: string;
  maxBatchSize?: number;
  onClaimSuccess?: (claimedRewards: RewardItem[]) => void;
  onError?: (error: Error) => void;
}

interface ClaimProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

type SortOption = 'amount-desc' | 'amount-asc' | 'expiry-soon' | 'expiry-late' | 'type' | 'session';
type FilterOption = 'all' | 'expiring-soon' | 'high-value' | 'low-value';

export const BatchClaimRewards: React.FC<BatchClaimRewardsProps> = ({
  className,
  maxBatchSize = 20,
  onClaimSuccess,
  onError,
}) => {
  const { account, connected } = useWallet();
  
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [selectedRewards, setSelectedRewards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimProgress, setClaimProgress] = useState<ClaimProgress | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('amount-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch claimable rewards
  const fetchClaimableRewards = async () => {
    if (!connected || !account) {
      setRewards([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/blockchain/rewards/${account.address}?status=claimable`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch claimable rewards');
      }

      const data = await response.json();
      setRewards(data.rewards || []);
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rewards');
      
      // Mock data for development
      const mockRewards: RewardItem[] = [
        {
          id: '1',
          type: 'participation',
          amount: 5.25,
          status: 'claimable',
          sessionId: 'session-1',
          sessionName: 'AI Model Training - Computer Vision',
          earnedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Expires in 2 days
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
          expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // Expires in 25 days
          metadata: { participationTime: 180, score: 92, rank: 2 },
        },
        {
          id: '3',
          type: 'completion',
          amount: 8.75,
          status: 'claimable',
          sessionId: 'session-3',
          sessionName: 'Language Model Fine-tuning',
          earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Expires in 1 day
          metadata: { participationTime: 90, score: 78 },
        },
        {
          id: '4',
          type: 'bonus',
          amount: 3.15,
          status: 'claimable',
          sessionId: 'session-4',
          sessionName: 'Special Event Training',
          earnedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          metadata: { participationTime: 60, score: 95 },
        },
      ];
      setRewards(mockRewards);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort rewards
  const filteredAndSortedRewards = useMemo(() => {
    let filtered = [...rewards];
    
    // Apply filters
    switch (filterBy) {
      case 'expiring-soon':
        filtered = filtered.filter(r => {
          if (!r.expiresAt) return false;
          const daysUntilExpiry = Math.ceil((r.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 7;
        });
        break;
      case 'high-value':
        filtered = filtered.filter(r => r.amount >= 10);
        break;
      case 'low-value':
        filtered = filtered.filter(r => r.amount < 10);
        break;
      default:
        // 'all' - no filtering
        break;
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'amount-desc':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      case 'expiry-soon':
        filtered.sort((a, b) => {
          if (!a.expiresAt && !b.expiresAt) return 0;
          if (!a.expiresAt) return 1;
          if (!b.expiresAt) return -1;
          return a.expiresAt.getTime() - b.expiresAt.getTime();
        });
        break;
      case 'expiry-late':
        filtered.sort((a, b) => {
          if (!a.expiresAt && !b.expiresAt) return 0;
          if (!a.expiresAt) return -1;
          if (!b.expiresAt) return 1;
          return b.expiresAt.getTime() - a.expiresAt.getTime();
        });
        break;
      case 'type':
        filtered.sort((a, b) => a.type.localeCompare(b.type));
        break;
      case 'session':
        filtered.sort((a, b) => a.sessionName.localeCompare(b.sessionName));
        break;
    }
    
    return filtered;
  }, [rewards, sortBy, filterBy]);

  // Calculate totals
  const selectedRewardsList = useMemo(() => {
    return filteredAndSortedRewards.filter(r => selectedRewards.has(r.id));
  }, [filteredAndSortedRewards, selectedRewards]);

  const totalSelectedAmount = useMemo(() => {
    return selectedRewardsList.reduce((sum, reward) => sum + reward.amount, 0);
  }, [selectedRewardsList]);

  const expiringRewards = useMemo(() => {
    return selectedRewardsList.filter(r => {
      if (!r.expiresAt) return false;
      const daysUntilExpiry = Math.ceil((r.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7;
    });
  }, [selectedRewardsList]);

  // Handle selection
  const handleSelectAll = () => {
    if (selectedRewards.size === filteredAndSortedRewards.length) {
      setSelectedRewards(new Set());
    } else {
      const maxSelectable = Math.min(filteredAndSortedRewards.length, maxBatchSize);
      const newSelected = new Set(filteredAndSortedRewards.slice(0, maxSelectable).map(r => r.id));
      setSelectedRewards(newSelected);
    }
  };

  const handleSelectReward = (rewardId: string) => {
    const newSelected = new Set(selectedRewards);
    if (newSelected.has(rewardId)) {
      newSelected.delete(rewardId);
    } else if (newSelected.size < maxBatchSize) {
      newSelected.add(rewardId);
    } else {
      toast.error(`You can only select up to ${maxBatchSize} rewards at once.`);
      return;
    }
    setSelectedRewards(newSelected);
  };

  // Handle batch claim
  const handleBatchClaim = async () => {
    if (selectedRewards.size === 0 || !account) return;

    try {
      setClaiming(true);
      setClaimProgress({
        total: selectedRewards.size,
        completed: 0,
        failed: 0,
      });

      const rewardIds = Array.from(selectedRewards);
      
      // Simulate progress for development
      for (let i = 0; i < rewardIds.length; i++) {
        const rewardId = rewardIds[i];
        const reward = rewards.find(r => r.id === rewardId);
        
        setClaimProgress(prev => prev ? {
          ...prev,
          current: reward?.sessionName || `Reward ${i + 1}`,
        } : null);

        try {
          // TODO: Replace with actual API call
          const response = await fetch(`/api/blockchain/rewards/${rewardId}/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: account.address }),
          });

          if (!response.ok) {
            throw new Error(`Failed to claim reward ${rewardId}`);
          }

          setClaimProgress(prev => prev ? {
            ...prev,
            completed: prev.completed + 1,
          } : null);
          
          // Simulate delay
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`Failed to claim reward ${rewardId}:`, err);
          setClaimProgress(prev => prev ? {
            ...prev,
            failed: prev.failed + 1,
          } : null);
        }
      }

      // Update rewards list
      setRewards(prev => prev.map(reward => 
        selectedRewards.has(reward.id)
          ? { ...reward, status: 'claimed' as const, claimedAt: new Date() }
          : reward
      ));

      const claimedRewards = rewards.filter(r => selectedRewards.has(r.id));
      onClaimSuccess?.(claimedRewards);
      
      // Clear selection
      setSelectedRewards(new Set());
      
      // Show success toast
      toast.success(`Successfully claimed ${claimProgress?.completed || 0} rewards.`);
      
      // Close dialog
      setShowDialog(false);
    } catch (err) {
      console.error('Batch claim failed:', err);
      const error = err instanceof Error ? err : new Error('Batch claim failed');
      onError?.(error);
      
      toast.error(`Batch claim failed: ${error.message}`);
    } finally {
      setClaiming(false);
      setClaimProgress(null);
    }
  };

  const getRewardIcon = (type: RewardItem['type']) => {
    switch (type) {
      case 'participation': return <Users className="h-4 w-4" />;
      case 'performance': return <Target className="h-4 w-4" />;
      case 'completion': return <CheckCircle className="h-4 w-4" />;
      case 'bonus': return <Award className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getDaysUntilExpiry = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    fetchClaimableRewards();
  }, [connected, account]);

  if (!connected) {
    return (
      <Card className={cn('w-full', className)}>
        <CardBody className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center space-y-2">
              <Gift className="mx-auto h-8 w-8 text-default-400" />
              <p className="text-sm text-default-400">Connect your wallet to claim rewards</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Download className="h-5 w-5" />
            Batch Claim Rewards
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onPress={fetchClaimableRewards}
            isDisabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
        
        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm text-default-400">
          <span>{rewards.length} claimable rewards</span>
          <span>•</span>
          <span>{selectedRewards.size} selected</span>
          {selectedRewards.size > 0 && (
            <>
              <span>•</span>
              <span className="font-medium text-default-900">
                {totalSelectedAmount.toFixed(4)} APT
              </span>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardBody className="space-y-4">
        {error && (
          <div className="border-yellow-200 bg-yellow-50 border rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800">
              {error}. Showing cached data.
            </p>
          </div>
        )}
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Select 
              selectedKeys={[sortBy]} 
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSortBy(selected as SortOption);
              }}
              className="w-48"
              placeholder="Sort by"
            >
              <SelectItem key="amount-desc">Amount (High to Low)</SelectItem>
              <SelectItem key="amount-asc">Amount (Low to High)</SelectItem>
              <SelectItem key="expiry-soon">Expiring Soon</SelectItem>
              <SelectItem key="expiry-late">Expiring Later</SelectItem>
              <SelectItem key="type">Type</SelectItem>
              <SelectItem key="session">Session</SelectItem>
            </Select>
            
            <Select 
              selectedKeys={[filterBy]} 
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilterBy(selected as FilterOption);
              }}
              className="w-40"
              placeholder="Filter by"
            >
              <SelectItem key="all">All Rewards</SelectItem>
              <SelectItem key="expiring-soon">Expiring Soon</SelectItem>
              <SelectItem key="high-value">High Value (≥10 APT)</SelectItem>
              <SelectItem key="low-value">Low Value (&lt;10 APT)</SelectItem>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="bordered"
              size="sm"
              onPress={handleSelectAll}
              isDisabled={filteredAndSortedRewards.length === 0}
            >
              {selectedRewards.size === filteredAndSortedRewards.length ? 'Deselect All' : 'Select All'}
            </Button>
            
            <Button
              isDisabled={selectedRewards.size === 0 || claiming}
              className="min-w-24"
              onPress={() => setShowDialog(true)}
            >
              {claiming ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>Claim Selected ({selectedRewards.size})</>
              )}
            </Button>
            
            <Modal isOpen={showDialog} onOpenChange={setShowDialog} size="2xl">
              <ModalContent>
                <ModalHeader>
                  <div>
                    <h3 className="text-lg font-semibold">Confirm Batch Claim</h3>
                    <p className="text-sm text-default-400">
                      You are about to claim {selectedRewards.size} rewards totaling {totalSelectedAmount.toFixed(4)} APT.
                    </p>
                  </div>
                </ModalHeader>
                <ModalBody>
                
                {/* Claim Progress */}
                {claimProgress && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{claimProgress.completed} / {claimProgress.total}</span>
                      </div>
                      <Progress 
                        value={(claimProgress.completed / claimProgress.total) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    {claimProgress.current && (
                      <p className="text-sm text-default-400">
                        Currently claiming: {claimProgress.current}
                      </p>
                    )}
                    
                    {claimProgress.failed > 0 && (
                      <div className="p-3 border border-red-200 bg-red-50 rounded-lg flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        <p className="text-sm text-red-800">
                          {claimProgress.failed} rewards failed to claim.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Selected Rewards List */}
                {!claimProgress && (
                  <ScrollShadow className="max-h-96">
                    <div className="space-y-2">
                      {selectedRewardsList.map((reward) => {
                        const daysUntilExpiry = reward.expiresAt ? getDaysUntilExpiry(reward.expiresAt) : null;
                        
                        return (
                          <div key={reward.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-default-100">
                                {getRewardIcon(reward.type)}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{reward.sessionName}</p>
                                <div className="flex items-center space-x-2 text-xs text-default-400">
                                  <span className="capitalize">{reward.type}</span>
                                  {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-orange-600">
                                        Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="font-semibold">{reward.amount.toFixed(4)} APT</span>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollShadow>
                )}
                
                {/* Warnings */}
                {!claimProgress && expiringRewards.length > 0 && (
                  <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <p className="text-sm text-orange-800">
                      {expiringRewards.length} of the selected rewards expire within 7 days. Claim them soon!
                    </p>
                  </div>
                )}
                
              </ModalBody>
              <ModalFooter>
                {!claiming ? (
                  <>
                    <Button variant="bordered" onPress={() => setShowDialog(false)}>
                      Cancel
                    </Button>
                    <Button color="primary" onPress={handleBatchClaim}>
                      Confirm Claim ({totalSelectedAmount.toFixed(4)} APT)
                    </Button>
                  </>
                ) : (
                  <Button isDisabled className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Claiming Rewards...
                  </Button>
                )}
              </ModalFooter>
              </ModalContent>
            </Modal>
          </div>
        </div>
        
        {/* Rewards List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded">
                <div className="w-4 h-4 bg-default-100 rounded" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-default-100 rounded w-3/4" />
                  <div className="h-3 bg-default-100 rounded w-1/2" />
                </div>
                <div className="h-4 bg-default-100 rounded w-20" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedRewards.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="mx-auto h-12 w-12 text-default-400 mb-4" />
            <p className="text-default-400">
              No claimable rewards found
            </p>
          </div>
        ) : (
          <ScrollShadow className="h-96">
            <div className="space-y-2">
              {filteredAndSortedRewards.map((reward) => {
                const isSelected = selectedRewards.has(reward.id);
                const daysUntilExpiry = reward.expiresAt ? getDaysUntilExpiry(reward.expiresAt) : null;
                const canSelect = isSelected || selectedRewards.size < maxBatchSize;
                
                return (
                  <div
                    key={reward.id}
                    className={cn(
                      'flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors',
                      isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-default-100/50',
                      !canSelect && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => canSelect && handleSelectReward(reward.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={!canSelect}
                      onChange={() => canSelect && handleSelectReward(reward.id)}
                    />
                    
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-default-100">
                      {getRewardIcon(reward.type)}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm">{reward.sessionName}</h4>
                        <Chip size="sm" variant="flat" className="text-xs capitalize">
                          {reward.type}
                        </Chip>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-default-400">
                        <span>Earned {reward.earnedAt.toLocaleDateString()}</span>
                        {reward.metadata?.score && (
                          <>
                            <span>•</span>
                            <span>Score: {reward.metadata.score}%</span>
                          </>
                        )}
                        {daysUntilExpiry !== null && (
                          <>
                            <span>•</span>
                            <span className={cn(
                              daysUntilExpiry <= 7 ? 'text-orange-600' : 'text-default-400'
                            )}>
                              Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {daysUntilExpiry !== null && daysUntilExpiry <= 3 && (
                        <div className="flex items-center space-x-1 text-xs text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Expiring soon!</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">{reward.amount.toFixed(4)} APT</p>
                      {reward.metadata?.rank && (
                        <p className="text-xs text-default-400">
                          Rank #{reward.metadata.rank}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollShadow>
        )}
        
        {/* Summary */}
        {selectedRewards.size > 0 && (
          <div className="mt-4 p-4 bg-default-100/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {selectedRewards.size} reward{selectedRewards.size !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-default-400">
                  Total value: {totalSelectedAmount.toFixed(4)} APT
                </p>
              </div>
              
              {expiringRewards.length > 0 && (
                <div className="flex items-center space-x-1 text-xs text-orange-600">
                  <Clock className="h-3 w-3" />
                  <span>{expiringRewards.length} expiring soon</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default BatchClaimRewards;