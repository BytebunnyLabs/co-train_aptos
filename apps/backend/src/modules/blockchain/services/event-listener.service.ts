import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { EventLog, EventType, EventStatus } from '../entities/event-log.entity';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { Reward, RewardStatus, RewardType } from '../entities/reward.entity';
import { TrainingSession } from '../../training/entities/training-session.entity';
import { User } from '../../users/entities/user.entity';
import { WebSocketService } from '../../websocket/websocket.service';

@Injectable()
export class EventListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventListenerService.name);
  private aptos: Aptos;
  private contractAddress: string;
  private isListening = false;
  private listenerInterval: NodeJS.Timeout;
  private lastProcessedVersion = 0;

  constructor(
    @InjectRepository(EventLog)
    private eventLogRepository: Repository<EventLog>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    @InjectRepository(TrainingSession)
    private trainingSessionRepository: Repository<TrainingSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
    private webSocketService: WebSocketService,
  ) {
    this.initializeAptos();
    this.contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');
  }

  private initializeAptos() {
    const network = this.configService.get<string>('APTOS_NETWORK') || 'testnet';
    const nodeUrl = this.configService.get<string>('APTOS_NODE_URL');
    
    let aptosConfig: AptosConfig;
    if (nodeUrl) {
      aptosConfig = new AptosConfig({ fullnode: nodeUrl });
    } else {
      aptosConfig = new AptosConfig({ network: network as Network });
    }
    
    this.aptos = new Aptos(aptosConfig);
  }

  async onModuleInit() {
    await this.initializeEventListener();
  }

  async onModuleDestroy() {
    this.stopListening();
  }

  private async initializeEventListener() {
    try {
      // Get the last processed version from database
      const lastEvent = await this.eventLogRepository.findOne({
        where: {},
        order: { createdAt: 'DESC' },
      });

      if (lastEvent) {
        // Parse the last processed version from block height
        this.lastProcessedVersion = parseInt(lastEvent.blockHeight);
      }

      await this.startListening();
      this.logger.log(`Event listener initialized. Starting from version: ${this.lastProcessedVersion}`);
    } catch (error) {
      this.logger.error('Failed to initialize event listener:', error);
    }
  }

  private async startListening() {
    if (this.isListening) return;

    this.isListening = true;
    this.logger.log('Starting blockchain event listener...');

    // Poll for new events every 5 seconds
    this.listenerInterval = setInterval(async () => {
      try {
        await this.pollForEvents();
      } catch (error) {
        this.logger.error('Error polling for events:', error);
      }
    }, 5000);
  }

  private stopListening() {
    if (this.listenerInterval) {
      clearInterval(this.listenerInterval);
      this.isListening = false;
      this.logger.log('Stopped blockchain event listener');
    }
  }

  private async pollForEvents() {
    try {
      // Get account events from the contract
      const events = await this.aptos.getAccountEventsByEventType({
        accountAddress: this.contractAddress,
        eventType: '0x1::account::Account',
        minimumLedgerVersion: this.lastProcessedVersion,
        options: {
          limit: 100,
        },
      });

      for (const event of events) {
        await this.processEvent(event);
      }

      if (events.length > 0) {
        this.lastProcessedVersion = parseInt(events[events.length - 1].transaction_version);
      }
    } catch (error) {
      this.logger.error('Failed to poll for events:', error);
    }
  }

  private async processEvent(event: any) {
    try {
      // Check if event is already processed
      const existingEvent = await this.eventLogRepository.findOne({
        where: {
          eventGuid: event.guid?.creation_number || event.creation_number,
          sequenceNumber: event.sequence_number,
        },
      });

      if (existingEvent) {
        return; // Skip already processed events
      }

      // Determine event type based on event data
      const eventType = this.determineEventType(event);
      if (!eventType) {
        return; // Skip unrecognized events
      }

      // Create event log entry
      const eventLog = this.eventLogRepository.create({
        eventType,
        transactionHash: event.transaction_version, // Use transaction version as hash
        blockHeight: event.transaction_version,
        eventGuid: event.guid?.creation_number || event.creation_number,
        sequenceNumber: event.sequence_number,
        eventData: {
          type: event.type,
          data: event.data,
        },
        status: EventStatus.PENDING,
      });

      await this.eventLogRepository.save(eventLog);

      // Process the event
      await this.handleEvent(eventLog);

      this.logger.log(`Processed event: ${eventType} (${event.guid?.creation_number || event.creation_number})`);
    } catch (error) {
      this.logger.error(`Failed to process event ${event.guid?.creation_number || event.creation_number}:`, error);
    }
  }

  private determineEventType(event: any): EventType | null {
    const eventType = event.type;

    if (eventType.includes('SessionCreated')) {
      return EventType.SESSION_CREATED;
    } else if (eventType.includes('ParticipantRegistered')) {
      return EventType.PARTICIPANT_REGISTERED;
    } else if (eventType.includes('ContributionSubmitted')) {
      return EventType.CONTRIBUTION_SUBMITTED;
    } else if (eventType.includes('SessionCompleted')) {
      return EventType.SESSION_COMPLETED;
    } else if (eventType.includes('RewardDistributed')) {
      return EventType.REWARD_DISTRIBUTED;
    } else if (eventType.includes('RewardClaimed')) {
      return EventType.REWARD_CLAIMED;
    }

    return null;
  }

  private async handleEvent(eventLog: EventLog) {
    try {
      switch (eventLog.eventType) {
        case EventType.SESSION_CREATED:
          await this.handleSessionCreated(eventLog);
          break;
        case EventType.PARTICIPANT_REGISTERED:
          await this.handleParticipantRegistered(eventLog);
          break;
        case EventType.CONTRIBUTION_SUBMITTED:
          await this.handleContributionSubmitted(eventLog);
          break;
        case EventType.SESSION_COMPLETED:
          await this.handleSessionCompleted(eventLog);
          break;
        case EventType.REWARD_DISTRIBUTED:
          await this.handleRewardDistributed(eventLog);
          break;
        case EventType.REWARD_CLAIMED:
          await this.handleRewardClaimed(eventLog);
          break;
        default:
          this.logger.warn(`Unhandled event type: ${eventLog.eventType}`);
      }

      // Mark event as processed
      eventLog.status = EventStatus.PROCESSED;
      eventLog.processedAt = new Date();
      await this.eventLogRepository.save(eventLog);
    } catch (error) {
      this.logger.error(`Failed to handle event ${eventLog.id}:`, error);
      
      // Mark event as failed and increment retry count
      eventLog.status = EventStatus.FAILED;
      eventLog.errorMessage = error.message;
      eventLog.retryCount += 1;
      eventLog.lastRetryAt = new Date();
      await this.eventLogRepository.save(eventLog);
    }
  }

  private async handleSessionCreated(eventLog: EventLog) {
    const { sessionId, creator, maxParticipants, rewardPool } = eventLog.eventData.data;

    // Update training session with blockchain data
    const trainingSession = await this.trainingSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (trainingSession) {
      trainingSession.maxParticipants = maxParticipants;
      trainingSession.rewards = {
        ...trainingSession.rewards,
        tokens: parseFloat(rewardPool),
      };
      await this.trainingSessionRepository.save(trainingSession);

      // Emit WebSocket event
      this.webSocketService.emitSessionUpdate({
        sessionId,
        type: 'created',
        data: trainingSession,
      });
    }
  }

  private async handleParticipantRegistered(eventLog: EventLog) {
    const { sessionId, participant } = eventLog.eventData.data;

    // Update participant count
    const trainingSession = await this.trainingSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (trainingSession) {
      trainingSession.currentParticipants += 1;
      await this.trainingSessionRepository.save(trainingSession);

      // Emit WebSocket event
      this.webSocketService.emitSessionUpdate({
        sessionId,
        type: 'participant_joined',
        data: { participant, currentParticipants: trainingSession.currentParticipants },
      });
    }
  }

  private async handleContributionSubmitted(eventLog: EventLog) {
    const { sessionId, participant, score } = eventLog.eventData.data;

    // Emit WebSocket event for real-time updates
    this.webSocketService.emitSessionUpdate({
      sessionId,
      type: 'contribution_submitted',
      data: { participant, score },
    });
  }

  private async handleSessionCompleted(eventLog: EventLog) {
    const { sessionId } = eventLog.eventData.data;

    // Update training session status
    const trainingSession = await this.trainingSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (trainingSession) {
      trainingSession.status = 'completed' as any;
      trainingSession.completedAt = new Date();
      await this.trainingSessionRepository.save(trainingSession);

      // Emit WebSocket event
      this.webSocketService.emitSessionUpdate({
        sessionId,
        type: 'completed',
        data: trainingSession,
      });
    }
  }

  private async handleRewardDistributed(eventLog: EventLog) {
    const { sessionId, participant, amount, rewardType } = eventLog.eventData.data;

    // Find or create user
    let user = await this.userRepository.findOne({
      where: { walletAddress: participant },
    });

    if (!user) {
      // Create user if not exists
      user = this.userRepository.create({
        walletAddress: participant,
        username: `user_${participant.slice(-8)}`,
      });
      user = await this.userRepository.save(user);
    }

    // Create reward entry
    const reward = this.rewardRepository.create({
      userId: user.id,
      trainingSessionId: sessionId,
      type: this.mapRewardType(rewardType),
      amount: amount.toString(),
      status: RewardStatus.CLAIMABLE,
      calculatedAt: new Date(),
    });

    await this.rewardRepository.save(reward);

    // Emit WebSocket event
    this.webSocketService.emitSessionUpdate({
      sessionId,
      type: 'reward_distributed',
      data: { participant, amount, rewardType },
      userId: user.id,
    });
  }

  private async handleRewardClaimed(eventLog: EventLog) {
    const { participant, amount, claimTxHash } = eventLog.eventData.data;

    // Update reward status
    const user = await this.userRepository.findOne({
      where: { walletAddress: participant },
    });

    if (user) {
      await this.rewardRepository.update(
        {
          userId: user.id,
          status: RewardStatus.CLAIMABLE,
          amount: amount.toString(),
        },
        {
          status: RewardStatus.CLAIMED,
          claimedAt: new Date(),
        }
      );

      // Emit WebSocket event
      this.webSocketService.emitNotification({
        userId: user.id,
        type: 'success',
        title: 'Reward Claimed',
        message: `Successfully claimed ${amount} APT tokens`,
        data: { amount, transactionHash: claimTxHash },
      });
    }
  }

  private mapRewardType(blockchainRewardType: string): RewardType {
    switch (blockchainRewardType) {
      case 'participation':
        return RewardType.PARTICIPATION;
      case 'performance':
        return RewardType.PERFORMANCE;
      case 'completion':
        return RewardType.COMPLETION;
      case 'bonus':
        return RewardType.BONUS;
      default:
        return RewardType.PARTICIPATION;
    }
  }

  // Public methods for manual processing
  async retryFailedEvents(): Promise<void> {
    const failedEvents = await this.eventLogRepository.find({
      where: { status: EventStatus.FAILED },
      order: { lastRetryAt: 'ASC' },
      take: 10,
    });

    for (const event of failedEvents) {
      if (event.canRetry) {
        await this.handleEvent(event);
      }
    }
  }

  async getEventStats() {
    const stats = await this.eventLogRepository
      .createQueryBuilder('event')
      .select('event.status, COUNT(*) as count')
      .groupBy('event.status')
      .getRawMany();

    return stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {});
  }
}