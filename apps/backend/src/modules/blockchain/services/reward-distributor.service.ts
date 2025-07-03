import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';
import { Reward, RewardStatus } from '../entities/reward.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { User } from '../../users/entities/user.entity';
import { TransactionManagerService } from './transaction-manager.service';
import { WebSocketService } from '../../websocket/websocket.service';
import { getContractAddress, CONTRACT_FUNCTIONS } from '../constants/contract-addresses';

export interface BatchClaimRequest {
  userId: string;
  rewardIds: string[];
  userAddress: string;
}

export interface BatchDistributionRequest {
  sessionId: string;
  distributions: {
    userAddress: string;
    amount: number;
    rewardType: string;
  }[];
}

@Injectable()
export class RewardDistributorService {
  private readonly logger = new Logger(RewardDistributorService.name);
  private aptos: Aptos;
  private contractAddress: string;
  private adminAccount: Account;

  constructor(
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private transactionManager: TransactionManagerService,
    private webSocketService: WebSocketService,
    private configService: ConfigService,
  ) {
    this.initializeService();
  }

  private async initializeService() {
    try {
      const networkName = this.configService.get<string>('APTOS_NETWORK') || 'testnet';
      const aptosConfig = new AptosConfig({ network: networkName as Network });
      this.aptos = new Aptos(aptosConfig);
      
      this.contractAddress = this.configService.get<string>('APTOS_CONTRACT_ADDRESS') || getContractAddress(networkName as any);
      
      const adminPrivateKey = this.configService.get<string>('APTOS_ADMIN_PRIVATE_KEY');
      if (adminPrivateKey) {
        const privateKey = new Ed25519PrivateKey(adminPrivateKey);
        this.adminAccount = Account.fromPrivateKey({ privateKey });
      }
    } catch (error) {
      this.logger.error('Failed to initialize reward distributor service:', error);
    }
  }

  async claimReward(rewardId: string, userAddress: string): Promise<Transaction> {
    try {
      this.logger.log(`Processing reward claim for reward ${rewardId}`);

      // Get reward details
      const reward = await this.rewardRepository.findOne({
        where: { id: rewardId },
        relations: ['user', 'trainingSession'],
      });

      if (!reward) {
        throw new Error(`Reward ${rewardId} not found`);
      }

      if (reward.status !== RewardStatus.CLAIMABLE) {
        throw new Error(`Reward ${rewardId} is not claimable`);
      }

      if (!reward.isClaimable) {
        throw new Error(`Reward ${rewardId} has expired or is not available for claiming`);
      }

      if (reward.user.walletAddress !== userAddress) {
        throw new Error('User address does not match reward recipient');
      }

      // Create transaction record
      const transaction = await this.transactionManager.createTransaction({
        userId: reward.userId,
        type: TransactionType.CLAIM_REWARD,
        payload: {
          function: `${this.contractAddress}::training_rewards::${CONTRACT_FUNCTIONS.CLAIM_REWARD}`,
          arguments: [
            reward.trainingSessionId,
            userAddress,
            parseFloat(reward.amount),
          ],
        },
        trainingSessionId: reward.trainingSessionId,
        amount: reward.amount,
        toAddress: userAddress,
      });

      // Submit to blockchain
      await this.submitClaimTransaction(transaction, reward);

      return transaction;
    } catch (error) {
      this.logger.error(`Failed to claim reward ${rewardId}:`, error);
      throw error;
    }
  }

  async batchClaimRewards(request: BatchClaimRequest): Promise<Transaction[]> {
    try {
      this.logger.log(`Processing batch claim for ${request.rewardIds.length} rewards`);

      // Validate rewards
      const rewards = await this.rewardRepository.find({
        where: {
          id: In(request.rewardIds),
          userId: request.userId,
          status: RewardStatus.CLAIMABLE,
        },
        relations: ['user', 'trainingSession'],
      });

      if (rewards.length !== request.rewardIds.length) {
        throw new Error('Some rewards are not available for claiming');
      }

      // Check if all rewards belong to the same user
      const invalidRewards = rewards.filter(r => r.user.walletAddress !== request.userAddress);
      if (invalidRewards.length > 0) {
        throw new Error('User address does not match reward recipients');
      }

      // Check if all rewards are claimable
      const unclaimableRewards = rewards.filter(r => !r.isClaimable);
      if (unclaimableRewards.length > 0) {
        throw new Error('Some rewards have expired or are not claimable');
      }

      // Calculate total amount
      const totalAmount = rewards.reduce((sum, reward) => sum + parseFloat(reward.amount), 0);

      // Create batch transaction record
      const transaction = await this.transactionManager.createTransaction({
        userId: request.userId,
        type: TransactionType.CLAIM_REWARD,
        payload: {
          function: `${this.contractAddress}::training_rewards::${CONTRACT_FUNCTIONS.BATCH_CLAIM_REWARDS}`,
          arguments: [
            request.rewardIds,
            request.userAddress,
            totalAmount,
          ],
        },
        amount: totalAmount.toString(),
        toAddress: request.userAddress,
      });

      // Submit to blockchain
      await this.submitBatchClaimTransaction(transaction, rewards);

      return [transaction];
    } catch (error) {
      this.logger.error(`Failed to batch claim rewards:`, error);
      throw error;
    }
  }

  async distributeSessionRewards(request: BatchDistributionRequest): Promise<Transaction[]> {
    try {
      this.logger.log(`Distributing rewards for session ${request.sessionId}`);

      if (!this.adminAccount) {
        throw new Error('Admin account not configured');
      }

      const transactions: Transaction[] = [];

      // Group distributions by user for batch processing
      const userDistributions = new Map<string, typeof request.distributions[0][]>();
      
      for (const distribution of request.distributions) {
        const existing = userDistributions.get(distribution.userAddress) || [];
        existing.push(distribution);
        userDistributions.set(distribution.userAddress, existing);
      }

      // Create distribution transactions
      for (const [userAddress, distributions] of userDistributions) {
        const user = await this.userRepository.findOne({
          where: { walletAddress: userAddress },
        });

        if (!user) {
          this.logger.warn(`User not found for address: ${userAddress}`);
          continue;
        }

        const totalAmount = distributions.reduce((sum, d) => sum + d.amount, 0);

        // Create transaction record
        const transaction = await this.transactionManager.createTransaction({
          userId: user.id,
          type: TransactionType.DISTRIBUTE_REWARDS,
          payload: {
            function: `${this.contractAddress}::training_rewards::${CONTRACT_FUNCTIONS.DISTRIBUTE_REWARDS}`,
            arguments: [
              request.sessionId,
              userAddress,
              totalAmount,
              distributions.map(d => d.rewardType),
            ],
          },
          trainingSessionId: request.sessionId,
          amount: totalAmount.toString(),
          fromAddress: this.adminAccount.accountAddress.toString(),
          toAddress: userAddress,
        });

        transactions.push(transaction);

        // Submit to blockchain
        await this.submitDistributionTransaction(transaction, distributions);
      }

      this.logger.log(`Created ${transactions.length} distribution transactions`);
      return transactions;
    } catch (error) {
      this.logger.error(`Failed to distribute session rewards:`, error);
      throw error;
    }
  }

  private async submitClaimTransaction(transaction: Transaction, reward: Reward): Promise<void> {
    try {
      // Build Aptos transaction
      const aptosTransaction = await this.aptos.transaction.build.simple({
        sender: reward.user.walletAddress,
        data: {
          function: transaction.payload.function as `${string}::${string}::${string}`,
          functionArguments: transaction.payload.arguments,
        },
      });

      // Note: In a real implementation, this would require the user's signature
      // For now, we'll use a simulated hash and update the reward status
      const simulatedHash = `claim_${transaction.id}_${Date.now()}`;

      // Update transaction with hash
      await this.transactionManager.submitTransaction(transaction.id, simulatedHash);

      // Update reward status
      reward.status = RewardStatus.CLAIMED;
      reward.claimedAt = new Date();
      reward.claimTransactionId = transaction.id;
      await this.rewardRepository.save(reward);

      // Emit WebSocket notification
      this.webSocketService.emitNotification({
        userId: reward.userId,
        type: 'success',
        title: 'Reward Claimed',
        message: `Successfully claimed ${reward.amount} APT tokens`,
        data: {
          rewardId: reward.id,
          amount: reward.amount,
          transactionHash: simulatedHash,
        },
      });

      this.logger.log(`Reward claim transaction submitted: ${simulatedHash}`);
    } catch (error) {
      this.logger.error('Failed to submit claim transaction:', error);
      throw error;
    }
  }

  private async submitBatchClaimTransaction(transaction: Transaction, rewards: Reward[]): Promise<void> {
    try {
      // Build Aptos transaction for batch claim
      const userAddress = rewards[0].user.walletAddress;
      
      // Note: This is a simplified implementation
      // In practice, this would require proper batch transaction handling
      const simulatedHash = `batch_claim_${transaction.id}_${Date.now()}`;

      // Update transaction with hash
      await this.transactionManager.submitTransaction(transaction.id, simulatedHash);

      // Update all rewards status
      const totalAmount = rewards.reduce((sum, reward) => sum + parseFloat(reward.amount), 0);
      
      for (const reward of rewards) {
        reward.status = RewardStatus.CLAIMED;
        reward.claimedAt = new Date();
        reward.claimTransactionId = transaction.id;
        await this.rewardRepository.save(reward);
      }

      // Emit WebSocket notification
      this.webSocketService.emitNotification({
        userId: rewards[0].userId,
        type: 'success',
        title: 'Batch Claim Successful',
        message: `Successfully claimed ${rewards.length} rewards totaling ${totalAmount.toFixed(2)} APT tokens`,
        data: {
          rewardCount: rewards.length,
          totalAmount,
          transactionHash: simulatedHash,
        },
      });

      this.logger.log(`Batch claim transaction submitted: ${simulatedHash}`);
    } catch (error) {
      this.logger.error('Failed to submit batch claim transaction:', error);
      throw error;
    }
  }

  private async submitDistributionTransaction(
    transaction: Transaction,
    distributions: { userAddress: string; amount: number; rewardType: string }[]
  ): Promise<void> {
    try {
      if (!this.adminAccount) {
        throw new Error('Admin account not configured');
      }

      // Build Aptos transaction
      const aptosTransaction = await this.aptos.transaction.build.simple({
        sender: this.adminAccount.accountAddress,
        data: {
          function: transaction.payload.function as `${string}::${string}::${string}`,
          functionArguments: transaction.payload.arguments,
        },
      });

      // Sign and submit transaction
      const committedTransaction = await this.aptos.signAndSubmitTransaction({
        signer: this.adminAccount,
        transaction: aptosTransaction,
      });

      // Update transaction with hash
      await this.transactionManager.submitTransaction(transaction.id, committedTransaction.hash);

      // Emit WebSocket notification
      this.webSocketService.emitNotification({
        userId: transaction.userId,
        type: 'success',
        title: 'Rewards Distributed',
        message: `Rewards have been distributed to your wallet`,
        data: {
          sessionId: transaction.trainingSessionId,
          distributions,
          transactionHash: committedTransaction.hash,
        },
      });

      this.logger.log(`Distribution transaction submitted: ${committedTransaction.hash}`);
    } catch (error) {
      this.logger.error('Failed to submit distribution transaction:', error);
      throw error;
    }
  }

  async getClaimableRewards(userId: string): Promise<Reward[]> {
    return this.rewardRepository.find({
      where: {
        userId,
        status: RewardStatus.CLAIMABLE,
      },
      relations: ['trainingSession'],
      order: { createdAt: 'DESC' },
    });
  }

  async getClaimableRewardsBySession(sessionId: string): Promise<Reward[]> {
    return this.rewardRepository.find({
      where: {
        trainingSessionId: sessionId,
        status: RewardStatus.CLAIMABLE,
      },
      relations: ['user', 'trainingSession'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTotalClaimableAmount(userId: string): Promise<number> {
    const rewards = await this.getClaimableRewards(userId);
    return rewards
      .filter(r => r.isClaimable)
      .reduce((sum, reward) => sum + parseFloat(reward.amount), 0);
  }
}