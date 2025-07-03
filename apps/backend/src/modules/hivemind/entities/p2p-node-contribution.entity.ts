import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { P2PNode } from './p2p-node.entity';
import { TrainingSession } from '../../training/entities/training-session.entity';

@Entity('p2p_node_contributions')
@Index(['nodeId', 'sessionId'])
@Index(['sessionId'])
@Index(['contributionScore'])
@Index(['createdAt'])
export class P2PNodeContribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nodeId: string;

  @Column('uuid')
  sessionId: string;

  @Column({ type: 'bigint' })
  computeTime: string;

  @Column({ type: 'int', default: 0 })
  gradientQuality: number;

  @Column({ type: 'bigint' })
  dataTransmitted: string;

  @Column({ type: 'int', default: 100 })
  uptimeRatio: number;

  @Column({ type: 'bigint' })
  contributionScore: string;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: '0' })
  rewardEarned: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    gradientHash?: string;
    checkpointUsed?: string;
    computeEnvironment?: {
      cpu?: string;
      memory?: string;
      gpu?: string;
    };
    networkMetrics?: {
      bandwidth?: number;
      latency?: number;
      packetLoss?: number;
    };
  };

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationMethod: string;

  @Column({ nullable: true })
  blockchainTxHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => P2PNode, node => node.contributions)
  @JoinColumn({ name: 'nodeId', referencedColumnName: 'nodeId' })
  node: P2PNode;

  @ManyToOne(() => TrainingSession, { nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session: TrainingSession;

  // Virtual properties
  get qualityTier(): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
    if (this.gradientQuality >= 90) return 'EXCELLENT';
    if (this.gradientQuality >= 75) return 'GOOD';
    if (this.gradientQuality >= 60) return 'FAIR';
    return 'POOR';
  }

  get performanceScore(): number {
    // Weighted performance score
    const computeWeight = 0.3;
    const qualityWeight = 0.4;
    const uptimeWeight = 0.3;

    const normalizedCompute = Math.min(parseInt(this.computeTime) / 3600, 100); // Cap at 1 hour
    const normalizedQuality = this.gradientQuality;
    const normalizedUptime = this.uptimeRatio;

    return Math.round(
      normalizedCompute * computeWeight +
      normalizedQuality * qualityWeight +
      normalizedUptime * uptimeWeight
    );
  }

  get isHighQuality(): boolean {
    return this.gradientQuality >= 80 && this.uptimeRatio >= 90;
  }
}