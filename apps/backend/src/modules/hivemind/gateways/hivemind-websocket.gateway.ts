import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { HivemindService } from '../hivemind.service';

interface HivemindSocket extends Socket {
  nodeId?: string;
  userId?: string;
}

interface NetworkUpdate {
  type: 'node_joined' | 'node_left' | 'node_updated' | 'network_stats' | 'contribution_submitted' | 'reward_distributed';
  data: any;
  timestamp: Date;
}

interface P2PNodeUpdate {
  nodeId: string;
  status: 'online' | 'offline' | 'busy';
  computeCapacity?: number;
  reputationScore?: number;
  lastSeen: Date;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/hivemind',
})
export class HivemindWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(HivemindWebSocketGateway.name);
  private readonly connectedNodes = new Map<string, string>(); // nodeId -> socketId
  private readonly connectedClients = new Set<string>(); // socketIds for monitoring clients
  private readonly nodeMetrics = new Map<string, any>();

  constructor(private readonly hivemindService: HivemindService) {}

  afterInit(server: Server) {
    this.logger.log('Hivemind WebSocket Gateway initialized');
    
    // Start periodic network stats broadcast
    setInterval(() => {
      this.broadcastNetworkStats();
    }, 10000); // Every 10 seconds

    // Start periodic node status updates
    setInterval(() => {
      this.broadcastNodeUpdates();
    }, 5000); // Every 5 seconds
  }

  async handleConnection(client: HivemindSocket) {
    this.logger.log(`Hivemind client connected: ${client.id}`);
    
    // Add to monitoring clients
    this.connectedClients.add(client.id);
    
    // Send initial network state
    try {
      const networkStats = await this.hivemindService.getNetworkStatistics();
      client.emit('network_stats', {
        type: 'initial_state',
        data: networkStats,
        timestamp: new Date(),
      });

      const nodes = await this.hivemindService.getNodes();
      client.emit('nodes_update', {
        type: 'initial_nodes',
        data: nodes,
        timestamp: new Date(),
      });

      const topContributors = await this.hivemindService.getTopContributors(10);
      client.emit('contributors_update', {
        type: 'initial_contributors',
        data: topContributors,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error sending initial data to client:', error);
    }
  }

  handleDisconnect(client: HivemindSocket) {
    this.logger.log(`Hivemind client disconnected: ${client.id}`);
    
    // Remove from monitoring clients
    this.connectedClients.delete(client.id);
    
    // Remove from connected nodes if it was a node
    if (client.nodeId) {
      this.connectedNodes.delete(client.nodeId);
      this.broadcastNodeUpdate({
        nodeId: client.nodeId,
        status: 'offline',
        lastSeen: new Date(),
      });
    }
  }

  @SubscribeMessage('register_node')
  async handleNodeRegistration(
    @ConnectedSocket() client: HivemindSocket,
    @MessageBody() data: { nodeId: string; nodeData: any }
  ) {
    try {
      this.logger.log(`Node registering: ${data.nodeId}`);
      
      client.nodeId = data.nodeId;
      this.connectedNodes.set(data.nodeId, client.id);
      
      // Register node in Hivemind service
      await this.hivemindService.registerNode({
        nodeId: data.nodeId,
        address: data.nodeData.address,
        publicKey: data.nodeData.publicKey,
        computeCapacity: data.nodeData.computeCapacity,
        bandwidth: data.nodeData.bandwidth,
        reputationScore: 0,
        isActive: true,
        lastSeen: new Date(),
      });

      // Broadcast node joining
      this.broadcastNodeUpdate({
        nodeId: data.nodeId,
        status: 'online',
        computeCapacity: data.nodeData.computeCapacity,
        reputationScore: 0,
        lastSeen: new Date(),
      });

      client.emit('registration_success', {
        nodeId: data.nodeId,
        timestamp: new Date(),
      });

      this.logger.log(`Node ${data.nodeId} registered successfully`);
    } catch (error) {
      this.logger.error(`Error registering node ${data.nodeId}:`, error);
      client.emit('registration_error', {
        error: error.message,
        nodeId: data.nodeId,
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('submit_contribution')
  async handleContributionSubmission(
    @ConnectedSocket() client: HivemindSocket,
    @MessageBody() data: {
      sessionId: number;
      computeTime: number;
      gradientQuality: number;
      dataTransmitted: number;
      uptimeRatio: number;
    }
  ) {
    try {
      if (!client.nodeId) {
        client.emit('error', { message: 'Node not registered' });
        return;
      }

      this.logger.log(`Contribution from node ${client.nodeId} for session ${data.sessionId}`);

      // Submit contribution through Hivemind service
      await this.hivemindService.submitContribution({
        sessionId: data.sessionId,
        participant: client.nodeId,
        computeTime: data.computeTime,
        gradientQuality: data.gradientQuality,
        dataTransmitted: data.dataTransmitted,
        uptimeRatio: data.uptimeRatio,
        timestamp: new Date(),
      });

      // Broadcast contribution update
      this.server.emit('contribution_submitted', {
        type: 'contribution_submitted',
        data: {
          nodeId: client.nodeId,
          sessionId: data.sessionId,
          score: data.gradientQuality,
        },
        timestamp: new Date(),
      });

      client.emit('contribution_confirmed', {
        sessionId: data.sessionId,
        timestamp: new Date(),
      });

      this.logger.log(`Contribution from ${client.nodeId} confirmed`);
    } catch (error) {
      this.logger.error('Error submitting contribution:', error);
      client.emit('contribution_error', {
        error: error.message,
        sessionId: data.sessionId,
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(
    @ConnectedSocket() client: HivemindSocket,
    @MessageBody() data: { metrics?: any }
  ) {
    if (client.nodeId) {
      // Update node metrics
      if (data.metrics) {
        this.nodeMetrics.set(client.nodeId, {
          ...data.metrics,
          lastUpdate: new Date(),
        });
      }

      // Send heartbeat response
      client.emit('heartbeat_ack', {
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('training_session_start')
  async handleTrainingSessionStart(
    @ConnectedSocket() client: HivemindSocket,
    @MessageBody() data: { sessionId: number; modelConfig: any }
  ) {
    try {
      this.logger.log(`Training session ${data.sessionId} starting`);

      // Notify all connected nodes
      for (const [nodeId, socketId] of this.connectedNodes) {
        const nodeSocket = this.server.sockets.sockets.get(socketId);
        if (nodeSocket) {
          nodeSocket.emit('training_session_available', {
            sessionId: data.sessionId,
            modelConfig: data.modelConfig,
            timestamp: new Date(),
          });
        }
      }

      // Broadcast to monitoring clients
      this.server.emit('training_session_started', {
        type: 'training_session_started',
        data: {
          sessionId: data.sessionId,
          participatingNodes: this.connectedNodes.size,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error starting training session:', error);
    }
  }

  /**
   * Broadcast network statistics to all connected clients
   */
  private async broadcastNetworkStats() {
    try {
      const stats = await this.hivemindService.getNetworkStatistics();
      
      this.server.emit('network_stats', {
        type: 'network_stats',
        data: {
          ...stats,
          connectedNodes: this.connectedNodes.size,
          activeClients: this.connectedClients.size,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error broadcasting network stats:', error);
    }
  }

  /**
   * Broadcast node updates to all monitoring clients
   */
  private async broadcastNodeUpdates() {
    try {
      const nodes = await this.hivemindService.getNodes();
      
      // Add real-time connection status
      const nodesWithStatus = nodes.map(node => ({
        ...node,
        isConnected: this.connectedNodes.has(node.nodeId),
        metrics: this.nodeMetrics.get(node.nodeId),
      }));

      this.server.emit('nodes_update', {
        type: 'nodes_update',
        data: nodesWithStatus,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error broadcasting node updates:', error);
    }
  }

  /**
   * Broadcast specific node update
   */
  private broadcastNodeUpdate(update: P2PNodeUpdate) {
    this.server.emit('node_update', {
      type: 'node_update',
      data: update,
      timestamp: new Date(),
    });
  }

  /**
   * Public methods for external services to trigger broadcasts
   */
  public broadcastRewardDistribution(data: any) {
    this.server.emit('reward_distributed', {
      type: 'reward_distributed',
      data,
      timestamp: new Date(),
    });
  }

  public broadcastContributionUpdate(data: any) {
    this.server.emit('contribution_update', {
      type: 'contribution_update',
      data,
      timestamp: new Date(),
    });
  }

  public notifyTrainingSessionComplete(sessionId: number, results: any) {
    this.server.emit('training_session_complete', {
      type: 'training_session_complete',
      data: {
        sessionId,
        results,
      },
      timestamp: new Date(),
    });
  }
}