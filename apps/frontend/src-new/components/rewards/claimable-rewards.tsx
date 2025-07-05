'use client';

import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Button } from '@heroui/react';
import { Chip } from '@heroui/react';
import { 
  Gift,
  Clock,
  Coins,
  Award,
  CheckCircle,
  Zap,
  Calendar,
  Star,
  Brain,
  Timer
} from 'lucide-react';
import { useRewardsStore, type ClaimableReward } from '@/lib/stores';
import { formatDistanceToNow } from 'date-fns';

export function ClaimableRewards() {
  const { claimableRewards, claimReward, claimingReward, claimAllRewards } = useRewardsStore();

  // Mock claimable rewards if none exist
  const mockRewards: ClaimableReward[] = claimableRewards.length > 0 ? claimableRewards : [
    {
      id: 'reward_001',
      type: 'token',
      amount: 125.5,
      symbol: 'COTRAIN',
      earnedFrom: 'Language Model Training Session',
      earnedDate: '2024-01-15T10:00:00Z',
      claimableDate: '2024-01-15T16:00:00Z',
      isClaimable: true
    },
    {
      id: 'reward_002',
      type: 'nft',
      nft: {
        name: 'AI Trainer Badge',
        image: '/api/placeholder/100/100',
        rarity: 'rare'
      },
      earnedFrom: '100 Hour Milestone Achievement',
      earnedDate: '2024-01-14T08:30:00Z',
      claimableDate: '2024-01-14T08:30:00Z',
      isClaimable: true
    },
    {
      id: 'reward_003',
      type: 'token',
      amount: 75.0,
      symbol: 'COTRAIN',
      earnedFrom: 'Computer Vision Training',
      earnedDate: '2024-01-12T14:20:00Z',
      claimableDate: '2024-01-16T14:20:00Z',
      isClaimable: false
    },
    {
      id: 'reward_004',
      type: 'token',
      amount: 50.25,
      symbol: 'APT',
      earnedFrom: 'Weekly Bonus Rewards',
      earnedDate: '2024-01-10T00:00:00Z',
      claimableDate: '2024-01-10T00:00:00Z',
      isClaimable: true
    }
  ];

  const getRewardIcon = (reward: ClaimableReward) => {
    if (reward.type === 'nft') {
      return <Award className="h-5 w-5" />;
    }
    
    switch (reward.symbol) {
      case 'COTRAIN':
        return <Brain className="h-5 w-5" />;
      case 'APT':
        return <Coins className="h-5 w-5" />;
      default:
        return <Gift className="h-5 w-5" />;
    }
  };

  const getRewardColor = (reward: ClaimableReward) => {
    if (reward.type === 'nft') {
      switch (reward.nft?.rarity) {
        case 'legendary': return 'warning';
        case 'epic': return 'secondary';
        case 'rare': return 'primary';
        default: return 'default';
      }
    }
    
    switch (reward.symbol) {
      case 'COTRAIN': return 'primary';
      case 'APT': return 'danger';
      default: return 'success';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '👑';
      case 'epic':
        return '💜';
      case 'rare':
        return '💎';
      default:
        return '🏆';
    }
  };

  const claimableCount = mockRewards.filter(r => r.isClaimable).length;
  const totalClaimableValue = mockRewards
    .filter(r => r.isClaimable && r.type === 'token')
    .reduce((sum, r) => sum + (r.amount || 0) * 0.1, 0); // Mock USD conversion

  const handleClaimReward = async (rewardId: string) => {
    try {
      await claimReward(rewardId);
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  const handleClaimAll = async () => {
    try {
      await claimAllRewards();
    } catch (error) {
      console.error('Failed to claim all rewards:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <Gift className="h-5 w-5 text-warning" />
            <div>
              <h3 className="text-lg font-semibold">Claimable Rewards</h3>
              <p className="text-sm text-foreground-600">
                {claimableCount} rewards ready to claim
              </p>
            </div>
          </div>
          {claimableCount > 0 && (
            <Button
              color="warning"
              size="sm"
              startContent={<Zap className="h-4 w-4" />}
              onClick={handleClaimAll}
              isLoading={claimingReward}
            >
              Claim All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardBody className="space-y-4">
        {/* Summary */}
        {claimableCount > 0 && (
          <div className="bg-warning/5 rounded-lg p-4 border border-warning/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-warning">
                  ${totalClaimableValue.toFixed(2)} Ready to Claim
                </p>
                <p className="text-sm text-foreground-600">
                  {claimableCount} rewards from training contributions
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-sm">Available now</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rewards List */}
        <div className="space-y-3">
          {mockRewards.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-foreground-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Rewards Yet</h3>
              <p className="text-foreground-600">
                Start training AI models to earn your first rewards!
              </p>
            </div>
          ) : (
            mockRewards.map((reward) => (
              <div 
                key={reward.id} 
                className={`border rounded-lg p-4 ${
                  reward.isClaimable 
                    ? 'border-warning/30 bg-warning/5' 
                    : 'border-divider'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      reward.isClaimable ? 'bg-warning/10' : 'bg-foreground/10'
                    }`}>
                      <div className={reward.isClaimable ? 'text-warning' : 'text-foreground-600'}>
                        {getRewardIcon(reward)}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {reward.type === 'token' ? (
                          <h4 className="font-semibold">
                            {reward.amount} {reward.symbol}
                          </h4>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{reward.nft?.name}</h4>
                            <span className="text-lg">{getRarityIcon(reward.nft?.rarity || '')}</span>
                          </div>
                        )}
                        
                        <Chip 
                          size="sm" 
                          color={getRewardColor(reward) as any}
                          variant="flat"
                        >
                          {reward.type === 'nft' ? reward.nft?.rarity.toUpperCase() : reward.symbol}
                        </Chip>
                      </div>
                      
                      <p className="text-sm text-foreground-600 mb-2">
                        From: {reward.earnedFrom}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-foreground-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Earned {formatDistanceToNow(new Date(reward.earnedDate), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {!reward.isClaimable && (
                          <div className="flex items-center space-x-1">
                            <Timer className="h-3 w-3" />
                            <span>
                              Claimable {formatDistanceToNow(new Date(reward.claimableDate), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {reward.isClaimable ? (
                      <Button
                        color="warning"
                        size="sm"
                        variant="flat"
                        startContent={<CheckCircle className="h-4 w-4" />}
                        onClick={() => handleClaimReward(reward.id)}
                        isLoading={claimingReward}
                      >
                        Claim
                      </Button>
                    ) : (
                      <Chip size="sm" color="default" variant="flat">
                        Pending
                      </Chip>
                    )}
                  </div>
                </div>
                
                {/* NFT Preview */}
                {reward.type === 'nft' && reward.nft && (
                  <div className="mt-3 p-3 bg-foreground/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{reward.nft.name}</p>
                        <p className="text-xs text-foreground-600">
                          Exclusive {reward.nft.rarity} achievement NFT
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Tips */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-start space-x-3">
            <Star className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-primary">Maximize Your Rewards</h4>
              <p className="text-sm text-foreground-600 mt-1">
                Participate in longer training sessions and maintain high efficiency to earn bonus rewards. 
                NFTs are awarded for special achievements and milestones.
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}