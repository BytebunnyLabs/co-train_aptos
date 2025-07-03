import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum NetworkEventType {
  NODE_JOINED = 'node_joined',
  NODE_LEFT = 'node_left',
  NODE_FAILED = 'node_failed',
  NODE_RECOVERED = 'node_recovered',
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',
  CHECKPOINT_CREATED = 'checkpoint_created',
  REWARD_DISTRIBUTED = 'reward_distributed',
  GRADIENT_RECEIVED = 'gradient_received',
  GRADIENT_AGGREGATED = 'gradient_aggregated',
  NETWORK_PARTITION = 'network_partition',
  NETWORK_HEALED = 'network_healed',
}

export enum EventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

@Entity('network_events')
@Index(['eventType'])
@Index(['severity'])
@Index(['nodeId'])
@Index(['sessionId'])
@Index(['createdAt'])
export class NetworkEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NetworkEventType,
  })
  eventType: NetworkEventType;

  @Column({
    type: 'enum',
    enum: EventSeverity,
    default: EventSeverity.INFO,
  })
  severity: EventSeverity;

  @Column({ nullable: true })
  nodeId: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb' })
  eventData: {
    [key: string]: any;
  };

  @Column({ nullable: true })
  correlationId: string;

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean;

  @Column({ nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  processedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metrics: {
    networkHealth?: number;
    activeNodes?: number;
    totalNodes?: number;
    avgLatency?: number;
    throughput?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  // Virtual properties
  get age(): number {
    return Date.now() - this.createdAt.getTime();
  }

  get isRecent(): boolean {
    const fiveMinutes = 5 * 60 * 1000;
    return this.age < fiveMinutes;
  }

  get isCritical(): boolean {
    return this.severity === EventSeverity.CRITICAL || this.severity === EventSeverity.ERROR;
  }
}