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
import { OnEvent } from '@nestjs/event-emitter';
import { HivemindService } from '../hivemind.service';
import { ContributionTrackerService } from '../services/contribution-tracker.service';
import { FaultToleranceService } from '../services/fault-tolerance.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  nodeId?: string;
  sessionId?: string;
  isNode?: boolean;
}

@WebSocketGateway({
  namespace: 'hivemind',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class HivemindGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(HivemindGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();
  private nodeConnections = new Map<string, AuthenticatedSocket>();
  private sessionRooms = new Map<string, Set<string>>();

  constructor(
    private hivemindService: HivemindService,
    private contributionTracker: ContributionTrackerService,
    private faultTolerance: FaultToleranceService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Hivemind WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const { nodeId, sessionId, type } = client.handshake.query;
      
      client.nodeId = nodeId as string;
      client.sessionId = sessionId as string;
      client.isNode = type === 'node';

      this.connectedClients.set(client.id, client);

      if (client.isNode && client.nodeId) {
        this.nodeConnections.set(client.nodeId, client);
        await this.handleNodeConnection(client);
      }

      if (client.sessionId) {
        await client.join(`session:${client.sessionId}`);
        this.addToSessionRoom(client.sessionId, client.id);
      }

      this.logger.log(
        `Client connected: ${client.id} ${client.isNode ? `(Node: ${client.nodeId})` : '(Monitor)'}`
      );

      // Send initial state
      await this.sendNetworkState(client);

    } catch (error) {
      this.logger.error('Error handling connection:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    try {
      this.connectedClients.delete(client.id);

      if (client.nodeId) {
        this.nodeConnections.delete(client.nodeId);
        await this.handleNodeDisconnection(client);
      }

      if (client.sessionId) {
        this.removeFromSessionRoom(client.sessionId, client.id);
      }

      this.logger.log(`Client disconnected: ${client.id}`);

    } catch (error) {
      this.logger.error('Error handling disconnection:', error);
    }
  }

  private async handleNodeConnection(client: AuthenticatedSocket) {
    try {
      // Register node as active
      if (client.nodeId) {
        // Send node-specific initialization data
        client.emit('node:initialized', {
          nodeId: client.nodeId,
          timestamp: new Date(),
        });

        // Notify other clients about new node
        this.server.emit('node:joined', {
          nodeId: client.nodeId,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Error handling node connection:', error);
    }
  }

  private async handleNodeDisconnection(client: AuthenticatedSocket) {
    try {
      if (client.nodeId) {
        // Handle fault tolerance
        await this.faultTolerance.handleNodeFailure(
          client.nodeId,
          'DISCONNECT',
          { reason: 'WebSocket disconnection' }
        );

        // Notify other clients
        this.server.emit('node:left', {
          nodeId: client.nodeId,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Error handling node disconnection:', error);
    }
  }

  // Node-specific message handlers
  @SubscribeMessage('node:heartbeat')
  async handleNodeHeartbeat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { status: any; metrics: any }
  ) {
    try {
      if (!client.nodeId) return;

      // Update node status
      client.emit('heartbeat:ack', { timestamp: new Date() });

      // Broadcast node status to monitors
      this.server.emit('node:status_update', {
        nodeId: client.nodeId,
        status: data.status,
        metrics: data.metrics,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error('Error handling heartbeat:', error);
    }
  }

  @SubscribeMessage('node:gradient_submission')
  async handleGradientSubmission(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      sessionId: string;
      gradientData: any;
      quality: number;
      computeTime: number;
      metadata: any;
    }
  ) {
    try {
      if (!client.nodeId) return;

      // Process gradient submission
      await this.contributionTracker.recordContribution({
        sessionId: parseInt(data.sessionId),
        participant: client.nodeId,
        computeTime: data.computeTime,
        gradientQuality: data.quality,
        dataTransmitted: Buffer.byteLength(JSON.stringify(data.gradientData)),
        uptimeRatio: 100, // Default, should be calculated
        timestamp: new Date(),
      });

      // Notify session participants
      this.server.to(`session:${data.sessionId}`).emit('gradient:received', {
        nodeId: client.nodeId,
        quality: data.quality,
        timestamp: new Date(),
      });

      client.emit('gradient:acknowledged', {
        sessionId: data.sessionId,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error('Error handling gradient submission:', error);
      client.emit('gradient:error', { error: error.message });
    }
  }

  @SubscribeMessage('node:training_metrics')
  async handleTrainingMetrics(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      sessionId: string;
      metrics: {
        loss: number;
        accuracy: number;
        epoch: number;
        batchSize: number;
      };
    }
  ) {
    try {
      if (!client.nodeId) return;

      // Broadcast metrics to session
      this.server.to(`session:${data.sessionId}`).emit('training:metrics_update', {
        nodeId: client.nodeId,
        metrics: data.metrics,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error('Error handling training metrics:', error);
    }
  }

  // Monitor-specific message handlers
  @SubscribeMessage('monitor:join_session')
  async handleJoinSession(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      await client.join(`session:${data.sessionId}`);
      client.sessionId = data.sessionId;
      this.addToSessionRoom(data.sessionId, client.id);

      // Send session state
      await this.sendSessionState(client, data.sessionId);

    } catch (error) {
      this.logger.error('Error joining session:', error);
    }
  }

  @SubscribeMessage('monitor:leave_session')
  async handleLeaveSession(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      await client.leave(`session:${data.sessionId}`);
      this.removeFromSessionRoom(data.sessionId, client.id);

    } catch (error) {
      this.logger.error('Error leaving session:', error);
    }
  }

  @SubscribeMessage('monitor:request_network_stats')
  async handleRequestNetworkStats(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const stats = await this.hivemindService.getNetworkStats();
      client.emit('network:stats', stats);

    } catch (error) {
      this.logger.error('Error getting network stats:', error);
    }
  }

  // Event listeners for internal events
  @OnEvent('node.registered')
  async handleNodeRegistered(data: { nodeId: string; [key: string]: any }) {
    this.server.emit('node:registered', {
      nodeId: data.nodeId,
      timestamp: new Date(),
      ...data,
    });
  }

  @OnEvent('contribution.recorded')
  async handleContributionRecorded(data: any) {
    if (data.sessionId) {
      this.server.to(`session:${data.sessionId}`).emit('contribution:recorded', {
        ...data,
        timestamp: new Date(),
      });
    }
  }

  @OnEvent('rewards.distributed')
  async handleRewardsDistributed(data: any) {
    this.server.emit('rewards:distributed', {
      ...data,
      timestamp: new Date(),
    });

    // Notify specific nodes about their rewards
    for (const [nodeId, amount] of data.distributions) {
      const nodeSocket = this.nodeConnections.get(nodeId);
      if (nodeSocket) {
        nodeSocket.emit('reward:received', {
          sessionId: data.sessionId,
          amount,
          timestamp: new Date(),
        });
      }
    }
  }

  @OnEvent('node.failure.handled')
  async handleNodeFailure(data: { nodeId: string; failureType: string; details: any }) {
    this.server.emit('node:failure', {
      ...data,
      timestamp: new Date(),
    });
  }

  @OnEvent('checkpoint.created')
  async handleCheckpointCreated(data: { sessionId: string; checkpointId: string }) {
    this.server.to(`session:${data.sessionId}`).emit('checkpoint:created', {
      ...data,
      timestamp: new Date(),
    });
  }

  // Training session controls
  @SubscribeMessage('training:start_session')
  async handleStartTrainingSession(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string; modelConfig: any }
  ) {
    try {
      await this.hivemindService.startTrainingSession(
        parseInt(data.sessionId),
        data.modelConfig
      );

      this.server.to(`session:${data.sessionId}`).emit('training:session_started', {
        sessionId: data.sessionId,
        modelConfig: data.modelConfig,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error('Error starting training session:', error);
      client.emit('training:error', { error: error.message });
    }
  }

  @SubscribeMessage('training:stop_session')
  async handleStopTrainingSession(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      await this.hivemindService.stopTrainingSession(parseInt(data.sessionId));

      this.server.to(`session:${data.sessionId}`).emit('training:session_stopped', {
        sessionId: data.sessionId,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error('Error stopping training session:', error);
      client.emit('training:error', { error: error.message });
    }
  }

  // Helper methods
  private async sendNetworkState(client: AuthenticatedSocket) {
    try {
      const [networkStats, activeNodes] = await Promise.all([
        this.hivemindService.getNetworkStats(),
        this.hivemindService.getActiveNodes(),
      ]);

      client.emit('network:initial_state', {
        stats: networkStats,
        nodes: activeNodes,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error('Error sending network state:', error);
    }
  }

  private async sendSessionState(client: AuthenticatedSocket, sessionId: string) {
    try {
      const [contributions, topContributors] = await Promise.all([
        this.contributionTracker.getSessionContributions(parseInt(sessionId)),
        this.contributionTracker.getTopContributors(parseInt(sessionId)),
      ]);

      client.emit('session:initial_state', {
        sessionId,
        contributions,
        topContributors,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error('Error sending session state:', error);
    }
  }

  private addToSessionRoom(sessionId: string, clientId: string) {
    if (!this.sessionRooms.has(sessionId)) {
      this.sessionRooms.set(sessionId, new Set());
    }
    this.sessionRooms.get(sessionId)!.add(clientId);
  }

  private removeFromSessionRoom(sessionId: string, clientId: string) {
    const room = this.sessionRooms.get(sessionId);
    if (room) {
      room.delete(clientId);
      if (room.size === 0) {
        this.sessionRooms.delete(sessionId);
      }
    }
  }

  // Public methods for external services
  async broadcastToSession(sessionId: string, event: string, data: any) {
    this.server.to(`session:${sessionId}`).emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }

  async sendToNode(nodeId: string, event: string, data: any) {
    const nodeSocket = this.nodeConnections.get(nodeId);
    if (nodeSocket) {
      nodeSocket.emit(event, {
        ...data,
        timestamp: new Date(),
      });
    }
  }

  async broadcastNetworkUpdate(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }

  getConnectedNodes(): string[] {
    return Array.from(this.nodeConnections.keys());
  }

  getSessionParticipants(sessionId: string): number {
    return this.sessionRooms.get(sessionId)?.size || 0;
  }
}