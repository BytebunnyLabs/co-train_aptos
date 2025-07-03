import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { P2PNetworkService } from './p2p-network.service';
import { LibP2PNetworkService } from './libp2p-network.service';
import type { P2PMessage } from './libp2p-network.service';
import { ContributionTrackerService } from './contribution-tracker.service';
import { DHTManagerService } from './dht-manager.service';

interface NodeFailure {
  nodeId: string;
  failureType: 'TIMEOUT' | 'DISCONNECT' | 'INVALID_GRADIENT' | 'LOW_QUALITY';
  timestamp: Date;
  details: any;
}

interface TrainingCheckpoint {
  sessionId: string;
  checkpointId: string;
  modelState: Buffer;
  gradientAggregation: any;
  participantStates: Map<string, any>;
  timestamp: Date;
  blockHeight?: number;
}

interface FailoverNode {
  nodeId: string;
  capacity: number;
  lastSeen: Date;
  isStandby: boolean;
}

@Injectable()
export class FaultToleranceService {
  private readonly logger = new Logger(FaultToleranceService.name);
  private nodeFailures = new Map<string, NodeFailure[]>();
  private trainingCheckpoints = new Map<string, TrainingCheckpoint[]>();
  private failoverNodes = new Map<string, FailoverNode>();
  private ongoingSessions = new Set<string>();
  private readonly MAX_FAILURES_PER_NODE = 3;
  private readonly CHECKPOINT_INTERVAL = 30000; // 30 seconds
  private readonly NODE_TIMEOUT = 60000; // 60 seconds

  constructor(
    private eventEmitter: EventEmitter2,
    private p2pNetwork: P2PNetworkService,
    private contributionTracker: ContributionTrackerService,
    private dhtManager: DHTManagerService,
  ) {}

  // Handle node failures
  async handleNodeFailure(
    nodeId: string, 
    failureType: NodeFailure['failureType'], 
    details: any
  ): Promise<void> {
    const failure: NodeFailure = {
      nodeId,
      failureType,
      timestamp: new Date(),
      details,
    };

    // Record failure
    if (!this.nodeFailures.has(nodeId)) {
      this.nodeFailures.set(nodeId, []);
    }
    this.nodeFailures.get(nodeId)!.push(failure);

    this.logger.warn(`Node failure recorded: ${nodeId} - ${failureType}`, details);

    // Check if node should be temporarily banned
    const failures = this.nodeFailures.get(nodeId)!;
    const recentFailures = failures.filter(
      f => Date.now() - f.timestamp.getTime() < 300000 // 5 minutes
    );

    if (recentFailures.length >= this.MAX_FAILURES_PER_NODE) {
      await this.quarantineNode(nodeId, 'TOO_MANY_FAILURES');
    }

    // Try to recover from failure
    await this.attemptRecovery(nodeId, failureType, details);

    this.eventEmitter.emit('node.failure.handled', { nodeId, failureType, details });
  }

  private async quarantineNode(nodeId: string, reason: string): Promise<void> {
    try {
      // Remove from active participants in ongoing sessions
      for (const sessionId of this.ongoingSessions) {
        await this.removeNodeFromSession(nodeId, sessionId);
      }

      // Mark node as quarantined in DHT
      await this.dhtManager.store(`quarantine:${nodeId}`, {
        reason,
        timestamp: new Date(),
        releaseTime: new Date(Date.now() + 3600000), // 1 hour quarantine
      });

      this.logger.warn(`Node quarantined: ${nodeId} - ${reason}`);
      this.eventEmitter.emit('node.quarantined', { nodeId, reason });

    } catch (error) {
      this.logger.error(`Failed to quarantine node ${nodeId}:`, error);
    }
  }

  private async attemptRecovery(
    nodeId: string, 
    failureType: NodeFailure['failureType'], 
    details: any
  ): Promise<void> {
    switch (failureType) {
      case 'TIMEOUT':
        await this.handleTimeoutRecovery(nodeId, details);
        break;
      case 'DISCONNECT':
        await this.handleDisconnectRecovery(nodeId, details);
        break;
      case 'INVALID_GRADIENT':
        await this.handleInvalidGradientRecovery(nodeId, details);
        break;
      case 'LOW_QUALITY':
        await this.handleLowQualityRecovery(nodeId, details);
        break;
    }
  }

  private async handleTimeoutRecovery(nodeId: string, details: any): Promise<void> {
    try {
      // Send ping to check if node is still alive
      await this.p2pNetwork.notifyNode(nodeId, {
        type: 'HEALTH_CHECK',
        timestamp: new Date(),
      });

      // Set a timeout for response
      setTimeout(async () => {
        if (!await this.isNodeResponsive(nodeId)) {
          await this.replaceNodeInActiveSessions(nodeId);
        }
      }, 10000); // 10 seconds

    } catch (error) {
      this.logger.error(`Timeout recovery failed for ${nodeId}:`, error);
      await this.replaceNodeInActiveSessions(nodeId);
    }
  }

  private async handleDisconnectRecovery(nodeId: string, details: any): Promise<void> {
    try {
      // Try to reconnect using stored peer information
      const peerInfo = await this.dhtManager.retrieve(`peer:${nodeId}`);
      if (peerInfo && peerInfo.multiaddrs) {
        // Attempt reconnection with exponential backoff
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          try {
            await this.p2pNetwork.connectToPeer(peerInfo.multiaddrs[0]);
            this.logger.log(`Successfully reconnected to ${nodeId}`);
            return;
          } catch (error) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          }
        }
      }

      // If reconnection fails, replace node
      await this.replaceNodeInActiveSessions(nodeId);

    } catch (error) {
      this.logger.error(`Disconnect recovery failed for ${nodeId}:`, error);
    }
  }

  private async handleInvalidGradientRecovery(nodeId: string, details: any): Promise<void> {
    try {
      // Send the correct model state to the node
      const sessionId = details.sessionId;
      const checkpoint = await this.getLatestCheckpoint(sessionId);
      
      if (checkpoint) {
        await this.p2pNetwork.notifyNode(nodeId, {
          type: 'MODEL_STATE_SYNC',
          sessionId,
          modelState: checkpoint.modelState,
          timestamp: new Date(),
        });
      }

    } catch (error) {
      this.logger.error(`Invalid gradient recovery failed for ${nodeId}:`, error);
    }
  }

  private async handleLowQualityRecovery(nodeId: string, details: any): Promise<void> {
    try {
      // Send training tips and configuration adjustments
      await this.p2pNetwork.notifyNode(nodeId, {
        type: 'TRAINING_OPTIMIZATION',
        suggestions: {
          learningRate: details.suggestedLearningRate || 0.001,
          batchSize: details.suggestedBatchSize || 32,
          optimizationTips: [
            'Ensure stable internet connection',
            'Check computational resources',
            'Verify data preprocessing',
          ],
        },
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`Low quality recovery failed for ${nodeId}:`, error);
    }
  }

  private async replaceNodeInActiveSessions(nodeId: string): Promise<void> {
    try {
      for (const sessionId of this.ongoingSessions) {
        // Find standby nodes that can replace the failed node
        const replacementNode = await this.findReplacementNode(nodeId);
        
        if (replacementNode) {
          await this.activateReplacementNode(sessionId, nodeId, replacementNode);
        } else {
          // If no replacement available, redistribute workload
          await this.redistributeWorkload(sessionId, nodeId);
        }
      }

    } catch (error) {
      this.logger.error(`Failed to replace node ${nodeId}:`, error);
    }
  }

  private async findReplacementNode(failedNodeId: string): Promise<FailoverNode | null> {
    try {
      // Get all standby nodes sorted by capacity
      const standbyNodes = Array.from(this.failoverNodes.values())
        .filter(node => node.isStandby && node.nodeId !== failedNodeId)
        .sort((a, b) => b.capacity - a.capacity);

      return standbyNodes.length > 0 ? standbyNodes[0] : null;

    } catch (error) {
      this.logger.error('Error finding replacement node:', error);
      return null;
    }
  }

  private async activateReplacementNode(
    sessionId: string, 
    failedNodeId: string, 
    replacementNode: FailoverNode
  ): Promise<void> {
    try {
      // Get the latest checkpoint for the session
      const checkpoint = await this.getLatestCheckpoint(sessionId);
      
      if (checkpoint) {
        // Send session state to replacement node
        await this.p2pNetwork.notifyNode(replacementNode.nodeId, {
          type: 'SESSION_TAKEOVER',
          sessionId,
          modelState: checkpoint.modelState,
          replacedNodeId: failedNodeId,
          timestamp: new Date(),
        });

        // Update node status
        replacementNode.isStandby = false;
        this.failoverNodes.set(replacementNode.nodeId, replacementNode);

        this.logger.log(`Activated replacement node ${replacementNode.nodeId} for session ${sessionId}`);
        this.eventEmitter.emit('node.replacement.activated', {
          sessionId,
          failedNodeId,
          replacementNodeId: replacementNode.nodeId,
        });
      }

    } catch (error) {
      this.logger.error('Failed to activate replacement node:', error);
    }
  }

  private async redistributeWorkload(sessionId: string, failedNodeId: string): Promise<void> {
    try {
      // Get active nodes in the session
      const activeNodes = await this.p2pNetwork.getActiveNodes();
      
      if (activeNodes.length > 0) {
        // Notify remaining nodes about workload redistribution
        await this.p2pNetwork.broadcastMessage({
          type: 'WORKLOAD_REDISTRIBUTION',
          data: {
            sessionId,
            failedNodeId,
            remainingNodes: activeNodes.length,
          },
          timestamp: new Date(),
        });

        this.logger.log(`Redistributed workload for session ${sessionId} among ${activeNodes.length} nodes`);
      }

    } catch (error) {
      this.logger.error('Failed to redistribute workload:', error);
    }
  }

  // Checkpoint management
  async createCheckpoint(sessionId: string, modelState: Buffer, gradientAgg: any): Promise<void> {
    try {
      const checkpointId = `${sessionId}-${Date.now()}`;
      const checkpoint: TrainingCheckpoint = {
        sessionId,
        checkpointId,
        modelState,
        gradientAggregation: gradientAgg,
        participantStates: new Map(),
        timestamp: new Date(),
      };

      // Store locally
      if (!this.trainingCheckpoints.has(sessionId)) {
        this.trainingCheckpoints.set(sessionId, []);
      }
      this.trainingCheckpoints.get(sessionId)!.push(checkpoint);

      // Store in DHT for distributed access
      await this.dhtManager.store(`checkpoint:${checkpointId}`, {
        sessionId,
        modelStateHash: this.hashBuffer(modelState),
        timestamp: checkpoint.timestamp,
      });

      // Keep only last 5 checkpoints per session
      const checkpoints = this.trainingCheckpoints.get(sessionId)!;
      if (checkpoints.length > 5) {
        checkpoints.splice(0, checkpoints.length - 5);
      }

      this.logger.debug(`Created checkpoint ${checkpointId} for session ${sessionId}`);
      this.eventEmitter.emit('checkpoint.created', { sessionId, checkpointId });

    } catch (error) {
      this.logger.error('Failed to create checkpoint:', error);
    }
  }

  private async getLatestCheckpoint(sessionId: string): Promise<TrainingCheckpoint | null> {
    const checkpoints = this.trainingCheckpoints.get(sessionId);
    return checkpoints && checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : null;
  }

  private hashBuffer(buffer: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // Event handlers
  @OnEvent('node.heartbeat.received')
  async handleNodeHeartbeat(data: { nodeId: string; timestamp: Date }): Promise<void> {
    // Update node as active
    if (this.failoverNodes.has(data.nodeId)) {
      const node = this.failoverNodes.get(data.nodeId)!;
      node.lastSeen = data.timestamp;
      this.failoverNodes.set(data.nodeId, node);
    }
  }

  @OnEvent('training.gradient.received')
  async handleGradientReceived(data: any): Promise<void> {
    try {
      // Validate gradient quality
      if (data.quality < 50) {
        await this.handleNodeFailure(data.nodeId, 'LOW_QUALITY', {
          quality: data.quality,
          sessionId: data.sessionId,
        });
      }
    } catch (error) {
      this.logger.error('Error handling gradient reception:', error);
    }
  }

  // Periodic tasks
  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkNodeHealth(): Promise<void> {
    const now = Date.now();
    
    for (const [nodeId, node] of this.failoverNodes) {
      if (now - node.lastSeen.getTime() > this.NODE_TIMEOUT) {
        await this.handleNodeFailure(nodeId, 'TIMEOUT', {
          lastSeen: node.lastSeen,
          timeoutDuration: now - node.lastSeen.getTime(),
        });
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async createPeriodicCheckpoints(): Promise<void> {
    for (const sessionId of this.ongoingSessions) {
      try {
        // This would integrate with actual training state
        const mockModelState = Buffer.from('model_state_placeholder');
        const mockGradientAgg = { aggregated: true };
        
        await this.createCheckpoint(sessionId, mockModelState, mockGradientAgg);
      } catch (error) {
        this.logger.error(`Failed to create periodic checkpoint for session ${sessionId}:`, error);
      }
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupOldFailures(): Promise<void> {
    const cutoffTime = Date.now() - 3600000; // 1 hour ago
    
    for (const [nodeId, failures] of this.nodeFailures) {
      const recentFailures = failures.filter(f => f.timestamp.getTime() > cutoffTime);
      if (recentFailures.length === 0) {
        this.nodeFailures.delete(nodeId);
      } else {
        this.nodeFailures.set(nodeId, recentFailures);
      }
    }
  }

  // Public methods
  async registerFailoverNode(nodeId: string, capacity: number): Promise<void> {
    const failoverNode: FailoverNode = {
      nodeId,
      capacity,
      lastSeen: new Date(),
      isStandby: true,
    };

    this.failoverNodes.set(nodeId, failoverNode);
    this.logger.log(`Registered failover node: ${nodeId} with capacity ${capacity}`);
  }

  async startTrainingSession(sessionId: string): Promise<void> {
    this.ongoingSessions.add(sessionId);
    this.trainingCheckpoints.set(sessionId, []);
    this.logger.log(`Started fault tolerance monitoring for session: ${sessionId}`);
  }

  async endTrainingSession(sessionId: string): Promise<void> {
    this.ongoingSessions.delete(sessionId);
    // Keep checkpoints for a while for analysis
    setTimeout(() => {
      this.trainingCheckpoints.delete(sessionId);
    }, 3600000); // 1 hour
    
    this.logger.log(`Ended fault tolerance monitoring for session: ${sessionId}`);
  }

  private async isNodeResponsive(nodeId: string): Promise<boolean> {
    try {
      // This would implement actual responsiveness check
      return this.failoverNodes.has(nodeId);
    } catch (error) {
      return false;
    }
  }

  private async removeNodeFromSession(nodeId: string, sessionId: string): Promise<void> {
    try {
      // Implement session-specific node removal logic
      this.logger.debug(`Removing node ${nodeId} from session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to remove node ${nodeId} from session ${sessionId}:`, error);
    }
  }

  // Statistics
  getFailureStats(): any {
    const stats = {
      totalFailures: 0,
      failuresByType: {} as any,
      failuresByNode: {} as any,
      activeFailoverNodes: 0,
    };

    for (const failures of this.nodeFailures.values()) {
      stats.totalFailures += failures.length;
      
      for (const failure of failures) {
        stats.failuresByType[failure.failureType] = 
          (stats.failuresByType[failure.failureType] || 0) + 1;
      }
    }

    for (const [nodeId, failures] of this.nodeFailures) {
      stats.failuresByNode[nodeId] = failures.length;
    }

    stats.activeFailoverNodes = Array.from(this.failoverNodes.values())
      .filter(node => node.isStandby).length;

    return stats;
  }
}