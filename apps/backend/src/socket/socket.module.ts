import { Module, Global } from '@nestjs/common';
import { SocketGateway } from './socket.gateway.js';

@Global() // Make SocketGateway globally injectable across modules
@Module({
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
