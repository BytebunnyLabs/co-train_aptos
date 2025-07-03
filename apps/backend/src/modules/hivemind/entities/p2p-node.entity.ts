import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { P2PNodeContribution } from './p2p-node-contribution.entity';

export enum NodeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  QUARANTINED = 'quarantined',
  MAINTENANCE = 'maintenance',
}

@Entity('p2p_nodes')
@Index(['nodeId'], { unique: true })
@Index(['status'])
@Index(['reputationScore'])
@Index(['isActive'])
export class P2PNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nodeId: string;

  @Column()
  peerAddress: string;

  @Column({ type: 'text' })
  publicKey: string;

  @Column({ type: 'bigint' })
  computeCapacity: string;

  @Column({ type: 'bigint' })
  bandwidth: string;

  @Column({ type: 'int', default: 100 })
  reputationScore: number;

  @Column({ type: 'bigint', default: '0' })
  totalContributions: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: NodeStatus,
    default: NodeStatus.ACTIVE,
  })
  status: NodeStatus;

  @Column({ nullable: true })
  lastSeen: Date;

  @Column({ type: 'jsonb', nullable: true })
  networkInfo: {
    multiaddrs?: string[];
    protocols?: string[];
    connectionCount?: number;
    latency?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  performanceMetrics: {
    avgComputeTime?: number;
    avgGradientQuality?: number;
    avgUptimeRatio?: number;
    totalSessions?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  failureHistory: Array<{
    type: string;
    timestamp: Date;
    details: any;
  }>;

  @Column({ nullable: true })
  quarantineReason: string;

  @Column({ nullable: true })
  quarantineUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => P2PNodeContribution, contribution => contribution.node)
  contributions: P2PNodeContribution[];

  // Virtual properties
  get isOnline(): boolean {
    if (!this.lastSeen) return false;
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    return this.lastSeen > fiveMinutesAgo && this.isActive;
  }

  get isReliable(): boolean {
    return this.reputationScore >= 80 && this.status === NodeStatus.ACTIVE;
  }

  get avgPerformanceScore(): number {
    if (!this.performanceMetrics) return 0;
    const metrics = this.performanceMetrics;
    return Math.round(
      ((metrics.avgGradientQuality || 0) * 0.5 +
       (metrics.avgUptimeRatio || 0) * 0.3 +
       (metrics.avgComputeTime || 0) * 0.2)
    );
  }
}