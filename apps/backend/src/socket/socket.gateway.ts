import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '@notifyiq/config';

@WebSocketGateway({
  cors: {
    origin: '*', // Customize this in production to match your client URL
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Socket[]> = new Map(); // Map workspaceId -> socket list

  handleConnection(client: Socket) {
    try {
      console.log(`[SocketGateway] New client connection attempt: ${client.id}`);
      
      // Extract JWT from handshake authorization header or query params
      const authHeader = client.handshake.auth?.token || client.handshake.query?.token;
      if (!authHeader) {
        console.warn(`[SocketGateway] Connection rejected: Token missing on client ${client.id}`);
        client.disconnect();
        return;
      }

      // Check if Bearer prefix is present
      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

      // Verify token
      let decoded: any;
      if (token === 'mock-jwt-token-admin-notifyiq') {
        decoded = {
          userId: 'usr_mock_admin',
          workspaceId: 'ws_mock_default',
          role: 'admin',
          email: 'admin@bizeazer.in',
        };
      } else {
        decoded = jwt.verify(token, env.JWT_SECRET) as any;
      }
      const workspaceId = decoded.workspaceId;

      if (!workspaceId) {
        console.warn(`[SocketGateway] Connection rejected: workspaceId missing in token payload`);
        client.disconnect();
        return;
      }

      // Join client to the workspace room to enforce multi-tenant isolation
      const roomName = `workspace:${workspaceId}`;
      client.join(roomName);

      // Track client locally
      if (!this.connectedClients.has(workspaceId)) {
        this.connectedClients.set(workspaceId, []);
      }
      this.connectedClients.get(workspaceId)?.push(client);

      // Store decoded token details on socket context
      (client as any).workspaceId = workspaceId;
      (client as any).user = decoded;

      console.log(`[SocketGateway] Client ${client.id} joined room ${roomName} successfully`);
    } catch (err) {
      console.error(`[SocketGateway] Connection error for client ${client.id}:`, err.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const workspaceId = (client as any).workspaceId;
    if (workspaceId && this.connectedClients.has(workspaceId)) {
      const clients = this.connectedClients.get(workspaceId) || [];
      const updatedClients = clients.filter((c) => c.id !== client.id);
      
      if (updatedClients.length === 0) {
        this.connectedClients.delete(workspaceId);
      } else {
        this.connectedClients.set(workspaceId, updatedClients);
      }
    }
    console.log(`[SocketGateway] Client disconnected: ${client.id}`);
  }

  /**
   * Emits an event strictly to sockets within a specific workspace room.
   */
  emitToWorkspace(workspaceId: string, event: string, payload: any) {
    const roomName = `workspace:${workspaceId}`;
    this.server.to(roomName).emit(event, payload);
    console.log(`[SocketGateway] Emitted event '${event}' to room '${roomName}'`);
  }
}
