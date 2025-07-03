import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';
import { CreateSessionDto } from './dto/create-session.dto';
import { RegisterParticipantDto } from './dto/register-participant.dto';
import { SubmitContributionDto } from './dto/submit-contribution.dto';
import { TransactionResponse } from './dto/transaction-response.dto';
import { SessionDetails, ParticipantInfo, GlobalStats } from './interfaces/contract-interaction.interface';
import { getContractAddress, getNetworkConfig, CONTRACT_FUNCTIONS, CONTRACT_RESOURCES, OCTAS_PER_APT } from './constants/contract-addresses';
import { createSuccessResponse, createFailureResponse, executeWithRetry } from './utils/transaction-helper';
import { isValidAptosAddress, normalizeAptosAddress } from './utils/address-validator';
import { TransactionManagerService } from './services/transaction-manager.service';
import { TransactionType } from './entities/transaction.entity';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private aptos: Aptos;
  private contractAddress: string;
  private adminAccount: Account;
  private network: Network;

  constructor(
    private configService: ConfigService,
    private transactionManager: TransactionManagerService,
  ) {}

  /**
   * Initialize the service when module starts
   */
  async onModuleInit() {
    await this.initializeAptosClient();
  }

  /**
   * Initialize Aptos client and admin account
   */
  private async initializeAptosClient() {
    try {
      // Get network configuration
      const networkName = this.configService.get<string>('APTOS_NETWORK') || 'testnet';
      this.network = networkName as Network;
      
      // Initialize Aptos client
      const aptosConfig = new AptosConfig({ network: this.network });
      this.aptos = new Aptos(aptosConfig);
      
      // Get contract address
      this.contractAddress = this.configService.get<string>('APTOS_CONTRACT_ADDRESS') || getContractAddress(networkName as any);
      
      // Initialize admin account if private key is provided
      const adminPrivateKey = this.configService.get<string>('APTOS_ADMIN_PRIVATE_KEY');
      if (adminPrivateKey) {
        const privateKey = new Ed25519PrivateKey(adminPrivateKey);
        this.adminAccount = Account.fromPrivateKey({ privateKey });
      }

      this.logger.log(`Aptos client initialized successfully on ${this.network}`);
      this.logger.log(`Contract address: ${this.contractAddress}`);
    } catch (error) {
      this.logger.error('Failed to initialize Aptos client:', error);
      throw error;
    }
  }

  /**
   * Create a new training session on the blockchain
   */
  async createSession(params: CreateSessionDto & { userId: string; trainingSessionId?: string }): Promise<TransactionResponse> {
    try {
      this.logger.log(`Creating training session: ${params.name}`);
      
      // Validate admin account
      if (!this.adminAccount) {
        throw new Error('Admin account not configured');
      }

      // Validate parameters
      if (!params.name || params.rewardAmount <= 0 || params.maxParticipants <= 0) {
        throw new Error('Invalid session parameters');
      }

      // Create transaction record first
      const transaction = await this.transactionManager.createTransaction({
        userId: params.userId,
        type: TransactionType.CREATE_SESSION,
        payload: {
          function: `${this.contractAddress}::training_rewards::${CONTRACT_FUNCTIONS.CREATE_SESSION}`,
          arguments: [
            params.name,
            params.rewardAmount,
            params.maxParticipants,
            params.description || '',
            params.duration || 0,
          ],
        },
        trainingSessionId: params.trainingSessionId,
        amount: params.rewardAmount.toString(),
        fromAddress: this.adminAccount.accountAddress.toString(),
      });

      // Execute with retry logic
      return await executeWithRetry(async () => {
        // Build transaction
        const aptosTransaction = await this.aptos.transaction.build.simple({
          sender: this.adminAccount.accountAddress,
          data: {
            function: `${this.contractAddress}::training_rewards::${CONTRACT_FUNCTIONS.CREATE_SESSION}`,
            functionArguments: [
              params.name,
              params.rewardAmount,
              params.maxParticipants,
              params.description || '',
              params.duration || 0,
            ],
          },
        });

        // Sign and submit transaction
        const committedTransaction = await this.aptos.signAndSubmitTransaction({
          signer: this.adminAccount,
          transaction: aptosTransaction,
        });
        
        // Update transaction record with hash
        await this.transactionManager.submitTransaction(transaction.id, committedTransaction.hash);
        
        this.logger.log(`Training session created successfully: ${committedTransaction.hash}`);
        
        return createSuccessResponse(
          committedTransaction.hash,
          'Training session created successfully',
          { 
            sessionId: committedTransaction.hash,
            transactionId: transaction.id,
          }
        );
      });
    } catch (error) {
      this.logger.error('Failed to create training session:', error);
      return createFailureResponse(
        '',
        `Failed to create session: ${error.message}`,
        { error: error.message }
      );
    }
  }

  /**
   * Register a participant for a training session
   */
  async registerParticipant(params: RegisterParticipantDto): Promise<TransactionResponse> {
    try {
      this.logger.log(`Registering participant ${params.participantAddress} for session ${params.sessionId}`);
      
      // Validate admin account
      if (!this.adminAccount) {
        throw new Error('Admin account not configured');
      }

      // Validate addresses
      if (!isValidAptosAddress(params.participantAddress)) {
        throw new Error('Invalid participant address');
      }

      const normalizedAddress = normalizeAptosAddress(params.participantAddress);

      // Execute with retry logic
      return await executeWithRetry(async () => {
        // Build transaction
        const transaction = await this.aptos.transaction.build.simple({
          sender: this.adminAccount.accountAddress,
          data: {
            function: `${this.contractAddress}::training_rewards::${CONTRACT_FUNCTIONS.REGISTER_PARTICIPANT}`,
            functionArguments: [
              params.sessionId,
              normalizedAddress,
            ],
          },
        });

        // Sign and submit transaction
        const committedTransaction = await this.aptos.signAndSubmitTransaction({
          signer: this.adminAccount,
          transaction,
        });
        
        // Wait for transaction confirmation
        const executedTransaction = await this.aptos.waitForTransaction({
          transactionHash: committedTransaction.hash,
        });

        this.logger.log(`Participant registered successfully: ${committedTransaction.hash}`);
        
        return createSuccessResponse(
          committedTransaction.hash,
          'Participant registered successfully',
          { 
            sessionId: params.sessionId,
            participantAddress: normalizedAddress,
            gasUsed: executedTransaction.gas_used,
          }
        );
      });
    } catch (error) {
      this.logger.error('Failed to register participant:', error);
      return createFailureResponse(
        '',
        `Failed to register participant: ${error.message}`,
        { error: error.message }
      );
    }
  }

  /**
   * Submit a contribution for a participant
   */
  async submitContribution(params: SubmitContributionDto): Promise<TransactionResponse> {
    try {
      this.logger.log(`Submitting contribution for participant ${params.participantAddress} in session ${params.sessionId}`);
      
      // Validate admin account
      if (!this.adminAccount) {
        throw new Error('Admin account not configured');
      }

      // Validate parameters
      if (!isValidAptosAddress(params.participantAddress)) {
        throw new Error('Invalid participant address');
      }

      if (params.score < 0 || params.score > 100) {
        throw new Error('Score must be between 0 and 100');
      }

      const normalizedAddress = normalizeAptosAddress(params.participantAddress);

      // Execute with retry logic
      return await executeWithRetry(async () => {
        // Build transaction
        const transaction = await this.aptos.transaction.build.simple({
          sender: this.adminAccount.accountAddress,
          data: {
            function: `${this.contractAddress}::training_rewards::${CONTRACT_FUNCTIONS.SUBMIT_CONTRIBUTION}`,
            functionArguments: [
              params.sessionId,
              normalizedAddress,
              params.score,
              params.contributionHash || '',
              params.metadata || '',
            ],
          },
        });

        // Sign and submit transaction
        const committedTransaction = await this.aptos.signAndSubmitTransaction({
          signer: this.adminAccount,
          transaction,
        });
        
        // Wait for transaction confirmation
        const executedTransaction = await this.aptos.waitForTransaction({
          transactionHash: committedTransaction.hash,
        });

        this.logger.log(`Contribution submitted successfully: ${committedTransaction.hash}`);
        
        return createSuccessResponse(
          committedTransaction.hash,
          'Contribution submitted successfully',
          { 
            sessionId: params.sessionId,
            participantAddress: normalizedAddress,
            score: params.score,
            gasUsed: executedTransaction.gas_used,
          }
        );
      });
    } catch (error) {
      this.logger.error('Failed to submit contribution:', error);
      return createFailureResponse(
        '',
        `Failed to submit contribution: ${error.message}`,
        { error: error.message }
      );
    }
  }

  /**
   * Complete a training session and distribute rewards
   */
  async completeSession(sessionId: string): Promise<TransactionResponse> {
    try {
      this.logger.log(`Completing session ${sessionId}`);
      
      // Validate admin account
      if (!this.adminAccount) {
        throw new Error('Admin account not configured');
      }

      // Execute with retry logic
      return await executeWithRetry(async () => {
        // Build transaction
        const transaction = await this.aptos.transaction.build.simple({
          sender: this.adminAccount.accountAddress,
          data: {
            function: `${this.contractAddress}::training_rewards::${CONTRACT_FUNCTIONS.COMPLETE_SESSION}`,
            functionArguments: [sessionId],
          },
        });

        // Sign and submit transaction
        const committedTransaction = await this.aptos.signAndSubmitTransaction({
          signer: this.adminAccount,
          transaction,
        });
        
        // Wait for transaction confirmation
        const executedTransaction = await this.aptos.waitForTransaction({
          transactionHash: committedTransaction.hash,
        });

        this.logger.log(`Session completed successfully: ${committedTransaction.hash}`);
        
        return createSuccessResponse(
          committedTransaction.hash,
          'Session completed successfully',
          { 
            sessionId,
            gasUsed: executedTransaction.gas_used,
          }
        );
      });
    } catch (error) {
      this.logger.error('Failed to complete session:', error);
      return createFailureResponse(
        '',
        `Failed to complete session: ${error.message}`,
        { error: error.message }
      );
    }
  }

  /**
   * Get training session details
   */
  async getSessionDetails(sessionId: string): Promise<SessionDetails | null> {
    try {
      this.logger.log(`Getting session details for ${sessionId}`);
      
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Invalid session ID format');
      }

      // Get session resource from contract
      const sessionResource = await this.aptos.getAccountResource({
        accountAddress: this.contractAddress,
        resourceType: `${this.contractAddress}::training_rewards::${CONTRACT_RESOURCES.SESSION_STORE}`,
      });

      // Parse session data
      const sessionData = sessionResource.data as any;
      
      // Find specific session by ID
      const session = sessionData.sessions?.[sessionId];
      
      if (!session) {
        this.logger.warn(`Session not found: ${sessionId}`);
        return null;
      }

      // Transform to SessionDetails interface
      const sessionDetails: SessionDetails = {
        id: sessionId,
        name: session.name,
        description: session.description || '',
        rewardAmount: parseInt(session.reward_amount),
        maxParticipants: parseInt(session.max_participants),
        currentParticipants: session.participants?.length || 0,
        duration: parseInt(session.duration) || 0,
        status: session.status,
        createdAt: new Date(parseInt(session.created_at) * 1000),
        completedAt: session.completed_at ? new Date(parseInt(session.completed_at) * 1000) : undefined,
        creator: session.creator,
        participants: session.participants || [],
      };

      this.logger.log(`Session details retrieved: ${sessionId}`);
      return sessionDetails;
    } catch (error) {
      this.logger.error('Failed to get session details:', error);
      throw new Error(`Failed to get session details: ${error.message}`);
    }
  }

  /**
   * Get participant score for a specific session
   */
  async getParticipantScore(sessionId: string, participantAddress: string): Promise<number> {
    try {
      this.logger.log(`Getting participant score for ${participantAddress} in session ${sessionId}`);
      
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Invalid session ID format');
      }
      
      if (!isValidAptosAddress(participantAddress)) {
        throw new Error('Invalid participant address format');
      }

      const normalizedAddress = normalizeAptosAddress(participantAddress);

      // Get session resource from contract
      const sessionResource = await this.aptos.getAccountResource({
        accountAddress: this.contractAddress,
        resourceType: `${this.contractAddress}::training_rewards::${CONTRACT_RESOURCES.SESSION_STORE}`,
      });

      const sessionData = (sessionResource.data as any).sessions[sessionId];
      
      if (!sessionData) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const participantData = sessionData.participants.find(
        (p: any) => p.address === normalizedAddress,
      );

      if (!participantData) {
        throw new Error(`Participant ${normalizedAddress} not found in session ${sessionId}`);
      }

      const score = parseInt(participantData.score) || 0;
      
      this.logger.log(`Participant score retrieved: ${score} for ${normalizedAddress}`);
      return score;
    } catch (error) {
      this.logger.error('Failed to get participant score:', error);
      throw new Error(`Failed to get participant score: ${error.message}`);
    }
  }

  /**
   * Get total rewards distributed across all sessions
   */
  async getTotalRewardsDistributed(): Promise<number> {
    try {
      this.logger.log('Getting total rewards distributed');
      
      // Get global stats resource from contract
      const statsResource = await this.aptos.getAccountResource({
        accountAddress: this.contractAddress,
        resourceType: `${this.contractAddress}::training_rewards::${CONTRACT_RESOURCES.GLOBAL_STATS}`,
      });

      const statsData = statsResource.data as any;
      const totalRewards = parseInt(statsData.total_rewards_distributed || '0');
      
      this.logger.log(`Total rewards distributed: ${totalRewards}`);
      return totalRewards;
    } catch (error) {
      this.logger.error('Failed to get total rewards distributed:', error);
      throw new Error(`Failed to get total rewards distributed: ${error.message}`);
    }
  }

  /**
   * Health check method
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Check if Aptos client is initialized
      if (!this.aptos) {
        this.logger.warn('Aptos client not initialized');
        return false;
      }

      // Check network connectivity
      const ledgerInfo = await this.aptos.getLedgerInfo();
      
      // Check if admin account is configured
      if (!this.adminAccount) {
        this.logger.warn('Admin account not configured');
        return false;
      }

      // Check contract address configuration
      if (!this.contractAddress) {
        this.logger.warn('Contract address not configured');
        return false;
      }

      this.logger.log(`Blockchain service healthy - Chain ID: ${ledgerInfo.chain_id}, Ledger version: ${ledgerInfo.ledger_version}`);
      return true;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<any> {
    try {
      const ledgerInfo = await this.aptos.getLedgerInfo();
      return {
        chainId: ledgerInfo.chain_id,
        ledgerVersion: ledgerInfo.ledger_version,
        ledgerTimestamp: ledgerInfo.ledger_timestamp,
        network: this.configService.get('APTOS_NETWORK', 'testnet'),
        contractAddress: this.contractAddress,
      };
    } catch (error) {
      this.logger.error('Failed to get network info:', error);
      throw new Error(`Failed to get network info: ${error.message}`);
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(address: string): Promise<number> {
    try {
      if (!isValidAptosAddress(address)) {
        throw new Error('Invalid address format');
      }

      const resources = await this.aptos.getAccountResources({
        accountAddress: address,
      });

      const coinResource = resources.find(
        (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );

      if (!coinResource) {
        return 0;
      }

      const balance = parseFloat((coinResource.data as any).coin.value) / OCTAS_PER_APT;
      return balance;
    } catch (error) {
      this.logger.error('Failed to get account balance:', error);
      throw new Error(`Failed to get account balance: ${error.message}`);
    }
  }

  /**
   * Get reward statistics for an address
   */
  async getRewardStats(address: string): Promise<any> {
    try {
      this.logger.log(`Getting reward stats for address: ${address}`);
      
      if (!isValidAptosAddress(address)) {
        throw new Error('Invalid address format');
      }

      const normalizedAddress = normalizeAptosAddress(address);

      // Get participant resource from contract
      try {
        const participantResource = await this.aptos.getAccountResource({
          accountAddress: this.contractAddress,
          resourceType: `${this.contractAddress}::training_rewards::ParticipantStats`,
        });

        const participantData = (participantResource.data as any).participants?.[normalizedAddress];
        
        if (participantData) {
          return {
            totalRewards: parseInt(participantData.total_rewards || '0'),
            pendingRewards: parseInt(participantData.pending_rewards || '0'),
            claimedRewards: parseInt(participantData.claimed_rewards || '0'),
            participationCount: parseInt(participantData.participation_count || '0'),
            averageScore: parseFloat(participantData.average_score || '0'),
            lastClaimDate: participantData.last_claim_date ? new Date(parseInt(participantData.last_claim_date) * 1000) : null,
            rewardHistory: participantData.reward_history || [],
          };
        }
      } catch (resourceError) {
        this.logger.warn(`Participant resource not found for ${normalizedAddress}, returning default stats`);
      }

      // Return default stats if no data found
      return {
        totalRewards: 0,
        pendingRewards: 0,
        claimedRewards: 0,
        participationCount: 0,
        averageScore: 0,
        lastClaimDate: null,
        rewardHistory: [],
      };
    } catch (error) {
      this.logger.error('Failed to get reward stats:', error);
      throw new Error(`Failed to get reward stats: ${error.message}`);
    }
  }

  /**
   * Register a P2P node on the blockchain
   */
  async registerP2PNode(
    nodeId: string,
    publicKey: string,
    computeCapacity: number,
    bandwidth: number
  ): Promise<any> {
    try {
      this.logger.log(`Registering P2P node: ${nodeId}`);
      
      if (!nodeId || !publicKey) {
        throw new Error('Node ID and public key are required');
      }

      // Build transaction to register P2P node
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.adminAccount.accountAddress,
        data: {
          function: `${this.contractAddress}::p2p_network::register_node`,
          functionArguments: [
            nodeId,
            publicKey,
            computeCapacity,
            bandwidth,
          ],
        },
      });

      // Sign and submit transaction
      const committedTxn = await this.aptos.signAndSubmitTransaction({
        signer: this.adminAccount,
        transaction,
      });

      // Wait for transaction confirmation
      const executedTransaction = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      this.logger.log(`P2P node registered successfully: ${nodeId}, hash: ${executedTransaction.hash}`);
      
      return {
        success: true,
        transactionHash: executedTransaction.hash,
        nodeId,
        publicKey,
        computeCapacity,
        bandwidth,
      };
    } catch (error) {
      this.logger.error('Failed to register P2P node:', error);
      throw new Error(`Failed to register P2P node: ${error.message}`);
    }
  }
}