import { Injectable, Logger } from '@nestjs/common';
import { SessionWebSocketGateway } from './websocket.gateway';

export interface SessionUpdateEvent {
  sessionId: string;
  type: 'created' | 'updated' | 'participant_joined' | 'participant_left' | 'contribution_submitted' | 'completed' | 'reward_distributed';
  data: any;
  userId?: string;
}

export interface NotificationEvent {
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);

  constructor(private readonly wsGateway: SessionWebSocketGateway) {}

  /**
   * Send session update to all participants in a session
   */
  async broadcastSessionUpdate(event: SessionUpdateEvent) {
    try {
      this.logger.log(`Broadcasting session update: ${event.type} for session ${event.sessionId}`);
      
      this.wsGateway.broadcastSessionUpdate(event.sessionId, event.type, event.data);
      
      // Also send a general session list update if needed
      if (['created', 'completed'].includes(event.type)) {
        this.wsGateway.broadcastGlobal('sessionListUpdate', {
          type: event.type,
          sessionId: event.sessionId,
          data: event.data,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to broadcast session update: ${error.message}`);
    }
  }

  /**
   * Send notification to specific user
   */
  async sendUserNotification(notification: NotificationEvent) {
    try {
      this.logger.log(`Sending notification to user ${notification.userId}: ${notification.title}`);
      
      this.wsGateway.notifyUser(notification.userId, 'notification', {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
      });
    } catch (error) {
      this.logger.error(`Failed to send user notification: ${error.message}`);
    }
  }

  /**
   * Broadcast global announcement
   */
  async broadcastAnnouncement(title: string, message: string, type: 'info' | 'warning' = 'info') {
    try {
      this.logger.log(`Broadcasting announcement: ${title}`);
      
      this.wsGateway.broadcastGlobal('announcement', {
        title,
        message,
        type,
      });
    } catch (error) {
      this.logger.error(`Failed to broadcast announcement: ${error.message}`);
    }
  }

  /**
   * Send real-time training metrics update
   */
  async broadcastTrainingMetrics(sessionId: string, metrics: any) {
    try {
      this.logger.log(`Broadcasting training metrics for session ${sessionId}`);
      
      this.wsGateway.broadcastSessionUpdate(sessionId, 'training_metrics', metrics);
    } catch (error) {
      this.logger.error(`Failed to broadcast training metrics: ${error.message}`);
    }
  }

  /**
   * Send reward update notification
   */
  async notifyRewardUpdate(userId: string, rewardData: any) {
    try {
      this.logger.log(`Notifying reward update for user ${userId}`);
      
      this.wsGateway.notifyUser(userId, 'rewardUpdate', rewardData);
      
      // Also send a notification
      await this.sendUserNotification({
        userId,
        type: 'success',
        title: 'Reward Available',
        message: `You have earned ${rewardData.amount} APT tokens!`,
        data: rewardData,
      });
    } catch (error) {
      this.logger.error(`Failed to notify reward update: ${error.message}`);
    }
  }

  /**
   * Send transaction status update
   */
  async notifyTransactionUpdate(userId: string, transactionData: any) {
    try {
      this.logger.log(`Notifying transaction update for user ${userId}`);
      
      this.wsGateway.notifyUser(userId, 'transactionUpdate', transactionData);
      
      // Send appropriate notification based on status
      let notificationType: 'success' | 'error' | 'info' = 'info';
      let title = 'Transaction Update';
      let message = 'Your transaction status has been updated.';
      
      switch (transactionData.status) {
        case 'confirmed':
          notificationType = 'success';
          title = 'Transaction Confirmed';
          message = 'Your transaction has been confirmed on the blockchain.';
          break;
        case 'failed':
          notificationType = 'error';
          title = 'Transaction Failed';
          message = 'Your transaction failed. Please try again.';
          break;
        case 'pending':
          notificationType = 'info';
          title = 'Transaction Pending';
          message = 'Your transaction is being processed.';
          break;
      }
      
      await this.sendUserNotification({
        userId,
        type: notificationType,
        title,
        message,
        data: transactionData,
      });
    } catch (error) {
      this.logger.error(`Failed to notify transaction update: ${error.message}`);
    }
  }

  /**
   * Get WebSocket statistics
   */
  getStatistics() {
    try {
      return this.wsGateway.getSessionStats();
    } catch (error) {
      this.logger.error(`Failed to get WebSocket statistics: ${error.message}`);
      return {
        totalSessions: 0,
        totalConnections: 0,
        sessionDetails: [],
      };
    }
  }

  /**
   * Emit session update - alias for broadcastSessionUpdate for backward compatibility
   */
  async emitSessionUpdate(event: SessionUpdateEvent) {
    await this.broadcastSessionUpdate(event);
  }

  /**
   * Emit notification - alias for sendUserNotification for backward compatibility
   */
  async emitNotification(notification: NotificationEvent) {
    await this.sendUserNotification(notification);
  }

  /**
   * Emit system-wide notification
   */
  async emitSystemNotification(notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: any;
  }) {
    try {
      this.logger.log(`Emitting system notification: ${notification.title}`);
      
      this.wsGateway.broadcastGlobal('systemNotification', {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to emit system notification: ${error.message}`);
    }
  }
}