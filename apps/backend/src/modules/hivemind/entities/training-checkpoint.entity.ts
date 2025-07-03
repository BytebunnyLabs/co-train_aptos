import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CheckpointType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  FAILURE_RECOVERY = 'failure_recovery',
  SESSION_END = 'session_end',
}

@Entity('training_checkpoints')
@Index(['sessionId'])
@Index(['checkpointType'])
@Index(['createdAt'])
@Index(['isValid'])
export class TrainingCheckpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  checkpointId: string;

  @Column({
    type: 'enum',
    enum: CheckpointType,
    default: CheckpointType.AUTOMATIC,
  })
  checkpointType: CheckpointType;

  @Column({ type: 'text' })
  modelStateHash: string;

  @Column({ type: 'jsonb' })
  gradientAggregation: {
    totalGradients: number;
    avgQuality: number;
    participantCount: number;
    aggregationMethod: string;
  };

  @Column({ type: 'jsonb' })
  participantStates: {
    [nodeId: string]: {
      lastContribution: Date;
      contributionScore: number;
      status: string;
    };
  };

  @Column({ type: 'bigint', nullable: true })
  blockHeight: string;

  @Column({ nullable: true })
  blockchainTxHash: string;

  @Column({ type: 'jsonb', nullable: true })
  networkSnapshot: {
    totalNodes: number;
    activeNodes: number;
    networkHealth: number;
    avgLatency: number;
  };

  @Column({ type: 'boolean', default: true })
  isValid: boolean;

  @Column({ nullable: true })
  invalidationReason: string;

  @Column({ type: 'int', default: 0 })
  restoreCount: number;

  @Column({ nullable: true })
  parentCheckpointId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    modelVersion?: string;
    epoch?: number;
    trainingLoss?: number;
    validationLoss?: number;
    accuracy?: number;
    fileSize?: number;
    compressionRatio?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get age(): number {
    return Date.now() - this.createdAt.getTime();
  }

  get isRecent(): boolean {
    const thirtyMinutes = 30 * 60 * 1000;
    return this.age < thirtyMinutes;
  }

  get qualityScore(): number {
    if (!this.gradientAggregation) return 0;
    
    const qualityWeight = 0.4;
    const participantWeight = 0.3;
    const validityWeight = 0.3;

    const qualityScore = this.gradientAggregation.avgQuality || 0;
    const participantScore = Math.min(this.gradientAggregation.participantCount * 10, 100);
    const validityScore = this.isValid ? 100 : 0;

    return Math.round(
      qualityScore * qualityWeight +
      participantScore * participantWeight +
      validityScore * validityWeight
    );
  }
}