import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class AdminInfraService {
  constructor(@InjectConnection() private connection: Connection) {}

  async getInfraHealth() {
    const dbState = this.connection.readyState;
    const dbStatusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const mem = process.memoryUsage();

    return {
      status: dbState === 1 ? 'healthy' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        provider: 'MongoDB Atlas',
        region: 'ap-south-1',
        status: dbStatusMap[dbState] || 'unknown',
        readyState: dbState,
      },
      processMemory: {
        rssMb: Number((mem.rss / (1024 * 1024)).toFixed(2)),
        heapTotalMb: Number((mem.heapTotal / (1024 * 1024)).toFixed(2)),
        heapUsedMb: Number((mem.heapUsed / (1024 * 1024)).toFixed(2)),
      },
      services: [
        { name: 'NestJS Backend API', status: 'healthy', port: 8000 },
        { name: 'MongoDB Atlas Cluster', status: dbState === 1 ? 'healthy' : 'down' },
        { name: 'Utho Redis 7', status: 'healthy' },
        { name: 'Meta WABA Gateway', status: 'healthy' },
      ],
    };
  }
}
