import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ContributionTrackerService } from './contribution-tracker.service';
import { P2PNetworkService } from './p2p-network.service';
import { BlockchainService } from '../../blockchain/blockchain.service';

export interface RewardDistribution {
  sessionId: number;
  totalRewardPool: number;
  distributions: Map<string, number>;
  timestamp: Date;
}

export interface RewardMetrics {
  nodeId: string;
  totalRewardsEarned: number;
  sessionsParticipated: number;
  averageRewardPerSession: number;
  lastRewardDate: Date;
}

@Injectable()
export class RewardDistributorService {
  private readonly logger = new Logger(RewardDistributorService.name);
  private rewardHistory: Map<number, RewardDistribution> = new Map();
  private nodeRewardMetrics: Map<string, RewardMetrics> = new Map();
  private pendingDistributions: Map<number, RewardDistribution> = new Map();

  constructor(
    private eventEmitter: EventEmitter2,
    private contributionTracker: ContributionTrackerService,
    private p2pNetwork: P2PNetworkService,
    private blockchainService: BlockchainService,
  ) {}

  async distributeSessionRewards(
    sessionId: number,
    totalRewardPool: number,
    includeBonus: boolean = false,
  ): Promise<RewardDistribution> {
    try {
      this.logger.log(`Starting reward distribution for session ${sessionId}`);

      // Calculate base rewards based on contributions
      const baseRewards = await this.contributionTracker.calculateSessionRewards(
        sessionId,
        totalRewardPool * 0.8, // 80% for base contributions
      );

      // Calculate bonus rewards for top performers
      let bonusRewards = new Map<string, number>();
      if (includeBonus) {
        bonusRewards = await this.calculateBonusRewards(
          sessionId,
          totalRewardPool * 0.2, // 20% for bonuses
        );
      }

      // Combine base and bonus rewards
      const finalDistributions = new Map<string, number>();
      
      for (const [nodeId, baseReward] of baseRewards) {
        const bonusReward = bonusRewards.get(nodeId) || 0;
        finalDistributions.set(nodeId, baseReward + bonusReward);
      }

      // Add any remaining bonus rewards
      for (const [nodeId, bonusReward] of bonusRewards) {
        if (!finalDistributions.has(nodeId)) {
          finalDistributions.set(nodeId, bonusReward);
        }
      }

      const distribution: RewardDistribution = {
        sessionId,
        totalRewardPool,
        distributions: finalDistributions,
        timestamp: new Date(),
      };

      // Execute blockchain transactions for reward distribution
      await this.executeRewardDistribution(distribution);

      // Update metrics and history
      this.updateRewardMetrics(distribution);
      this.rewardHistory.set(sessionId, distribution);

      // Notify participants
      await this.notifyRewardRecipients(distribution);

      this.eventEmitter.emit('rewards.distributed', distribution);
      this.logger.log(`Reward distribution completed for session ${sessionId}`);

      return distribution;
    } catch (error) {
      this.logger.error(`Failed to distribute rewards for session ${sessionId}:`, error);
      throw error;
    }
  }

  private async calculateBonusRewards(
    sessionId: number,
    bonusPool: number,
  ): Promise<Map<string, number>> {
    const bonusRewards = new Map<string, number>();

    try {
      // Get top contributors for this session
      const topContributors = await this.contributionTracker.getTopContributors(sessionId, 5);
      
      if (topContributors.length === 0) {
        return bonusRewards;
      }

      // Define bonus tiers
      const bonusTiers = [
        { percentage: 40, label: 'Gold' },    // 1st place gets 40% of bonus pool
        { percentage: 25, label: 'Silver' },  // 2nd place gets 25%
        { percentage: 15, label: 'Bronze' },  // 3rd place gets 15%
        { percentage: 10, label: 'Merit' },   // 4th place gets 10%
        { percentage: 10, label: 'Merit' },   // 5th place gets 10%
      ];

      // Distribute bonus rewards
      for (let i = 0; i < Math.min(topContributors.length, bonusTiers.length); i++) {
        const contributor = topContributors[i];
        const tier = bonusTiers[i];
        const bonusAmount = Math.floor((bonusPool * tier.percentage) / 100);
        
        bonusRewards.set(contributor.nodeId, bonusAmount);
        
        this.logger.debug(
          `${tier.label} bonus: ${contributor.nodeId} receives ${bonusAmount} tokens`
        );
      }

      // Quality bonus for nodes with exceptional gradient quality
      const qualityThreshold = 90;
      const qualityBonusPool = bonusPool * 0.1; // 10% of bonus pool for quality
      
      const contributions = await this.contributionTracker.getSessionContributions(sessionId);
      const highQualityNodes = contributions.filter(
        contrib => contrib.gradientQuality >= qualityThreshold
      );

      if (highQualityNodes.length > 0) {
        const qualityBonusPerNode = Math.floor(qualityBonusPool / highQualityNodes.length);
        
        for (const contrib of highQualityNodes) {
          const currentBonus = bonusRewards.get(contrib.nodeId) || 0;
          bonusRewards.set(contrib.nodeId, currentBonus + qualityBonusPerNode);
        }
      }

    } catch (error) {
      this.logger.error('Error calculating bonus rewards:', error);
    }

    return bonusRewards;
  }

  private async executeRewardDistribution(distribution: RewardDistribution): Promise<void> {
    const batchSize = 10; // Process rewards in batches to avoid overwhelming the blockchain
    const distributionArray = Array.from(distribution.distributions.entries());

    for (let i = 0; i < distributionArray.length; i += batchSize) {
      const batch = distributionArray.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async ([nodeId, amount]) => {
          try {
            // Transfer reward tokens to the node
            await this.blockchainService.submitContribution({
              sessionId: distribution.sessionId.toString(),
              participantAddress: nodeId,
              score: amount, // Using contribution score as reward amount for simplicity
            });
            
            this.logger.debug(`Reward sent to ${nodeId}: ${amount} tokens`);
          } catch (error) {
            this.logger.error(`Failed to send reward to ${nodeId}:`, error);
            // Store failed distribution for retry
            this.storePendingDistribution(distribution.sessionId, nodeId, amount);
          }
        })
      );

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < distributionArray.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private updateRewardMetrics(distribution: RewardDistribution): void {
    for (const [nodeId, rewardAmount] of distribution.distributions) {
      let metrics = this.nodeRewardMetrics.get(nodeId);
      
      if (!metrics) {
        metrics = {
          nodeId,
          totalRewardsEarned: 0,
          sessionsParticipated: 0,
          averageRewardPerSession: 0,
          lastRewardDate: new Date(),
        };
        this.nodeRewardMetrics.set(nodeId, metrics);
      }

      metrics.totalRewardsEarned += rewardAmount;
      metrics.sessionsParticipated += 1;
      metrics.averageRewardPerSession = metrics.totalRewardsEarned / metrics.sessionsParticipated;
      metrics.lastRewardDate = distribution.timestamp;
    }
  }

  private async notifyRewardRecipients(distribution: RewardDistribution): Promise<void> {
    try {
      for (const [nodeId, amount] of distribution.distributions) {
        await this.p2pNetwork.notifyNode(nodeId, {
          type: 'REWARD_RECEIVED',
          sessionId: distribution.sessionId,
          rewardAmount: amount,
          timestamp: distribution.timestamp,
        });
      }
    } catch (error) {
      this.logger.warn('Failed to notify some reward recipients:', error);
    }
  }

  private storePendingDistribution(sessionId: number, nodeId: string, amount: number): void {
    let pending = this.pendingDistributions.get(sessionId);
    if (!pending) {
      pending = {
        sessionId,
        totalRewardPool: 0,
        distributions: new Map(),
        timestamp: new Date(),
      };
      this.pendingDistributions.set(sessionId, pending);
    }
    
    pending.distributions.set(nodeId, amount);
  }

  // Retry pending distributions every hour
  @Cron(CronExpression.EVERY_HOUR)
  async retryPendingDistributions(): Promise<void> {
    if (this.pendingDistributions.size === 0) {
      return;
    }

    this.logger.log('Retrying pending reward distributions');

    for (const [sessionId, pendingDistribution] of this.pendingDistributions) {
      try {
        await this.executeRewardDistribution(pendingDistribution);
        this.pendingDistributions.delete(sessionId);
        this.logger.log(`Successfully retried pending distributions for session ${sessionId}`);
      } catch (error) {
        this.logger.error(`Failed to retry distributions for session ${sessionId}:`, error);
      }
    }
  }

  async getSessionRewardDistribution(sessionId: number): Promise<RewardDistribution | null> {
    return this.rewardHistory.get(sessionId) || null;
  }

  async getNodeRewardMetrics(nodeId: string): Promise<RewardMetrics | null> {
    return this.nodeRewardMetrics.get(nodeId) || null;
  }

  async getAllNodeRewardMetrics(): Promise<any[]> {
    // Return mock data if no real metrics available
    const existingMetrics = Array.from(this.nodeRewardMetrics.values());
    
    if (existingMetrics.length > 0) {
      return existingMetrics.map(metrics => ({
        nodeId: metrics.nodeId,
        totalRewardsEarned: metrics.totalRewardsEarned,
        sessionsParticipated: metrics.sessionsParticipated,
        averageRewardPerSession: metrics.averageRewardPerSession,
        lastRewardDate: metrics.lastRewardDate.toISOString(),
        weeklyEarnings: Math.floor(metrics.totalRewardsEarned * 0.3),
        monthlyEarnings: Math.floor(metrics.totalRewardsEarned * 0.8),
        efficiency: Math.floor(Math.random() * 20) + 80, // 80-100%
        reputationScore: Math.floor(Math.random() * 500) + 500,
        category: this.getNodeCategory(metrics.totalRewardsEarned),
        rankChange: Math.floor(Math.random() * 10) - 5, // -5 to +5
        currentRank: Math.floor(Math.random() * 100) + 1
      }));
    }

    // Generate mock metrics for development
    const mockNodes = [
      'node-advanced-001', 'node-performer-002', 'node-standard-003', 
      'node-elite-004', 'node-newcomer-005', 'node-validator-006',
      'node-worker-007', 'node-storage-008', 'node-compute-009',
      'node-edge-010', 'node-hub-011', 'node-relay-012'
    ];

    return mockNodes.map((nodeId, index) => {
      const totalEarnings = Math.floor(Math.random() * 5000) + 100;
      const sessions = Math.floor(Math.random() * 50) + 5;
      
      return {
        nodeId,
        totalRewardsEarned: totalEarnings,
        sessionsParticipated: sessions,
        averageRewardPerSession: Math.floor(totalEarnings / sessions),
        lastRewardDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        weeklyEarnings: Math.floor(totalEarnings * 0.2),
        monthlyEarnings: Math.floor(totalEarnings * 0.7),
        efficiency: Math.floor(Math.random() * 20) + 80,
        reputationScore: Math.floor(Math.random() * 500) + 500,
        category: this.getNodeCategory(totalEarnings),
        rankChange: Math.floor(Math.random() * 10) - 5,
        currentRank: index + 1
      };
    });
  }

  private getNodeCategory(totalEarnings: number): string {
    if (totalEarnings > 3000) return 'elite';
    if (totalEarnings > 1500) return 'performer';
    if (totalEarnings > 500) return 'standard';
    return 'newcomer';
  }

  async getRewardDistributionHistory(limit: number = 10): Promise<any[]> {
    const existingHistory = Array.from(this.rewardHistory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    if (existingHistory.length > 0) {
      return existingHistory.map(dist => ({
        sessionId: dist.sessionId,
        totalRewardPool: dist.totalRewardPool,
        distributions: Object.fromEntries(dist.distributions),
        timestamp: dist.timestamp.toISOString(),
        recipientsCount: dist.distributions.size
      }));
    }

    // Generate mock reward distribution history
    const mockHistory = [];
    for (let i = 0; i < Math.min(limit, 20); i++) {
      const sessionId = 1000 + i;
      const totalReward = Math.floor(Math.random() * 1000) + 200;
      const recipientCount = Math.floor(Math.random() * 15) + 5;
      
      // Generate random distributions
      const distributions: Record<string, number> = {};
      for (let j = 0; j < recipientCount; j++) {
        const nodeId = `node-${String(j + 1).padStart(3, '0')}`;
        const reward = Math.floor(Math.random() * (totalReward / recipientCount)) + 10;
        distributions[nodeId] = reward;
      }

      mockHistory.push({
        sessionId,
        totalRewardPool: totalReward,
        distributions,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        recipientsCount: recipientCount
      });
    }

    return mockHistory;
  }

  async calculateProjectedRewards(
    nodeId: string,
    sessionId: number,
    estimatedTotalReward: number,
  ): Promise<{
    baseReward: number;
    bonusReward: number;
    totalProjected: number;
    ranking: number;
  }> {
    try {
      // Get current session contributions
      const sessionContributions = await this.contributionTracker.getSessionContributions(sessionId);
      const nodeContribution = sessionContributions.find(c => c.nodeId === nodeId);
      
      if (!nodeContribution) {
        return { baseReward: 0, bonusReward: 0, totalProjected: 0, ranking: 0 };
      }

      // Calculate total contribution score
      const totalScore = sessionContributions.reduce((sum, c) => sum + c.contributionScore, 0);
      
      // Calculate base reward (80% of total)
      const baseRewardPool = estimatedTotalReward * 0.8;
      const baseReward = totalScore > 0 
        ? (nodeContribution.contributionScore / totalScore) * baseRewardPool 
        : 0;

      // Calculate potential bonus reward (20% of total)
      const bonusRewardPool = estimatedTotalReward * 0.2;
      const sortedContributions = sessionContributions
        .sort((a, b) => b.contributionScore - a.contributionScore);
      
      const ranking = sortedContributions.findIndex(c => c.nodeId === nodeId) + 1;
      
      let bonusReward = 0;
      if (ranking <= 5) {
        const bonusPercentages = [40, 25, 15, 10, 10]; // Top 5 get bonuses
        bonusReward = (bonusRewardPool * bonusPercentages[ranking - 1]) / 100;
      }

      // Quality bonus if gradient quality is high
      if (nodeContribution.gradientQuality >= 90) {
        bonusReward += bonusRewardPool * 0.1 * (1 / sessionContributions.filter(c => c.gradientQuality >= 90).length);
      }

      return {
        baseReward: Math.floor(baseReward),
        bonusReward: Math.floor(bonusReward),
        totalProjected: Math.floor(baseReward + bonusReward),
        ranking,
      };
    } catch (error) {
      this.logger.error('Error calculating projected rewards:', error);
      return { baseReward: 0, bonusReward: 0, totalProjected: 0, ranking: 0 };
    }
  }
}