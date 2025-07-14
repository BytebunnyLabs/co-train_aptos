import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ModelArchitecture {
  TRANSFORMER = 'transformer',
  BERT = 'bert',
  GPT = 'gpt',
  LLAMA = 'llama',
  CUSTOM = 'custom',
}

export enum OptimizationType {
  ADAM = 'adam',
  ADAMW = 'adamw',
  SGD = 'sgd',
  RMSPROP = 'rmsprop',
}

export enum SchedulerType {
  LINEAR = 'linear',
  COSINE = 'cosine',
  EXPONENTIAL = 'exponential',
  STEP = 'step',
  NONE = 'none',
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export class HardwareConfig {
  @ApiPropertyOptional({ description: 'GPU设备ID列表', example: [0, 1] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  gpuIds?: number[];

  @ApiPropertyOptional({ description: 'CPU核心数', example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  cpuCores?: number;

  @ApiPropertyOptional({ description: '内存限制(GB)', example: 32 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  memoryLimit?: number;

  @ApiPropertyOptional({ description: '是否使用混合精度训练', example: true })
  @IsOptional()
  @IsBoolean()
  mixedPrecision?: boolean;
}

export class DistributedConfig {
  @ApiProperty({ description: '是否启用分布式训练', example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: '参与节点列表', example: ['node1:8080', 'node2:8080'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nodes?: string[];

  @ApiPropertyOptional({ description: '主节点地址', example: 'master:8080' })
  @IsOptional()
  @IsString()
  masterNode?: string;

  @ApiPropertyOptional({ description: '通信后端', example: 'nccl' })
  @IsOptional()
  @IsString()
  backend?: string;

  @ApiPropertyOptional({ description: '世界大小', example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  worldSize?: number;

  @ApiPropertyOptional({ description: '当前节点排名', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rank?: number;
}

export class DataConfig {
  @ApiProperty({ description: '数据集路径', example: '/data/training_dataset' })
  @IsString()
  datasetPath: string;

  @ApiPropertyOptional({ description: '验证集路径', example: '/data/validation_dataset' })
  @IsOptional()
  @IsString()
  validationPath?: string;

  @ApiPropertyOptional({ description: '测试集路径', example: '/data/test_dataset' })
  @IsOptional()
  @IsString()
  testPath?: string;

  @ApiPropertyOptional({ description: '数据预处理配置', example: { 'tokenizer': 'bert-base-uncased' } })
  @IsOptional()
  preprocessingConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: '数据加载器工作进程数', example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  numWorkers?: number;

  @ApiPropertyOptional({ description: '是否打乱数据', example: true })
  @IsOptional()
  @IsBoolean()
  shuffle?: boolean;
}

export class ModelConfig {
  @ApiProperty({ description: '模型名称', example: 'my-transformer-model' })
  @IsString()
  name: string;

  @ApiProperty({ description: '模型架构', enum: ModelArchitecture, example: ModelArchitecture.TRANSFORMER })
  @IsEnum(ModelArchitecture)
  architecture: ModelArchitecture;

  @ApiPropertyOptional({ description: '预训练模型路径', example: '/models/pretrained/bert-base' })
  @IsOptional()
  @IsString()
  pretrainedPath?: string;

  @ApiPropertyOptional({ description: '模型参数数量', example: 110000000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  parameters?: number;

  @ApiPropertyOptional({ description: '隐藏层大小', example: 768 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  hiddenSize?: number;

  @ApiPropertyOptional({ description: '注意力头数', example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  numAttentionHeads?: number;

  @ApiPropertyOptional({ description: '层数', example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  numLayers?: number;

  @ApiPropertyOptional({ description: '词汇表大小', example: 30522 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  vocabSize?: number;

  @ApiPropertyOptional({ description: '最大序列长度', example: 512 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxSequenceLength?: number;
}

export class TrainingConfig {
  @ApiProperty({ description: '训练轮数', example: 10 })
  @IsNumber()
  @Min(1)
  epochs: number;

  @ApiProperty({ description: '批次大小', example: 32 })
  @IsNumber()
  @Min(1)
  batchSize: number;

  @ApiProperty({ description: '学习率', example: 0.001 })
  @IsNumber()
  @Min(0)
  @Max(1)
  learningRate: number;

  @ApiPropertyOptional({ description: '优化器类型', enum: OptimizationType, example: OptimizationType.ADAMW })
  @IsOptional()
  @IsEnum(OptimizationType)
  optimizer?: OptimizationType;

  @ApiPropertyOptional({ description: '学习率调度器', enum: SchedulerType, example: SchedulerType.LINEAR })
  @IsOptional()
  @IsEnum(SchedulerType)
  scheduler?: SchedulerType;

  @ApiPropertyOptional({ description: '权重衰减', example: 0.01 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightDecay?: number;

  @ApiPropertyOptional({ description: '梯度裁剪阈值', example: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gradientClipping?: number;

  @ApiPropertyOptional({ description: '预热步数', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  warmupSteps?: number;

  @ApiPropertyOptional({ description: '检查点保存间隔', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  checkpointInterval?: number;

  @ApiPropertyOptional({ description: '验证间隔', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  validationInterval?: number;

  @ApiPropertyOptional({ description: '早停耐心值', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  earlyStopping?: number;

  @ApiPropertyOptional({ description: '累积梯度步数', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  accumulationSteps?: number;
}

export class OutputConfig {
  @ApiProperty({ description: '输出路径', example: '/output/my-model' })
  @IsString()
  outputPath: string;

  @ApiPropertyOptional({ description: '实验名称', example: 'experiment_001' })
  @IsOptional()
  @IsString()
  experimentName?: string;

  @ApiPropertyOptional({ description: '是否保存最佳模型', example: true })
  @IsOptional()
  @IsBoolean()
  saveBestModel?: boolean;

  @ApiPropertyOptional({ description: '是否保存最后模型', example: true })
  @IsOptional()
  @IsBoolean()
  saveLastModel?: boolean;

  @ApiPropertyOptional({ description: '保存格式', example: ['pytorch', 'onnx'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  saveFormats?: string[];
}

export class LoggingConfig {
  @ApiPropertyOptional({ description: '日志级别', enum: LogLevel, example: LogLevel.INFO })
  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @ApiPropertyOptional({ description: '日志输出路径', example: '/logs/training.log' })
  @IsOptional()
  @IsString()
  logPath?: string;

  @ApiPropertyOptional({ description: '是否启用TensorBoard', example: true })
  @IsOptional()
  @IsBoolean()
  enableTensorboard?: boolean;

  @ApiPropertyOptional({ description: 'TensorBoard日志路径', example: '/logs/tensorboard' })
  @IsOptional()
  @IsString()
  tensorboardPath?: string;

  @ApiPropertyOptional({ description: '是否启用Weights & Biases', example: false })
  @IsOptional()
  @IsBoolean()
  enableWandb?: boolean;

  @ApiPropertyOptional({ description: 'W&B项目名称', example: 'my-training-project' })
  @IsOptional()
  @IsString()
  wandbProject?: string;
}

export class TrainingSessionConfigDto {
  @ApiProperty({ description: '会话名称', example: 'training-session-001' })
  @IsString()
  sessionName: string;

  @ApiPropertyOptional({ description: '会话描述', example: '第一次分布式训练实验' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '模型配置', type: ModelConfig })
  @ValidateNested()
  @Type(() => ModelConfig)
  model: ModelConfig;

  @ApiProperty({ description: '训练配置', type: TrainingConfig })
  @ValidateNested()
  @Type(() => TrainingConfig)
  training: TrainingConfig;

  @ApiProperty({ description: '数据配置', type: DataConfig })
  @ValidateNested()
  @Type(() => DataConfig)
  data: DataConfig;

  @ApiProperty({ description: '输出配置', type: OutputConfig })
  @ValidateNested()
  @Type(() => OutputConfig)
  output: OutputConfig;

  @ApiPropertyOptional({ description: '硬件配置', type: HardwareConfig })
  @IsOptional()
  @ValidateNested()
  @Type(() => HardwareConfig)
  hardware?: HardwareConfig;

  @ApiPropertyOptional({ description: '分布式配置', type: DistributedConfig })
  @IsOptional()
  @ValidateNested()
  @Type(() => DistributedConfig)
  distributed?: DistributedConfig;

  @ApiPropertyOptional({ description: '日志配置', type: LoggingConfig })
  @IsOptional()
  @ValidateNested()
  @Type(() => LoggingConfig)
  logging?: LoggingConfig;

  @ApiPropertyOptional({ description: '自定义参数', example: { 'custom_param': 'value' } })
  @IsOptional()
  customArgs?: Record<string, any>;

  @ApiPropertyOptional({ description: '标签', example: ['experiment', 'baseline'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}