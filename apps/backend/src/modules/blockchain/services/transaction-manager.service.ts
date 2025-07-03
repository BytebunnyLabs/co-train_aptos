import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';
import { User } from '../../users/entities/user.entity';
import { TrainingSession } from '../../training/entities/training-session.entity';
import { WebSocketService } from '../../websocket/websocket.service';

export interface TransactionRequest {
  userId: string;
  type: TransactionType;
  payload: {
    function: string;
    arguments: any[];
    type_arguments?: string[];
  };
  trainingSessionId?: string;
  amount?: string;
  fromAddress?: string;
  toAddress?: string;
}

@Injectable()
export class TransactionManagerService {
  private readonly logger = new Logger(TransactionManagerService.name);
  private aptos: Aptos;

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TrainingSession)
    private trainingSessionRepository: Repository<TrainingSession>,
    private configService: ConfigService,
    private webSocketService: WebSocketService,
  ) {
    this.initializeAptos();
  }

  private async initializeAptos() {
    try {
      const network = this.configService.get<string>('APTOS_NETWORK', 'testnet') as Network;
      const nodeUrl = this.configService.get<string>('APTOS_NODE_URL');
      
      let config: AptosConfig;
      if (nodeUrl) {
        config = new AptosConfig({ fullnode: nodeUrl });
      } else {
        config = new AptosConfig({ network });
      }
      
      this.aptos = new Aptos(config);
      this.logger.log(`Transaction manager initialized with Aptos ${network}`);
    } catch (error) {
      this.logger.error('Failed to initialize Aptos client:', error);
      throw error;
    }
  }

  async createTransaction(request: TransactionRequest): Promise<Transaction> {
    // Validate user exists
    const user = await this.userRepository.findOne({
      where: { id: request.userId },
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Validate training session if provided
    if (request.trainingSessionId) {
      const trainingSession = await this.trainingSessionRepository.findOne({
        where: { id: request.trainingSessionId },
      });
      if (!trainingSession) {
        throw new Error('Training session not found');
      }
    }

    // Create transaction record
    const transaction = this.transactionRepository.create({
      userId: request.userId,
      type: request.type,
      payload: request.payload,
      trainingSessionId: request.trainingSessionId,
      amount: request.amount,
      fromAddress: request.fromAddress,
      toAddress: request.toAddress,
      status: TransactionStatus.PENDING,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    this.logger.log(`Created transaction ${savedTransaction.id} for user ${request.userId}`);

    // Emit WebSocket event
    this.webSocketService.emitNotification({
      userId: request.userId,
      type: 'info',
      title: 'Transaction Created',
      message: `Transaction ${this.getTransactionTypeLabel(request.type)} has been created`,
      data: { transactionId: savedTransaction.id },
    });

    return savedTransaction;
  }

  async submitTransaction(transactionId: string, hash: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user'],
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new Error('Transaction is not in pending status');
    }

    // Update transaction with hash and status
    transaction.hash = hash;
    transaction.status = TransactionStatus.SUBMITTED;
    transaction.submittedAt = new Date();

    const updatedTransaction = await this.transactionRepository.save(transaction);

    this.logger.log(`Submitted transaction ${transactionId} with hash ${hash}`);

    // Emit WebSocket event
    this.webSocketService.emitNotification({
      userId: transaction.userId,
      type: 'info',
      title: 'Transaction Submitted',
      message: `Transaction has been submitted to the blockchain`,
      data: { 
        transactionId,
        hash,
        explorerUrl: updatedTransaction.explorerUrl,
      },
    });

    // Start monitoring the transaction
    this.monitorTransaction(transactionId);

    return updatedTransaction;
  }

  async monitorTransaction(transactionId: string): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user'],
    });

    if (!transaction || !transaction.hash) {
      return;
    }

    try {
      // Check transaction status on blockchain
      const txnStatus = await this.aptos.getTransactionByHash({ transactionHash: transaction.hash });
      
      // Check if transaction was executed successfully
      if ((txnStatus as any).success !== false) {
        await this.confirmTransaction(transaction, txnStatus);
      } else {
        await this.failTransaction(transaction, 'Transaction failed on blockchain');
      }
    } catch (error) {
      this.logger.warn(`Transaction ${transactionId} not yet available on blockchain`);
      
      // Retry monitoring after delay
      setTimeout(() => {
        this.monitorTransaction(transactionId);
      }, 10000); // Retry after 10 seconds
    }
  }

  private async confirmTransaction(transaction: Transaction, txnData: any): Promise<void> {
    transaction.status = TransactionStatus.CONFIRMED;
    transaction.confirmedAt = new Date();
    transaction.blockHeight = txnData.version.toString();
    transaction.gasUsed = txnData.gas_used;
    
    if (txnData.events) {
      transaction.events = txnData.events;
    }

    await this.transactionRepository.save(transaction);

    this.logger.log(`Confirmed transaction ${transaction.id} at block ${transaction.blockHeight}`);

    // Emit WebSocket event
    this.webSocketService.emitNotification({
      userId: transaction.userId,
      type: 'success',
      title: 'Transaction Confirmed',
      message: `${this.getTransactionTypeLabel(transaction.type)} has been confirmed`,
      data: {
        transactionId: transaction.id,
        hash: transaction.hash,
        blockHeight: transaction.blockHeight,
        explorerUrl: transaction.explorerUrl,
      },
    });

    // Process transaction-specific logic
    await this.processConfirmedTransaction(transaction);
  }

  private async failTransaction(transaction: Transaction, errorMessage: string): Promise<void> {
    transaction.status = TransactionStatus.FAILED;
    transaction.failedAt = new Date();
    transaction.errorMessage = errorMessage;

    await this.transactionRepository.save(transaction);

    this.logger.error(`Failed transaction ${transaction.id}: ${errorMessage}`);

    // Emit WebSocket event
    this.webSocketService.emitNotification({
      userId: transaction.userId,
      type: 'error',
      title: 'Transaction Failed',
      message: `${this.getTransactionTypeLabel(transaction.type)} has failed`,
      data: {
        transactionId: transaction.id,
        error: errorMessage,
      },
    });
  }

  private async processConfirmedTransaction(transaction: Transaction): Promise<void> {
    try {
      switch (transaction.type) {
        case TransactionType.CREATE_SESSION:
          await this.processCreateSessionConfirmation(transaction);
          break;
        case TransactionType.REGISTER_PARTICIPANT:
          await this.processRegisterParticipantConfirmation(transaction);
          break;
        case TransactionType.SUBMIT_CONTRIBUTION:
          await this.processSubmitContributionConfirmation(transaction);
          break;
        case TransactionType.COMPLETE_SESSION:
          await this.processCompleteSessionConfirmation(transaction);
          break;
        case TransactionType.CLAIM_REWARD:
          await this.processClaimRewardConfirmation(transaction);
          break;
        default:
          this.logger.warn(`No specific processing for transaction type: ${transaction.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process confirmed transaction ${transaction.id}:`, error);
    }
  }

  private async processCreateSessionConfirmation(transaction: Transaction): Promise<void> {
    if (transaction.trainingSessionId) {
      const trainingSession = await this.trainingSessionRepository.findOne({
        where: { id: transaction.trainingSessionId },
      });

      if (trainingSession) {
        // Update session status to running
        trainingSession.status = 'running' as any;
        trainingSession.startedAt = new Date();
        await this.trainingSessionRepository.save(trainingSession);

        // Emit WebSocket event
        this.webSocketService.emitSessionUpdate({
          sessionId: transaction.trainingSessionId,
          type: 'created',
          data: trainingSession,
          userId: transaction.userId,
        });
      }
    }
  }

  private async processRegisterParticipantConfirmation(transaction: Transaction): Promise<void> {
    if (transaction.trainingSessionId) {
      // Emit WebSocket event for participant joined
      this.webSocketService.emitSessionUpdate({
        sessionId: transaction.trainingSessionId,
        type: 'participant_joined',
        data: { participant: transaction.fromAddress },
        userId: transaction.userId,
      });
    }
  }

  private async processSubmitContributionConfirmation(transaction: Transaction): Promise<void> {
    if (transaction.trainingSessionId) {
      // Emit WebSocket event for contribution submitted
      this.webSocketService.emitSessionUpdate({
        sessionId: transaction.trainingSessionId,
        type: 'contribution_submitted',
        data: { 
          participant: transaction.fromAddress,
          contribution: transaction.payload.arguments,
        },
        userId: transaction.userId,
      });
    }
  }

  private async processCompleteSessionConfirmation(transaction: Transaction): Promise<void> {
    if (transaction.trainingSessionId) {
      const trainingSession = await this.trainingSessionRepository.findOne({
        where: { id: transaction.trainingSessionId },
      });

      if (trainingSession) {
        // Update session status to completed
        trainingSession.status = 'completed' as any;
        trainingSession.completedAt = new Date();
        await this.trainingSessionRepository.save(trainingSession);

        // Emit WebSocket event
        this.webSocketService.emitSessionUpdate({
          sessionId: transaction.trainingSessionId,
          type: 'completed',
          data: trainingSession,
          userId: transaction.userId,
        });
      }
    }
  }

  private async processClaimRewardConfirmation(transaction: Transaction): Promise<void> {
    // Reward claiming is handled by the event listener service
    this.logger.log(`Reward claim confirmed for transaction ${transaction.id}`);
  }

  private getTransactionTypeLabel(type: TransactionType): string {
    const labels = {
      [TransactionType.CREATE_SESSION]: 'Session Creation',
      [TransactionType.REGISTER_PARTICIPANT]: 'Participant Registration',
      [TransactionType.SUBMIT_CONTRIBUTION]: 'Contribution Submission',
      [TransactionType.COMPLETE_SESSION]: 'Session Completion',
      [TransactionType.CLAIM_REWARD]: 'Reward Claim',
      [TransactionType.DISTRIBUTE_REWARDS]: 'Reward Distribution',
    };
    return labels[type] || type;
  }

  // Public query methods
  async getTransactionsByUser(
    userId: string,
    options: {
      status?: TransactionStatus;
      type?: TransactionType;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const query = this.transactionRepository.createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC');

    if (options.status) {
      query.andWhere('transaction.status = :status', { status: options.status });
    }

    if (options.type) {
      query.andWhere('transaction.type = :type', { type: options.type });
    }

    if (options.limit) {
      query.limit(options.limit);
    }

    if (options.offset) {
      query.offset(options.offset);
    }

    const [transactions, total] = await query.getManyAndCount();
    return { transactions, total };
  }

  async getTransactionsBySession(
    sessionId: string
  ): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { trainingSessionId: sessionId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { 
        status: TransactionStatus.SUBMITTED,
      },
      order: { submittedAt: 'ASC' },
    });
  }

  async retryFailedTransactions(): Promise<void> {
    const failedTransactions = await this.transactionRepository.find({
      where: { status: TransactionStatus.FAILED },
      order: { failedAt: 'ASC' },
      take: 10,
    });

    for (const transaction of failedTransactions) {
      if (transaction.retryCount < 3) {
        transaction.retryCount += 1;
        transaction.status = TransactionStatus.SUBMITTED;
        await this.transactionRepository.save(transaction);
        
        // Restart monitoring
        this.monitorTransaction(transaction.id);
      }
    }
  }
}