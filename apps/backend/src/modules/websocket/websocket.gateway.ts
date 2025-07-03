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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface SessionRoom {
  sessionId: string;
  participants: Set<string>;
  lastActivity: Date;
}

interface SessionUpdatePayload {
  sessionId: string;
  type: 'participant_joined' | 'participant_left' | 'session_updated' | 'session_completed' | 'reward_distributed';
  data: any;
  timestamp: Date;
}

interface UserSocket extends Socket {
  userId?: string;
  walletAddress?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/sessions',
})
export class SessionWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SessionWebSocketGateway.name);
  private readonly sessionRooms = new Map<string, SessionRoom>();
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private readonly socketUsers = new Map<string, string>(); // socketId -> userId

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    
    // Cleanup inactive rooms every 5 minutes
    setInterval(() => {
      this.cleanupInactiveRooms();
    }, 5 * 60 * 1000);
  }

  async handleConnection(client: UserSocket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    try {
      // Extract user info from query parameters or headers
      const userId = client.handshake.query.userId as string;
      const walletAddress = client.handshake.query.walletAddress as string;
      
      if (userId && walletAddress) {
        client.userId = userId;
        client.walletAddress = walletAddress;
        
        // Track user socket
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(client.id);
        this.socketUsers.set(client.id, userId);
        
        this.logger.log(`User ${userId} connected with wallet ${walletAddress}`);
        
        // Send connection confirmation
        client.emit('connected', {
          message: 'Successfully connected to session updates',
          userId,
          timestamp: new Date(),
        });
      } else {
        this.logger.warn(`Client ${client.id} connected without proper authentication`);
        client.emit('error', {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }
    } catch (error) {
      this.logger.error(`Error handling connection: ${error.message}`);
      client.emit('error', {
        message: 'Connection error',
        code: 'CONNECTION_ERROR',
      });
    }
  }

  async handleDisconnect(client: UserSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove from session rooms
    for (const [sessionId, room] of this.sessionRooms.entries()) {
      if (room.participants.has(client.id)) {
        room.participants.delete(client.id);
        client.leave(sessionId);
        
        // Notify other participants
        if (client.userId) {
          this.broadcastToSession(sessionId, 'participant_left', {
            userId: client.userId,
            walletAddress: client.walletAddress,
            participantCount: room.participants.size,
          });
        }
        
        // Remove empty rooms
        if (room.participants.size === 0) {
          this.sessionRooms.delete(sessionId);
          this.logger.log(`Removed empty session room: ${sessionId}`);
        }
      }
    }
    
    // Clean up user tracking
    const userId = this.socketUsers.get(client.id);
    if (userId) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.socketUsers.delete(client.id);
    }
  }

  @SubscribeMessage('joinSession')
  async handleJoinSession(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      const { sessionId } = data;
      
      if (!sessionId) {
        client.emit('error', {
          message: 'Session ID is required',
          code: 'INVALID_SESSION_ID',
        });
        return;
      }
      
      // Create or get session room
      if (!this.sessionRooms.has(sessionId)) {
        this.sessionRooms.set(sessionId, {
          sessionId,
          participants: new Set(),
          lastActivity: new Date(),
        });
        this.logger.log(`Created new session room: ${sessionId}`);
      }
      
      const room = this.sessionRooms.get(sessionId)!;
      
      // Add client to room
      client.join(sessionId);
      room.participants.add(client.id);
      room.lastActivity = new Date();
      
      this.logger.log(`Client ${client.id} joined session ${sessionId}`);
      
      // Confirm join to client
      client.emit('sessionJoined', {
        sessionId,
        participantCount: room.participants.size,
        timestamp: new Date(),
      });
      
      // Notify other participants
      if (client.userId) {
        this.broadcastToSession(sessionId, 'participant_joined', {
          userId: client.userId,
          walletAddress: client.walletAddress,
          participantCount: room.participants.size,
        }, client.id);
      }
    } catch (error) {
      this.logger.error(`Error joining session: ${error.message}`);
      client.emit('error', {
        message: 'Failed to join session',
        code: 'JOIN_SESSION_ERROR',
      });
    }
  }

  @SubscribeMessage('leaveSession')
  async handleLeaveSession(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      const { sessionId } = data;
      
      const room = this.sessionRooms.get(sessionId);
      if (room && room.participants.has(client.id)) {
        client.leave(sessionId);
        room.participants.delete(client.id);
        room.lastActivity = new Date();
        
        this.logger.log(`Client ${client.id} left session ${sessionId}`);
        
        // Confirm leave to client
        client.emit('sessionLeft', {
          sessionId,
          timestamp: new Date(),
        });
        
        // Notify other participants
        if (client.userId) {
          this.broadcastToSession(sessionId, 'participant_left', {
            userId: client.userId,
            walletAddress: client.walletAddress,
            participantCount: room.participants.size,
          });
        }
        
        // Remove empty room
        if (room.participants.size === 0) {
          this.sessionRooms.delete(sessionId);
          this.logger.log(`Removed empty session room: ${sessionId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error leaving session: ${error.message}`);
      client.emit('error', {
        message: 'Failed to leave session',
        code: 'LEAVE_SESSION_ERROR',
      });
    }
  }

  @SubscribeMessage('getSessionInfo')
  async handleGetSessionInfo(
    @ConnectedSocket() client: UserSocket,
    @MessageBody() data: { sessionId: string }
  ) {
    try {
      const { sessionId } = data;
      const room = this.sessionRooms.get(sessionId);
      
      client.emit('sessionInfo', {
        sessionId,
        participantCount: room ? room.participants.size : 0,
        isConnected: room ? room.participants.has(client.id) : false,
        lastActivity: room ? room.lastActivity : null,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error getting session info: ${error.message}`);
      client.emit('error', {
        message: 'Failed to get session info',
        code: 'SESSION_INFO_ERROR',
      });
    }
  }

  // Public methods for broadcasting updates from other services
  
  /**
   * Broadcast session update to all participants
   */
  public broadcastSessionUpdate(sessionId: string, updateType: string, data: any) {
    this.broadcastToSession(sessionId, updateType, {
      ...data,
      timestamp: new Date(),
    });
  }

  /**
   * Notify specific user about updates
   */
  public notifyUser(userId: string, event: string, data: any) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach(socketId => {
        this.server.to(socketId).emit(event, {
          ...data,
          timestamp: new Date(),
        });
      });
    }
  }

  /**
   * Broadcast to all connected clients
   */
  public broadcastGlobal(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }

  /**
   * Get session statistics
   */
  public getSessionStats() {
    const stats = {
      totalSessions: this.sessionRooms.size,
      totalConnections: this.socketUsers.size,
      sessionDetails: Array.from(this.sessionRooms.entries()).map(([sessionId, room]) => ({
        sessionId,
        participantCount: room.participants.size,
        lastActivity: room.lastActivity,
      })),
    };
    
    return stats;
  }

  // Private helper methods
  
  private broadcastToSession(sessionId: string, type: string, data: any, excludeSocketId?: string) {
    const payload: SessionUpdatePayload = {
      sessionId,
      type: type as any,
      data,
      timestamp: new Date(),
    };
    
    if (excludeSocketId) {
      this.server.to(sessionId).except(excludeSocketId).emit('sessionUpdate', payload);
    } else {
      this.server.to(sessionId).emit('sessionUpdate', payload);
    }
    
    this.logger.debug(`Broadcasted ${type} to session ${sessionId}:`, data);
  }

  private cleanupInactiveRooms() {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    
    let removedCount = 0;
    for (const [sessionId, room] of this.sessionRooms.entries()) {
      const timeSinceActivity = now.getTime() - room.lastActivity.getTime();
      
      if (timeSinceActivity > inactiveThreshold) {
        // Force disconnect all participants in inactive room
        room.participants.forEach(socketId => {
          const socket = this.server.sockets.sockets.get(socketId);
          if (socket) {
            socket.leave(sessionId);
          }
        });
        
        this.sessionRooms.delete(sessionId);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.logger.log(`Cleaned up ${removedCount} inactive session rooms`);
    }
  }
}