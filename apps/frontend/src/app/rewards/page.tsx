'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Chip, Progress } from '@heroui/react';
import { useToast } from '@/components/cotrain/ui/use-toast';
import { useAptosContract } from '@/hooks/useAptosContract';
import { useTransactionStatus } from '@/hooks/useTransactionStatus';
import {
  Trophy,
  Wallet,
  Download,
  History,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Award,
  Activity,
  Star
} from 'lucide-react';

interface RewardData {
  sessionId: string;
  sessionName: string;
  amount: number;
  status: 'claimable' | 'claimed' | 'pending';
  earnedAt: Date;
  claimedAt?: Date;
  score: number;
}

interface RewardsSummary {
  totalEarned: number;
  totalClaimed: number;
  totalClaimable: number;
  sessionsParticipated: number;
  averageScore: number;
}

// Mock data for demonstration
const mockRewards: RewardData[] = [
  {
    sessionId: '0x1234567890abcdef',
    sessionName: 'Advanced NLP Model Training',
    amount: 2500000000, // 25 APT in octas
    status: 'claimable',
    earnedAt: new Date(Date.now() - 86400000),
    score: 95,
  },
  {
    sessionId: '0xfedcba0987654321',
    sessionName: 'Computer Vision Dataset Training',
    amount: 1800000000, // 18 APT in octas
    status: 'claimable',
    earnedAt: new Date(Date.now() - 172800000),
    score: 87,
  },
  {
    sessionId: '0x1111222233334444',
    sessionName: 'Reinforcement Learning Challenge',
    amount: 4200000000, // 42 APT in octas
    status: 'claimed',
    earnedAt: new Date(Date.now() - 259200000),
    claimedAt: new Date(Date.now() - 86400000),
    score: 92,
  },
  {
    sessionId: '0x5555666677778888',
    sessionName: 'Natural Language Understanding',
    amount: 3100000000, // 31 APT in octas
    status: 'claimed',
    earnedAt: new Date(Date.now() - 345600000),
    claimedAt: new Date(Date.now() - 259200000),
    score: 89,
  },
];

const mockSummary: RewardsSummary = {
  totalEarned: 11600000000, // 116 APT in octas
  totalClaimed: 7300000000, // 73 APT in octas
  totalClaimable: 4300000000, // 43 APT in octas
  sessionsParticipated: 4,
  averageScore: 90.75,
};

export default function RewardsPage() {
  const { toast } = useToast();
  const { 
    connected, 
    account, 
    getAccountBalance, 
    getMyRewards,
    isLoading: contractLoading 
  } = useAptosContract();
  const { trackTransaction, pendingTransactions } = useTransactionStatus();

  const [rewards, setRewards] = useState<RewardData[]>(mockRewards);
  const [summary, setSummary] = useState<RewardsSummary>(mockSummary);
  const [isLoading, setIsLoading] = useState(false);
  const [accountBalance, setAccountBalance] = useState<number>(0);
  const [selectedRewards, setSelectedRewards] = useState<string[]>([]);

  useEffect(() => {
    if (connected && account) {
      loadRewardsData();
      loadAccountBalance();
    }
  }, [connected, account]);

  const loadRewardsData = async () => {
    setIsLoading(true);
    try {
      // In real implementation, fetch from contract/backend
      // const userRewards = await getMyRewards();
      
      // For now, using mock data
      setRewards(mockRewards);
      setSummary(mockSummary);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load rewards data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAccountBalance = async () => {
    try {
      const balance = await getAccountBalance();
      setAccountBalance(balance);
    } catch (error: any) {
      console.error('Failed to load account balance:', error);
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    if (!connected || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to claim rewards.",
        variant: "destructive",
      });
      return;
    }

    try {
      // In real implementation, call claim function
      toast({
        title: "Claim Initiated",
        description: "Your reward claim is being processed.",
      });

      // Mock successful claim
      setTimeout(() => {
        setRewards(prev => prev.map(reward => 
          reward.sessionId === rewardId 
            ? { ...reward, status: 'claimed' as const, claimedAt: new Date() }
            : reward
        ));
        
        toast({
          title: "Reward Claimed",
          description: "Your reward has been successfully claimed!",
        });
        
        loadAccountBalance();
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim reward.",
        variant: "destructive",
      });
    }
  };

  const handleBatchClaim = async () => {
    if (selectedRewards.length === 0) {
      toast({
        title: "No Rewards Selected",
        description: "Please select rewards to claim.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Batch Claim Initiated",
        description: `Claiming ${selectedRewards.length} rewards...`,
      });

      // Mock batch claim
      setTimeout(() => {
        setRewards(prev => prev.map(reward => 
          selectedRewards.includes(reward.sessionId)
            ? { ...reward, status: 'claimed' as const, claimedAt: new Date() }
            : reward
        ));
        
        setSelectedRewards([]);
        
        toast({
          title: "Rewards Claimed",
          description: `Successfully claimed ${selectedRewards.length} rewards!`,
        });
        
        loadAccountBalance();
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Batch Claim Failed",
        description: error.message || "Failed to claim rewards.",
        variant: "destructive",
      });
    }
  };

  const formatAmount = (amount: number): string => {
    return `${(amount / 100000000).toFixed(2)} APT`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'claimable':
        return <Chip color="success" variant="solid">Claimable</Chip>;
      case 'claimed':
        return <Chip color="default" variant="flat">Claimed</Chip>;
      case 'pending':
        return <Chip color="warning" variant="bordered">Pending</Chip>;
      default:
        return <Chip color="default" variant="bordered">{status}</Chip>;
    }
  };

  const claimableRewards = rewards.filter(r => r.status === 'claimable');
  const claimedRewards = rewards.filter(r => r.status === 'claimed');

  if (!connected) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Rewards</h1>
          <Card className="border-warning-200 bg-warning-50">
            <CardBody className="flex flex-row items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning-600" />
              <span className="text-warning-800">
                Please connect your wallet to view your rewards.
              </span>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Rewards</h1>
            <p className="text-default-400">
              Track and claim your training rewards
            </p>
          </div>
          {claimableRewards.length > 0 && (
            <Button 
              color="primary"
              onPress={handleBatchClaim}
              isDisabled={selectedRewards.length === 0}
              startContent={<Download className="h-4 w-4" />}
            >
              Claim Selected ({selectedRewards.length})
            </Button>
          )}
        </div>

        {/* Pending Transactions */}
        {pendingTransactions.length > 0 && (
          <Card className="mb-6 border-primary-200 bg-primary-50">
            <CardBody className="flex flex-row items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
              <span className="text-primary-800">
                {pendingTransactions.length} transaction(s) pending...
              </span>
            </CardBody>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-default-400">Current Balance</p>
                  <p className="text-2xl font-bold">{accountBalance.toFixed(2)} APT</p>
                </div>
                <Wallet className="h-8 w-8 text-blue-500" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-default-400">Total Claimable</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(summary.totalClaimable)}
                  </p>
                </div>
                <Download className="h-8 w-8 text-green-500" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-default-400">Total Earned</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatAmount(summary.totalEarned)}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-purple-500" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-default-400">Average Score</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {summary.averageScore.toFixed(1)}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Rewards Progress
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Claimed: {formatAmount(summary.totalClaimed)}</span>
                  <span>Total: {formatAmount(summary.totalEarned)}</span>
                </div>
                <Progress 
                  value={(summary.totalClaimed / summary.totalEarned) * 100} 
                  className="w-full"
                  color="success"
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.sessionsParticipated}</div>
                  <div className="text-sm text-default-400">Sessions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{claimedRewards.length}</div>
                  <div className="text-sm text-default-400">Claimed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{claimableRewards.length}</div>
                  <div className="text-sm text-default-400">Pending</div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Rewards List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Claimable Rewards */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Download className="h-5 w-5 text-green-500" />
                Claimable Rewards ({claimableRewards.length})
              </h3>
              <p className="text-sm text-default-400">
                Rewards ready to be claimed
              </p>
            </CardHeader>
            <CardBody>
              {claimableRewards.length === 0 ? (
                <div className="text-center py-8 text-default-400">
                  No claimable rewards at the moment
                </div>
              ) : (
                <div className="space-y-4">
                  {claimableRewards.map((reward) => (
                    <div 
                      key={reward.sessionId} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-default-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRewards.includes(reward.sessionId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRewards(prev => [...prev, reward.sessionId]);
                            } else {
                              setSelectedRewards(prev => prev.filter(id => id !== reward.sessionId));
                            }
                          }}
                          className="rounded"
                        />
                        <div>
                          <div className="font-medium">{reward.sessionName}</div>
                          <div className="text-sm text-default-400">
                            Score: {reward.score} • Earned: {reward.earnedAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {formatAmount(reward.amount)}
                        </div>
                        <Button 
                          size="sm" 
                          color="success"
                          onPress={() => handleClaimReward(reward.sessionId)}
                          className="mt-1"
                        >
                          Claim
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Claimed Rewards History */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5 text-gray-500" />
                Claimed Rewards ({claimedRewards.length})
              </h3>
              <p className="text-sm text-default-400">
                Your reward claim history
              </p>
            </CardHeader>
            <CardBody>
              {claimedRewards.length === 0 ? (
                <div className="text-center py-8 text-default-400">
                  No claimed rewards yet
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {claimedRewards.map((reward) => (
                    <div 
                      key={reward.sessionId} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">{reward.sessionName}</div>
                          <div className="text-sm text-default-400">
                            Score: {reward.score} • Claimed: {reward.claimedAt?.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-600">
                          {formatAmount(reward.amount)}
                        </div>
                        {getStatusBadge(reward.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button 
                variant="bordered" 
                onPress={loadRewardsData} 
                isDisabled={isLoading}
                startContent={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
              >
                Refresh Data
              </Button>
              
              <Button 
                variant="bordered" 
                onPress={() => window.open('/training/sessions', '_blank')}
                startContent={<Award className="h-4 w-4" />}
              >
                Join Sessions
              </Button>
              
              <Button 
                variant="bordered" 
                isDisabled
                startContent={<DollarSign className="h-4 w-4" />}
              >
                Export History
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}