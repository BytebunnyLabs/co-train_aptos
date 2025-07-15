import { Injectable, Logger } from '@nestjs/common';
import { P2PNetworkService } from './services/p2p-network.service';
import { ContributionTrackerService } from './services/contribution-tracker.service';
import { DHTManagerService } from './services/dht-manager.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CotrainCoreService } from '../cotrain-core/services/cotrain-core.service';
import { TrainingExecutorService } from '../cotrain-core/services/training-executor.service';

export interface P2PNode {
  nodeId: string;
  address: string;
  publicKey: string;
  computeCapacity: number;
  bandwidth: number;
  reputationScore: number;
  isActive: boolean;
  lastSeen: Date;
}

export interface TrainingContribution {
  sessionId: number;
  participant: string;
  computeTime: number;
  gradientQuality: number;
  dataTransmitted: number;
  uptimeRatio: number;
  timestamp: Date;
}

@Injectable()
export class HivemindService {
  private readonly logger = new Logger(HivemindService.name);

  constructor(
    private readonly p2pNetworkService: P2PNetworkService,
    private readonly contributionTracker: ContributionTrackerService,
    private readonly dhtManager: DHTManagerService,
    private readonly blockchainService: BlockchainService,
    private readonly cotrainCoreService: CotrainCoreService,
    private readonly trainingExecutorService: TrainingExecutorService,
  ) {}

  async initializeP2PNetwork(port: number = 8080): Promise<void> {
    try {
      await this.p2pNetworkService.initialize(port);
      await this.dhtManager.initialize();
      this.logger.log('Hivemind P2P network initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize P2P network:', error);
      throw error;
    }
  }

  /**
   * 启动分布式训练会话
   */
  async startDistributedTraining(sessionConfig: {
    sessionId: string;
    modelConfig: any;
    trainingConfig: any;
    participants: string[];
  }): Promise<void> {
    try {
      // 通过CotrainCore启动训练进程
      await this.trainingExecutorService.startTraining({
        sessionId: sessionConfig.sessionId,
        modelConfig: sessionConfig.modelConfig,
        trainingConfig: {
          ...sessionConfig.trainingConfig,
          distributed: true,
          participants: sessionConfig.participants,
        },
      });

      this.logger.log(`Started distributed training session ${sessionConfig.sessionId}`);
    } catch (error) {
      this.logger.error('Failed to start distributed training:', error);
      throw error;
    }
  }

  /**
   * 停止分布式训练会话
   */
  async stopDistributedTraining(sessionId: string): Promise<void> {
    try {
      await this.trainingExecutorService.stopTraining(sessionId);
      this.logger.log(`Stopped distributed training session ${sessionId}`);
    } catch (error) {
      this.logger.error('Failed to stop distributed training:', error);
      throw error;
    }
  }

  /**
   * 获取训练会话状态
   */
  async getTrainingSessionStatus(sessionId: string): Promise<any> {
    try {
      return await this.trainingExecutorService.getTrainingStatus(sessionId);
    } catch (error) {
      this.logger.error('Failed to get training session status:', error);
      throw error;
    }
  }


  async submitContribution(contribution: TrainingContribution): Promise<void> {
    try {
      // Track contribution locally
      await this.contributionTracker.recordContribution(contribution);
      
      // Submit to blockchain using the available submitContribution method
      await this.blockchainService.submitContribution({
        sessionId: contribution.sessionId.toString(),
        participantAddress: contribution.participant,
        score: contribution.gradientQuality,
        contributionHash: '',
        metadata: JSON.stringify({
          computeTime: contribution.computeTime,
          dataTransmitted: contribution.dataTransmitted,
          uptimeRatio: contribution.uptimeRatio,
        }),
      });
      
      this.logger.log(`Contribution submitted for session ${contribution.sessionId}`);
    } catch (error) {
      this.logger.error('Failed to submit contribution:', error);
      throw error;
    }
  }

  async getActiveNodes(): Promise<P2PNode[]> {
    return this.p2pNetworkService.getActiveNodes();
  }

  async getNetworkStats(): Promise<{
    totalNodes: number;
    activeNodes: number;
    totalComputePower: number;
    networkHealth: number;
    connectedPeers: number;
    averageResponseTime: number;
    averageLatency: number;
    throughput: number;
  }> {
    const nodes = await this.getActiveNodes();
    const activeNodeCount = nodes.filter(node => node.isActive).length;
    const totalComputePower = nodes.reduce((sum, node) => sum + node.computeCapacity, 0);
    
    return {
      totalNodes: nodes.length,
      activeNodes: activeNodeCount,
      totalComputePower,
      networkHealth: activeNodeCount > 0 ? (activeNodeCount / nodes.length) * 100 : 0,
      connectedPeers: activeNodeCount,
      averageResponseTime: 150, // Placeholder - implement real metrics
      averageLatency: 45,
      throughput: totalComputePower * 0.8, // Estimated throughput
    };
  }

  // Add new methods for API controllers
  async getNetworkStatistics(): Promise<any> {
    return this.getNetworkStats();
  }

  async getContributors(limit: number, sortBy: string): Promise<any[]> {
    try {
      const contributions = await this.contributionTracker.getAllContributions();
      
      // Group by participant and calculate stats
      const contributorMap = new Map();
      
      contributions.forEach(contrib => {
        if (!contributorMap.has(contrib.participant)) {
          contributorMap.set(contrib.participant, {
            participant: contrib.participant,
            totalScore: 0,
            contributionCount: 0,
            totalComputeTime: 0,
            averageQuality: 0,
          });
        }
        
        const contributor = contributorMap.get(contrib.participant);
        contributor.totalScore += contrib.gradientQuality;
        contributor.contributionCount += 1;
        contributor.totalComputeTime += contrib.computeTime;
      });

      // Convert to array and calculate averages
      const contributors = Array.from(contributorMap.values()).map(contrib => ({
        ...contrib,
        averageQuality: contrib.totalScore / contrib.contributionCount,
      }));

      // Sort based on sortBy parameter
      contributors.sort((a, b) => {
        switch (sortBy) {
          case 'score':
            return b.totalScore - a.totalScore;
          case 'contributions':
            return b.contributionCount - a.contributionCount;
          case 'compute':
            return b.totalComputeTime - a.totalComputeTime;
          default:
            return b.totalScore - a.totalScore;
        }
      });

      return contributors.slice(0, limit);
    } catch (error) {
      this.logger.error('Error getting contributors:', error);
      return [];
    }
  }

  async getChartData(metric: string, timeRange: string): Promise<any[]> {
    // Generate sample chart data based on metric and time range
    const dataPoints = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 7;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      let value;
      switch (metric) {
        case 'nodes':
          value = Math.floor(Math.random() * 20) + 10; // 10-30 nodes
          break;
        case 'compute':
          value = Math.floor(Math.random() * 1000) + 500; // 500-1500 compute units
          break;
        case 'health':
          value = Math.floor(Math.random() * 20) + 80; // 80-100% health
          break;
        default:
          value = Math.floor(Math.random() * 100);
      }
      
      dataPoints.push({
        timestamp: date.toISOString(),
        value,
        metric
      });
    }
    
    return dataPoints;
  }

  async getNodes(status?: string, limit?: number): Promise<any[]> {
    try {
      let nodes = await this.getActiveNodes();
      
      if (status) {
        nodes = nodes.filter(node => {
          return status === 'active' ? node.isActive : !node.isActive;
        });
      }
      
      if (limit) {
        nodes = nodes.slice(0, limit);
      }
      
      return nodes;
    } catch (error) {
      this.logger.error('Error getting nodes:', error);
      return [];
    }
  }

  async registerNode(nodeData: P2PNode): Promise<P2PNode> {
    try {
      await this.p2pNetworkService.registerNode(nodeData);
      
      // Register on blockchain
      await this.blockchainService.registerP2PNode(
        nodeData.nodeId,
        nodeData.publicKey,
        nodeData.computeCapacity,
        nodeData.bandwidth,
      );
      
      this.logger.log(`Node ${nodeData.nodeId} registered successfully`);
      return nodeData;
    } catch (error) {
      this.logger.error(`Failed to register node ${nodeData.nodeId}:`, error);
      throw error;
    }
  }

  async getTopContributors(limit: number): Promise<any[]> {
    try {
      const contributors = await this.getContributors(limit, 'score');
      
      return contributors.map((contributor, index) => ({
        nodeId: contributor.participant,
        totalScore: contributor.totalScore,
        contributionCount: contributor.contributionCount,
        rank: index + 1,
        averageScore: contributor.averageQuality,
      }));
    } catch (error) {
      this.logger.error('Error getting top contributors:', error);
      return [];
    }
  }

  async startTrainingSession(sessionId: number, modelConfig: any): Promise<void> {
    try {
      // Notify all active nodes about new training session
      const activeNodes = await this.getActiveNodes();
      
      for (const node of activeNodes) {
        await this.p2pNetworkService.notifyNode(node.nodeId, {
          type: 'TRAINING_SESSION_START',
          sessionId,
          modelConfig,
        });
      }
      
      this.logger.log(`Training session ${sessionId} started with ${activeNodes.length} nodes`);
    } catch (error) {
      this.logger.error(`Failed to start training session ${sessionId}:`, error);
      throw error;
    }
  }

  async stopTrainingSession(sessionId: number): Promise<void> {
    try {
      const activeNodes = await this.getActiveNodes();
      
      for (const node of activeNodes) {
        await this.p2pNetworkService.notifyNode(node.nodeId, {
          type: 'TRAINING_SESSION_STOP',
          sessionId,
        });
      }
      
      this.logger.log(`Training session ${sessionId} stopped`);
    } catch (error) {
      this.logger.error(`Failed to stop training session ${sessionId}:`, error);
      throw error;
    }
  }
}