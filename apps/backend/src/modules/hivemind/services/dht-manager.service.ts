import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';

interface DHTEntry {
  key: string;
  value: any;
  timestamp: Date;
  ttl: number;
  nodeId: string;
}

interface PeerInfo {
  nodeId: string;
  address: string;
  port: number;
  lastSeen: Date;
  distance?: number;
}

@Injectable()
export class DHTManagerService {
  private readonly logger = new Logger(DHTManagerService.name);
  private readonly kBucketSize = 20;
  private readonly alpha = 3; // Concurrency parameter
  
  private dhtTable: Map<string, DHTEntry> = new Map();
  private routingTable: Map<string, PeerInfo[]> = new Map();
  private nodeId: string;
  private bootstrapNodes: PeerInfo[] = [];

  constructor(private eventEmitter: EventEmitter2) {
    this.nodeId = this.generateNodeId();
    this.initializeRoutingTable();
  }

  private generateNodeId(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  private initializeRoutingTable(): void {
    // Initialize k-buckets for routing table
    for (let i = 0; i < 160; i++) {
      this.routingTable.set(i.toString(), []);
    }
  }

  async initialize(bootstrapNodes?: PeerInfo[]): Promise<void> {
    if (bootstrapNodes) {
      this.bootstrapNodes = bootstrapNodes;
    }

    try {
      await this.bootstrap();
      this.startMaintenanceTasks();
      this.logger.log('DHT Manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize DHT Manager:', error);
      throw error;
    }
  }

  private async bootstrap(): Promise<void> {
    if (this.bootstrapNodes.length === 0) {
      this.logger.warn('No bootstrap nodes provided');
      return;
    }

    // Connect to bootstrap nodes
    for (const bootstrapNode of this.bootstrapNodes) {
      try {
        await this.ping(bootstrapNode);
        await this.addPeer(bootstrapNode);
        this.logger.log(`Connected to bootstrap node: ${bootstrapNode.nodeId}`);
      } catch (error) {
        this.logger.warn(`Failed to connect to bootstrap node ${bootstrapNode.nodeId}:`, error);
      }
    }

    // Perform initial lookup to populate routing table
    await this.lookupNode(this.nodeId);
  }

  private startMaintenanceTasks(): void {
    // Periodically refresh routing table
    setInterval(() => {
      this.refreshRoutingTable();
    }, 60000); // Every minute

    // Clean expired DHT entries
    setInterval(() => {
      this.cleanExpiredEntries();
    }, 30000); // Every 30 seconds

    // Ping peers to maintain connections
    setInterval(() => {
      this.maintainPeers();
    }, 120000); // Every 2 minutes
  }

  async store(key: string, value: any, ttl: number = 3600): Promise<void> {
    const keyHash = this.hashKey(key);
    const closestPeers = await this.findClosestPeers(keyHash, this.kBucketSize);

    const entry: DHTEntry = {
      key: keyHash,
      value,
      timestamp: new Date(),
      ttl,
      nodeId: this.nodeId,
    };

    // Store locally
    this.dhtTable.set(keyHash, entry);

    // Replicate to closest peers
    for (const peer of closestPeers) {
      try {
        await this.storeAtPeer(peer, entry);
      } catch (error) {
        this.logger.warn(`Failed to store at peer ${peer.nodeId}:`, error);
      }
    }

    this.eventEmitter.emit('dht.store', { key, value });
    this.logger.debug(`Stored key: ${key}`);
  }

  async retrieve(key: string): Promise<any> {
    const keyHash = this.hashKey(key);
    
    // Check local storage first
    const localEntry = this.dhtTable.get(keyHash);
    if (localEntry && !this.isExpired(localEntry)) {
      return localEntry.value;
    }

    // Query closest peers
    const closestPeers = await this.findClosestPeers(keyHash, this.alpha);
    
    for (const peer of closestPeers) {
      try {
        const value = await this.retrieveFromPeer(peer, keyHash);
        if (value !== null) {
          // Cache locally
          this.dhtTable.set(keyHash, {
            key: keyHash,
            value,
            timestamp: new Date(),
            ttl: 3600,
            nodeId: peer.nodeId,
          });
          return value;
        }
      } catch (error) {
        this.logger.warn(`Failed to retrieve from peer ${peer.nodeId}:`, error);
      }
    }

    return null;
  }

  async lookupNode(targetNodeId: string): Promise<PeerInfo[]> {
    const closestPeers = await this.findClosestPeers(targetNodeId, this.kBucketSize);
    const queriedPeers = new Set<string>();
    const candidates = new Set(closestPeers);

    while (candidates.size > 0) {
      const currentBatch = Array.from(candidates).slice(0, this.alpha);
      candidates.clear();

      for (const peer of currentBatch) {
        if (queriedPeers.has(peer.nodeId)) continue;
        
        try {
          const peerResponse = await this.findNodeAtPeer(peer, targetNodeId);
          queriedPeers.add(peer.nodeId);

          for (const newPeer of peerResponse) {
            if (!queriedPeers.has(newPeer.nodeId)) {
              candidates.add(newPeer);
            }
          }
        } catch (error) {
          this.logger.warn(`Node lookup failed for peer ${peer.nodeId}:`, error);
        }
      }
    }

    return Array.from(queriedPeers).map(nodeId => 
      closestPeers.find(p => p.nodeId === nodeId)!
    ).filter(Boolean);
  }

  private async findClosestPeers(targetId: string, count: number): Promise<PeerInfo[]> {
    const allPeers: PeerInfo[] = [];
    
    for (const bucket of this.routingTable.values()) {
      allPeers.push(...bucket);
    }

    return allPeers
      .map(peer => ({
        ...peer,
        distance: this.calculateDistance(targetId, peer.nodeId),
      }))
      .sort((a, b) => a.distance! - b.distance!)
      .slice(0, count);
  }

  private calculateDistance(id1: string, id2: string): number {
    // XOR distance calculation
    const buf1 = Buffer.from(id1, 'hex');
    const buf2 = Buffer.from(id2, 'hex');
    
    let distance = 0;
    for (let i = 0; i < Math.min(buf1.length, buf2.length); i++) {
      distance += this.popcount(buf1[i] ^ buf2[i]);
    }
    
    return distance;
  }

  private popcount(n: number): number {
    let count = 0;
    while (n) {
      count += n & 1;
      n >>= 1;
    }
    return count;
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha1').update(key).digest('hex');
  }

  private async addPeer(peer: PeerInfo): Promise<void> {
    const distance = this.calculateDistance(this.nodeId, peer.nodeId);
    const bucketIndex = Math.floor(Math.log2(distance + 1));
    const bucket = this.routingTable.get(bucketIndex.toString()) || [];

    // Remove if already exists
    const existingIndex = bucket.findIndex(p => p.nodeId === peer.nodeId);
    if (existingIndex >= 0) {
      bucket.splice(existingIndex, 1);
    }

    // Add to front (most recently seen)
    bucket.unshift(peer);

    // Maintain k-bucket size
    if (bucket.length > this.kBucketSize) {
      bucket.pop();
    }

    this.routingTable.set(bucketIndex.toString(), bucket);
    this.eventEmitter.emit('dht.peer.added', peer);
  }

  private async ping(peer: PeerInfo): Promise<boolean> {
    // Implementation would send actual ping message
    // For now, simulate ping
    peer.lastSeen = new Date();
    return true;
  }

  private async storeAtPeer(peer: PeerInfo, entry: DHTEntry): Promise<void> {
    // Implementation would send store message to peer
    this.logger.debug(`Storing at peer ${peer.nodeId}`);
  }

  private async retrieveFromPeer(peer: PeerInfo, key: string): Promise<any> {
    // Implementation would send retrieve message to peer
    this.logger.debug(`Retrieving from peer ${peer.nodeId}`);
    return null;
  }

  private async findNodeAtPeer(peer: PeerInfo, targetId: string): Promise<PeerInfo[]> {
    // Implementation would send find_node message to peer
    return [];
  }

  private isExpired(entry: DHTEntry): boolean {
    const now = new Date();
    const expiryTime = new Date(entry.timestamp.getTime() + entry.ttl * 1000);
    return now > expiryTime;
  }

  private cleanExpiredEntries(): void {
    for (const [key, entry] of this.dhtTable.entries()) {
      if (this.isExpired(entry)) {
        this.dhtTable.delete(key);
      }
    }
  }

  private async refreshRoutingTable(): Promise<void> {
    // Perform lookups for random keys in each bucket
    for (const [bucketIndex, bucket] of this.routingTable.entries()) {
      if (bucket.length === 0) {
        // Generate random key for this bucket and perform lookup
        const randomKey = this.generateRandomKeyForBucket(parseInt(bucketIndex));
        await this.lookupNode(randomKey);
      }
    }
  }

  private generateRandomKeyForBucket(bucketIndex: number): string {
    // Generate a random key that would fall into the specified bucket
    return crypto.randomBytes(20).toString('hex');
  }

  private async maintainPeers(): Promise<void> {
    const allPeers: PeerInfo[] = [];
    for (const bucket of this.routingTable.values()) {
      allPeers.push(...bucket);
    }

    for (const peer of allPeers) {
      try {
        const isAlive = await this.ping(peer);
        if (!isAlive) {
          await this.removePeer(peer.nodeId);
        }
      } catch (error) {
        this.logger.warn(`Failed to ping peer ${peer.nodeId}:`, error);
        await this.removePeer(peer.nodeId);
      }
    }
  }

  private async removePeer(nodeId: string): Promise<void> {
    for (const [bucketIndex, bucket] of this.routingTable.entries()) {
      const index = bucket.findIndex(p => p.nodeId === nodeId);
      if (index >= 0) {
        bucket.splice(index, 1);
        this.routingTable.set(bucketIndex, bucket);
        this.eventEmitter.emit('dht.peer.removed', { nodeId });
        break;
      }
    }
  }

  getNodeId(): string {
    return this.nodeId;
  }

  getRoutingTableStats(): { bucketIndex: number; peerCount: number }[] {
    return Array.from(this.routingTable.entries()).map(([bucketIndex, bucket]) => ({
      bucketIndex: parseInt(bucketIndex),
      peerCount: bucket.length,
    }));
  }

  getDHTStats(): { totalEntries: number; localEntries: number } {
    const localEntries = Array.from(this.dhtTable.values()).filter(
      entry => entry.nodeId === this.nodeId
    ).length;

    return {
      totalEntries: this.dhtTable.size,
      localEntries,
    };
  }
}