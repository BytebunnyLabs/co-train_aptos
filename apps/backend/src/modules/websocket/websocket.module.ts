import { Module } from '@nestjs/common';
import { SessionWebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [SessionWebSocketGateway, WebSocketService],
  exports: [SessionWebSocketGateway, WebSocketService],
})
export class WebSocketModule {}