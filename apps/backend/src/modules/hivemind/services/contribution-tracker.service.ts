import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TrainingContribution } from '../hivemind.service';

export interface ContributionMetrics {
  nodeId: string;
  sessionId: number;
  computeTime: number;
  gradientQuality: number;
  dataTransmitted: number;
  uptimeRatio: number;
  contributionScore: number;
  timestamp: Date;
}

@Injectable()
export class ContributionTrackerService {
  private readonly logger = new Logger(ContributionTrackerService.name);
  private contributions: Map<string, ContributionMetrics[]> = new Map();
  private sessionMetrics: Map<number, Map<string, ContributionMetrics>> = new Map();

  constructor(private eventEmitter: EventEmitter2) {
    this.initializeMockContributions();
  }

  private initializeMockContributions(): void {
    // Add some mock contributions for development
    const mockContributions: TrainingContribution[] = [
      {
        sessionId: 1001,
        participant: 'node-central-hub-001',
        computeTime: 2.5,
        gradientQuality: 95.2,
        dataTransmitted: 1024,
        uptimeRatio: 0.98,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        sessionId: 1001,
        participant: 'node-worker-002',
        computeTime: 1.8,
        gradientQuality: 87.5,
        dataTransmitted: 768,
        uptimeRatio: 0.95,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        sessionId: 1002,
        participant: 'node-validator-003',
        computeTime: 3.2,
        gradientQuality: 92.1,
        dataTransmitted: 1536,
        uptimeRatio: 0.97,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    ];

    mockContributions.forEach(contribution => {
      this.recordContribution(contribution).catch(error => {
        this.logger.error('Error recording mock contribution:', error);
      });
    });

    this.logger.log(`Initialized ${mockContributions.length} mock contributions for development`);
  }

  async recordContribution(contribution: TrainingContribution): Promise<void> {
    const contributionScore = this.calculateContributionScore(
      contribution.computeTime,
      contribution.gradientQuality,
      contribution.dataTransmitted,
      contribution.uptimeRatio,
    );

    const metrics: ContributionMetrics = {
      nodeId: contribution.participant,
      sessionId: contribution.sessionId,
      computeTime: contribution.computeTime,
      gradientQuality: contribution.gradientQuality,
      dataTransmitted: contribution.dataTransmitted,
      uptimeRatio: contribution.uptimeRatio,
      contributionScore,
      timestamp: contribution.timestamp,
    };

    // Store by node
    if (!this.contributions.has(contribution.participant)) {
      this.contributions.set(contribution.participant, []);
    }
    this.contributions.get(contribution.participant)!.push(metrics);

    // Store by session
    if (!this.sessionMetrics.has(contribution.sessionId)) {
      this.sessionMetrics.set(contribution.sessionId, new Map());
    }
    this.sessionMetrics.get(contribution.sessionId)!.set(contribution.participant, metrics);

    this.eventEmitter.emit('contribution.recorded', metrics);
    this.logger.debug(`Contribution recorded for node ${contribution.participant} in session ${contribution.sessionId}`);
  }

  private calculateContributionScore(
    computeTime: number,
    gradientQuality: number,
    dataTransmitted: number,
    uptimeRatio: number,
  ): number {
    // Weight factors for different metrics
    const computeWeight = 0.4;  // 40%
    const qualityWeight = 0.35; // 35%
    const dataWeight = 0.15;    // 15%
    const uptimeWeight = 0.1;   // 10%

    const score = Math.round(
      computeTime * computeWeight +
      gradientQuality * qualityWeight +
      dataTransmitted * dataWeight +
      uptimeRatio * uptimeWeight
    );

    return Math.max(0, score);
  }

  async getNodeContributions(nodeId: string): Promise<ContributionMetrics[]> {
    return this.contributions.get(nodeId) || [];
  }

  async getSessionContributions(sessionId: number): Promise<ContributionMetrics[]> {
    const sessionData = this.sessionMetrics.get(sessionId);
    return sessionData ? Array.from(sessionData.values()) : [];
  }

  async getNodeSessionContribution(nodeId: string, sessionId: number): Promise<ContributionMetrics | null> {
    const sessionData = this.sessionMetrics.get(sessionId);
    return sessionData?.get(nodeId) || null;
  }

  async calculateSessionRewards(sessionId: number, totalRewardPool: number): Promise<Map<string, number>> {
    const contributions = await this.getSessionContributions(sessionId);
    const totalScore = contributions.reduce((sum, contrib) => sum + contrib.contributionScore, 0);
    
    const rewards = new Map<string, number>();
    
    if (totalScore > 0) {
      for (const contribution of contributions) {
        const rewardAmount = Math.floor((contribution.contributionScore / totalScore) * totalRewardPool);
        rewards.set(contribution.nodeId, rewardAmount);
      }
    }

    return rewards;
  }

  async getTopContributors(sessionId?: number, limit: number = 10): Promise<{
    nodeId: string;
    totalScore: number;
    contributionCount: number;
  }[]> {
    let contributions: ContributionMetrics[];
    
    if (sessionId) {
      contributions = await this.getSessionContributions(sessionId);
    } else {
      contributions = Array.from(this.contributions.values()).flat();
    }

    const nodeStats = new Map<string, { totalScore: number; count: number }>();
    
    for (const contrib of contributions) {
      if (!nodeStats.has(contrib.nodeId)) {
        nodeStats.set(contrib.nodeId, { totalScore: 0, count: 0 });
      }
      const stats = nodeStats.get(contrib.nodeId)!;
      stats.totalScore += contrib.contributionScore;
      stats.count += 1;
    }

    return Array.from(nodeStats.entries())
      .map(([nodeId, stats]) => ({
        nodeId,
        totalScore: stats.totalScore,
        contributionCount: stats.count,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
  }

  async getContributionHistory(
    nodeId?: string,
    sessionId?: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ContributionMetrics[]> {
    let contributions: ContributionMetrics[];

    if (nodeId) {
      contributions = await this.getNodeContributions(nodeId);
    } else if (sessionId) {
      contributions = await this.getSessionContributions(sessionId);
    } else {
      contributions = Array.from(this.contributions.values()).flat();
    }

    return contributions.filter(contrib => {
      if (startDate && contrib.timestamp < startDate) return false;
      if (endDate && contrib.timestamp > endDate) return false;
      return true;
    });
  }

  async getAverageGradientQuality(nodeId?: string, sessionId?: number): Promise<number> {
    const contributions = await this.getContributionHistory(nodeId, sessionId);
    
    if (contributions.length === 0) return 0;
    
    const totalQuality = contributions.reduce((sum, contrib) => sum + contrib.gradientQuality, 0);
    return totalQuality / contributions.length;
  }

  async getNodeReliabilityScore(nodeId: string, sessionId?: number): Promise<number> {
    const contributions = await this.getContributionHistory(nodeId, sessionId);
    
    if (contributions.length === 0) return 0;
    
    const avgUptime = contributions.reduce((sum, contrib) => sum + contrib.uptimeRatio, 0) / contributions.length;
    const avgQuality = contributions.reduce((sum, contrib) => sum + contrib.gradientQuality, 0) / contributions.length;
    
    // Combine uptime and quality for reliability score
    return Math.round((avgUptime * 0.6 + avgQuality * 0.4));
  }

  /**
   * Get all contributions for HivemindService
   */
  async getAllContributions(): Promise<TrainingContribution[]> {
    const allContributions: TrainingContribution[] = [];
    
    this.contributions.forEach((nodeContributions) => {
      nodeContributions.forEach((metric) => {
        allContributions.push({
          sessionId: metric.sessionId,
          participant: metric.nodeId,
          computeTime: metric.computeTime,
          gradientQuality: metric.gradientQuality,
          dataTransmitted: metric.dataTransmitted,
          uptimeRatio: metric.uptimeRatio,
          timestamp: metric.timestamp,
        });
      });
    });
    
    return allContributions;
  }
}