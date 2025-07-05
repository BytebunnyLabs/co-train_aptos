'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Button } from '@heroui/react';
import { Chip } from '@heroui/react';
import { Input } from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { 
  TrendingUp,
  Zap,
  Lock,
  Unlock,
  Timer,
  Coins,
  Plus,
  Minus,
  Calculator,
  Info,
  Shield,
  Clock
} from 'lucide-react';
import { useRewardsStore, type StakingPool } from '@/lib/stores';

export function StakingPools() {
  const { 
    stakingPools, 
    stakeTokens, 
    unstakeTokens, 
    claimStakingRewards, 
    stakingLoading,
    tokenBalances
  } = useRewardsStore();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [actionType, setActionType] = useState<'stake' | 'unstake'>('stake');
  const [amount, setAmount] = useState('');

  // Mock staking pools if none exist
  const mockPools: StakingPool[] = stakingPools.length > 0 ? stakingPools : [
    {
      id: 'pool_cotrain_basic',
      name: 'COTRAIN Basic Pool',
      symbol: 'COTRAIN',
      apr: 12.5,
      totalStaked: 2500000,
      myStaked: 1250,
      pendingRewards: 15.75,
      lockPeriod: 0,
      description: 'Flexible staking with no lock period',
      isActive: true
    },
    {
      id: 'pool_cotrain_premium',
      name: 'COTRAIN Premium Pool',
      symbol: 'COTRAIN',
      apr: 25.0,
      totalStaked: 1800000,
      myStaked: 500,
      pendingRewards: 8.33,
      lockPeriod: 30,
      description: '30-day lock for higher rewards',
      isActive: true
    },
    {
      id: 'pool_cotrain_elite',
      name: 'COTRAIN Elite Pool',
      symbol: 'COTRAIN',
      apr: 45.0,
      totalStaked: 950000,
      myStaked: 0,
      pendingRewards: 0,
      lockPeriod: 90,
      description: '90-day lock for maximum rewards',
      isActive: true
    },
    {
      id: 'pool_apt_yield',
      name: 'APT Yield Pool',
      symbol: 'APT',
      apr: 8.2,
      totalStaked: 125000,
      myStaked: 25,
      pendingRewards: 0.15,
      lockPeriod: 7,
      description: '7-day lock APT staking',
      isActive: true
    }
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  };

  const getAvailableBalance = (symbol: string) => {
    const token = tokenBalances.find(t => t.symbol === symbol);
    return token?.amount || 0;
  };

  const calculateRewards = (pool: StakingPool, stakeAmount: number, days: number = 365) => {
    return (stakeAmount * pool.apr / 100) * (days / 365);
  };

  const handleOpenModal = (pool: StakingPool, action: 'stake' | 'unstake') => {
    setSelectedPool(pool);
    setActionType(action);
    setAmount('');
    onOpen();
  };

  const handleStakeAction = async () => {
    if (!selectedPool || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    try {
      if (actionType === 'stake') {
        await stakeTokens(selectedPool.id, amountNum);
      } else {
        await unstakeTokens(selectedPool.id, amountNum);
      }
      onOpenChange();
    } catch (error) {
      console.error('Staking action failed:', error);
    }
  };

  const handleClaimRewards = async (poolId: string) => {
    try {
      await claimStakingRewards(poolId);
    } catch (error) {
      console.error('Failed to claim rewards:', error);
    }
  };

  const totalStakedValue = mockPools.reduce((sum, pool) => sum + pool.myStaked * 0.1, 0); // Mock USD conversion
  const totalPendingValue = mockPools.reduce((sum, pool) => sum + pool.pendingRewards * 0.1, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">${totalStakedValue.toFixed(2)}</p>
            <p className="text-sm text-foreground-600">Total Staked</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-success/10">
                <Coins className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold">${totalPendingValue.toFixed(2)}</p>
            <p className="text-sm text-foreground-600">Pending Rewards</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-warning/10">
                <Calculator className="h-6 w-6 text-warning" />
              </div>
            </div>
            <p className="text-2xl font-bold">
              {(mockPools.reduce((sum, pool) => sum + pool.apr * pool.myStaked, 0) / mockPools.reduce((sum, pool) => sum + pool.myStaked, 0) || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-foreground-600">Average APR</p>
          </CardBody>
        </Card>
      </div>

      {/* Staking Pools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockPools.map((pool) => (
          <Card key={pool.id} className={pool.myStaked > 0 ? 'border-l-4 border-l-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {pool.symbol === 'COTRAIN' ? '🧠' : '🔴'}
                  </div>
                  <div>
                    <h3 className="font-semibold">{pool.name}</h3>
                    <p className="text-sm text-foreground-600">{pool.description}</p>
                  </div>
                </div>
                <Chip 
                  color={pool.isActive ? 'success' : 'danger'} 
                  variant="flat" 
                  size="sm"
                >
                  {pool.isActive ? 'Active' : 'Inactive'}
                </Chip>
              </div>
            </CardHeader>

            <CardBody className="space-y-4">
              {/* Pool Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-foreground/5 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">APR</span>
                  </div>
                  <p className="text-xl font-bold text-success">{pool.apr}%</p>
                </div>
                
                <div className="bg-foreground/5 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Lock className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">Lock Period</span>
                  </div>
                  <p className="text-xl font-bold">
                    {pool.lockPeriod === 0 ? 'Flexible' : `${pool.lockPeriod}d`}
                  </p>
                </div>
              </div>

              {/* My Position */}
              {pool.myStaked > 0 && (
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <h4 className="font-medium text-primary mb-3">My Position</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-foreground-600">Staked Amount</p>
                      <p className="font-semibold">{formatNumber(pool.myStaked)} {pool.symbol}</p>
                    </div>
                    <div>
                      <p className="text-foreground-600">Pending Rewards</p>
                      <p className="font-semibold text-success">{pool.pendingRewards.toFixed(4)} {pool.symbol}</p>
                    </div>
                  </div>
                  
                  {pool.pendingRewards > 0 && (
                    <Button
                      size="sm"
                      color="success"
                      variant="flat"
                      className="w-full mt-3"
                      startContent={<Coins className="h-4 w-4" />}
                      onClick={() => handleClaimRewards(pool.id)}
                      isLoading={stakingLoading}
                    >
                      Claim Rewards
                    </Button>
                  )}
                </div>
              )}

              {/* Pool Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-600">Total Staked:</span>
                  <span>{formatNumber(pool.totalStaked)} {pool.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-600">Available Balance:</span>
                  <span>{formatNumber(getAvailableBalance(pool.symbol))} {pool.symbol}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Plus className="h-4 w-4" />}
                  onClick={() => handleOpenModal(pool, 'stake')}
                  isDisabled={!pool.isActive || getAvailableBalance(pool.symbol) === 0}
                  className="flex-1"
                >
                  Stake
                </Button>
                
                {pool.myStaked > 0 && (
                  <Button
                    color="warning"
                    variant="flat"
                    startContent={<Minus className="h-4 w-4" />}
                    onClick={() => handleOpenModal(pool, 'unstake')}
                    className="flex-1"
                  >
                    Unstake
                  </Button>
                )}
              </div>

              {/* Estimated Rewards */}
              {pool.isActive && (
                <div className="bg-success/5 rounded-lg p-3 border border-success/20">
                  <div className="flex items-start space-x-2">
                    <Calculator className="h-4 w-4 text-success mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-success">Reward Calculator</p>
                      <p className="text-foreground-600">
                        Staking 1000 {pool.symbol} for 1 year = {calculateRewards(pool, 1000).toFixed(2)} {pool.symbol}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Staking Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center space-x-3">
                  {actionType === 'stake' ? (
                    <Plus className="h-5 w-5 text-primary" />
                  ) : (
                    <Minus className="h-5 w-5 text-warning" />
                  )}
                  <span>
                    {actionType === 'stake' ? 'Stake' : 'Unstake'} {selectedPool?.symbol}
                  </span>
                </div>
              </ModalHeader>
              <ModalBody className="space-y-4">
                {selectedPool && (
                  <>
                    {/* Pool Info */}
                    <div className="bg-foreground/5 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{selectedPool.name}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-foreground-600">APR</p>
                          <p className="font-semibold text-success">{selectedPool.apr}%</p>
                        </div>
                        <div>
                          <p className="text-foreground-600">Lock Period</p>
                          <p className="font-semibold">
                            {selectedPool.lockPeriod === 0 ? 'Flexible' : `${selectedPool.lockPeriod} days`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Amount to {actionType}
                      </label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        endContent={
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-foreground-600">{selectedPool.symbol}</span>
                            <Button
                              size="sm"
                              variant="light"
                              onClick={() => {
                                const maxAmount = actionType === 'stake' 
                                  ? getAvailableBalance(selectedPool.symbol)
                                  : selectedPool.myStaked;
                                setAmount(maxAmount.toString());
                              }}
                            >
                              Max
                            </Button>
                          </div>
                        }
                      />
                      <div className="flex justify-between text-sm text-foreground-600">
                        <span>
                          {actionType === 'stake' ? 'Available:' : 'Staked:'}
                        </span>
                        <span>
                          {actionType === 'stake' 
                            ? formatNumber(getAvailableBalance(selectedPool.symbol))
                            : formatNumber(selectedPool.myStaked)
                          } {selectedPool.symbol}
                        </span>
                      </div>
                    </div>

                    {/* Calculation */}
                    {amount && parseFloat(amount) > 0 && actionType === 'stake' && (
                      <div className="bg-success/5 rounded-lg p-4 border border-success/20">
                        <h5 className="font-medium text-success mb-2">Estimated Returns</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Daily rewards:</span>
                            <span>{calculateRewards(selectedPool, parseFloat(amount), 1).toFixed(4)} {selectedPool.symbol}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Monthly rewards:</span>
                            <span>{calculateRewards(selectedPool, parseFloat(amount), 30).toFixed(2)} {selectedPool.symbol}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Yearly rewards:</span>
                            <span>{calculateRewards(selectedPool, parseFloat(amount), 365).toFixed(2)} {selectedPool.symbol}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Warning for lock period */}
                    {selectedPool.lockPeriod > 0 && actionType === 'stake' && (
                      <div className="bg-warning/5 rounded-lg p-4 border border-warning/20">
                        <div className="flex items-start space-x-2">
                          <Shield className="h-4 w-4 text-warning mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-warning">Lock Period Notice</p>
                            <p className="text-foreground-600">
                              Your tokens will be locked for {selectedPool.lockPeriod} days. 
                              Early withdrawal may incur penalties.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color={actionType === 'stake' ? 'primary' : 'warning'}
                  onPress={handleStakeAction}
                  isLoading={stakingLoading}
                  isDisabled={!amount || parseFloat(amount) <= 0}
                >
                  {actionType === 'stake' ? 'Stake Tokens' : 'Unstake Tokens'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}