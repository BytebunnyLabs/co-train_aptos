import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import redisStore from 'cache-manager-redis-store';

// Configuration
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TrainingModule } from './modules/training/training.module';
import { ContributorsModule } from './modules/contributors/contributors.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { HivemindModule } from './modules/hivemind/hivemind.module';
import { HivemindProxyModule } from './modules/hivemind-proxy/hivemind-proxy.module';
import { CotrainCoreModule } from './modules/cotrain-core/cotrain-core.module';
// import { ComputeModule } from './modules/compute/compute.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';
// import { FilesModule } from './modules/files/files.module';

// Common
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Redis Cache
    CacheModule.registerAsync({
      useClass: RedisConfig,
    }),

    // Bull Queue
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD,
        },
      }),
    }),

    // Task Scheduling
    ScheduleModule.forRoot(),

    // Event Emitter
    EventEmitterModule.forRoot(),

    // Feature Modules
    AuthModule,
    UsersModule,
    TrainingModule,
    ContributorsModule,
    BlockchainModule,
    WebSocketModule,
    HivemindModule,
    HivemindProxyModule,
    CotrainCoreModule,
    // ComputeModule,
    // AnalyticsModule,
    // NotificationsModule,
    // FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}