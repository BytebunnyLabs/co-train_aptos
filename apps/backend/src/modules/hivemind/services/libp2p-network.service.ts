import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createLibp2p, Libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { kadDHT, type KadDHT } from '@libp2p/kad-dht';
import { bootstrap } from '@libp2p/bootstrap';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { identify } from '@libp2p/identify';
import { multiaddr, type Multiaddr } from '@multiformats/multiaddr';
// import type { PeerId } from '@libp2p/interface';
type PeerId = any; // Temporary type definition

export interface P2PMessage {
  type: string;
  payload: any;
  timestamp: Date;
  sender: string;
  sessionId?: string;
}

interface TrainingGradient {
  sessionId: string;
  gradientData: ArrayBuffer;
  quality: number;
  nodeId: string;
}

@Injectable()
export class LibP2PNetworkService implements OnModuleDestroy {
  private readonly logger = new Logger(LibP2PNetworkService.name);
  private libp2p: Libp2p | null = null;
  private isInitialized = false;
  private connectedPeers = new Map<string, PeerId>();
  private messageHandlers = new Map<string, (message: P2PMessage) => void>();

  constructor(private eventEmitter: EventEmitter2) {
    this.setupMessageHandlers();
  }

  async initialize(port: number = 0, bootstrapPeers: string[] = []): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const libp2pOptions: any = {
        addresses: {
          listen: [
            `/ip4/0.0.0.0/tcp/${port}`,
            `/ip4/0.0.0.0/tcp/${port + 1}/ws`,
          ],
        },
        transports: [
          tcp(),
          webSockets(),
        ],
        connectionEncryption: [noise()],
        streamMuxers: [mplex()],
        services: {
          identify: identify(),
          dht: kadDHT({
            clientMode: false,
            validators: {},
            selectors: {},
          }),
        },
      };

      // Add bootstrap if peers are provided
      if (bootstrapPeers.length > 0) {
        libp2pOptions.peerDiscovery = [
          bootstrap({
            list: bootstrapPeers,
          }),
          pubsubPeerDiscovery({
            interval: 10000,
          }),
        ];
      }

      this.libp2p = await createLibp2p(libp2pOptions);

      // Setup event listeners
      this.setupEventListeners();

      // Start the node
      await this.libp2p.start();

      this.isInitialized = true;
      this.logger.log(`LibP2P node started with PeerID: ${this.libp2p.peerId.toString()}`);
      this.logger.log(`Listening on: ${this.libp2p.getMultiaddrs().map(ma => ma.toString()).join(', ')}`);

    } catch (error) {
      this.logger.error('Failed to initialize LibP2P network:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.libp2p) return;

    // Connection events
    this.libp2p.addEventListener('peer:connect', (event) => {
      const peerId = event.detail;
      this.connectedPeers.set(peerId.toString(), peerId);
      this.logger.log(`Peer connected: ${peerId.toString()}`);
      this.eventEmitter.emit('p2p.peer.connected', peerId.toString());
    });

    this.libp2p.addEventListener('peer:disconnect', (event) => {
      const peerId = event.detail;
      this.connectedPeers.delete(peerId.toString());
      this.logger.log(`Peer disconnected: ${peerId.toString()}`);
      this.eventEmitter.emit('p2p.peer.disconnected', peerId.toString());
    });

    // DHT events
    this.libp2p.addEventListener('peer:discovery', (event) => {
      const peerId = event.detail;
      this.logger.debug(`Peer discovered: ${peerId.toString()}`);
      this.eventEmitter.emit('p2p.peer.discovered', peerId.toString());
    });
  }

  private setupMessageHandlers(): void {
    this.messageHandlers.set('TRAINING_GRADIENT', this.handleTrainingGradient.bind(this));
    this.messageHandlers.set('TRAINING_METRICS', this.handleTrainingMetrics.bind(this));
    this.messageHandlers.set('NODE_HEARTBEAT', this.handleNodeHeartbeat.bind(this));
    this.messageHandlers.set('REWARD_NOTIFICATION', this.handleRewardNotification.bind(this));
  }

  async broadcastMessage(type: string, payload: any): Promise<void> {
    if (!this.libp2p || !this.isInitialized) {
      throw new Error('LibP2P network not initialized');
    }

    const message: P2PMessage = {
      type,
      payload,
      timestamp: new Date(),
      sender: this.libp2p.peerId.toString(),
    };

    const messageBuffer = Buffer.from(JSON.stringify(message));
    const connectedPeerIds = Array.from(this.connectedPeers.values());

    this.logger.debug(`Broadcasting ${type} message to ${connectedPeerIds.length} peers`);

    // Send to all connected peers
    for (const peerId of connectedPeerIds) {
      try {
        const stream = await this.libp2p.dialProtocol(peerId, '/cotrain/1.0.0');
        await stream.sink([messageBuffer]);
        await stream.close();
      } catch (error) {
        this.logger.warn(`Failed to send message to peer ${peerId.toString()}:`, error);
      }
    }
  }

  async sendDirectMessage(peerId: string, type: string, payload: any): Promise<void> {
    if (!this.libp2p || !this.isInitialized) {
      throw new Error('LibP2P network not initialized');
    }

    const targetPeer = this.connectedPeers.get(peerId);
    if (!targetPeer) {
      throw new Error(`Peer ${peerId} not connected`);
    }

    const message: P2PMessage = {
      type,
      payload,
      timestamp: new Date(),
      sender: this.libp2p.peerId.toString(),
    };

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const stream = await this.libp2p.dialProtocol(targetPeer, '/cotrain/1.0.0');
      await stream.sink([messageBuffer]);
      await stream.close();

      this.logger.debug(`Sent ${type} message to peer ${peerId}`);
    } catch (error) {
      this.logger.error(`Failed to send direct message to ${peerId}:`, error);
      throw error;
    }
  }

  async storeInDHT(key: string, value: any): Promise<void> {
    if (!this.libp2p || !this.isInitialized) {
      throw new Error('LibP2P network not initialized');
    }

    try {
      const dht = this.libp2p.services.dht as KadDHT;
      if (!dht) {
        throw new Error('DHT service not available');
      }

      const keyBuffer = Buffer.from(key);
      const valueBuffer = Buffer.from(JSON.stringify(value));

      await dht.put(keyBuffer, valueBuffer);
      this.logger.debug(`Stored data in DHT with key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to store in DHT:`, error);
      throw error;
    }
  }

  async getFromDHT(key: string): Promise<any> {
    if (!this.libp2p || !this.isInitialized) {
      throw new Error('LibP2P network not initialized');
    }

    try {
      const dht = this.libp2p.services.dht as KadDHT;
      if (!dht) {
        throw new Error('DHT service not available');
      }

      const keyBuffer = Buffer.from(key);
      
      for await (const event of dht.get(keyBuffer)) {
        if (event.name === 'VALUE') {
          const value = JSON.parse(event.value.toString());
          this.logger.debug(`Retrieved data from DHT with key: ${key}`);
          return value;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get from DHT:`, error);
      throw error;
    }
  }

  async connectToPeer(peerAddress: string): Promise<void> {
    if (!this.libp2p || !this.isInitialized) {
      throw new Error('LibP2P network not initialized');
    }

    try {
      const ma = multiaddr(peerAddress);
      await this.libp2p.dial(ma);
      this.logger.log(`Connected to peer: ${peerAddress}`);
    } catch (error) {
      this.logger.error(`Failed to connect to peer ${peerAddress}:`, error);
      throw error;
    }
  }

  private async handleTrainingGradient(message: P2PMessage): Promise<void> {
    try {
      const gradient: TrainingGradient = message.payload;
      
      this.eventEmitter.emit('training.gradient.received', {
        sessionId: gradient.sessionId,
        gradientData: gradient.gradientData,
        quality: gradient.quality,
        nodeId: gradient.nodeId,
        timestamp: message.timestamp,
      });

      this.logger.debug(`Received training gradient from ${message.sender}`);
    } catch (error) {
      this.logger.error('Error handling training gradient:', error);
    }
  }

  private async handleTrainingMetrics(message: P2PMessage): Promise<void> {
    try {
      this.eventEmitter.emit('training.metrics.received', {
        metrics: message.payload,
        nodeId: message.sender,
        timestamp: message.timestamp,
      });

      this.logger.debug(`Received training metrics from ${message.sender}`);
    } catch (error) {
      this.logger.error('Error handling training metrics:', error);
    }
  }

  private async handleNodeHeartbeat(message: P2PMessage): Promise<void> {
    try {
      this.eventEmitter.emit('node.heartbeat.received', {
        nodeId: message.sender,
        timestamp: message.timestamp,
        status: message.payload,
      });

      this.logger.debug(`Received heartbeat from ${message.sender}`);
    } catch (error) {
      this.logger.error('Error handling node heartbeat:', error);
    }
  }

  private async handleRewardNotification(message: P2PMessage): Promise<void> {
    try {
      this.eventEmitter.emit('reward.notification.received', {
        nodeId: message.sender,
        reward: message.payload,
        timestamp: message.timestamp,
      });

      this.logger.debug(`Received reward notification from ${message.sender}`);
    } catch (error) {
      this.logger.error('Error handling reward notification:', error);
    }
  }

  getConnectedPeers(): string[] {
    return Array.from(this.connectedPeers.keys());
  }

  getPeerId(): string | null {
    return this.libp2p?.peerId.toString() || null;
  }

  getMultiaddrs(): string[] {
    if (!this.libp2p) return [];
    return this.libp2p.getMultiaddrs().map(ma => ma.toString());
  }

  async onModuleDestroy(): Promise<void> {
    if (this.libp2p && this.isInitialized) {
      try {
        await this.libp2p.stop();
        this.isInitialized = false;
        this.logger.log('LibP2P node stopped');
      } catch (error) {
        this.logger.error('Error stopping LibP2P node:', error);
      }
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.libp2p !== null;
  }

  getNetworkStats(): {
    peerId: string | null;
    connectedPeers: number;
    multiaddrs: string[];
    isReady: boolean;
  } {
    return {
      peerId: this.getPeerId(),
      connectedPeers: this.connectedPeers.size,
      multiaddrs: this.getMultiaddrs(),
      isReady: this.isReady(),
    };
  }
}