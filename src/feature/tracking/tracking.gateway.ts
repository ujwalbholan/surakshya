import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocationUpdatePayload } from './tracking.types';

@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class TrackingGateway {
  private readonly logger = new Logger(TrackingGateway.name);

  @WebSocketServer()
  server!: Server;

  emitLocationUpdate(payload: LocationUpdatePayload) {
    this.server
      .to(`device:${payload.deviceId}`)
      .emit('location_update', payload);
  }

  @SubscribeMessage('subscribe_device')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { deviceId?: string } | string,
  ) {
    const deviceId = typeof body === 'string' ? body : body?.deviceId;
    if (!deviceId) {
      return { ok: false, error: 'deviceId is required' };
    }

    void client.join(`device:${deviceId}`);
    this.logger.log(`Client ${client.id} subscribed to device:${deviceId}`);
    return { ok: true, deviceId };
  }

  @SubscribeMessage('unsubscribe_device')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { deviceId?: string } | string,
  ) {
    const deviceId = typeof body === 'string' ? body : body?.deviceId;
    if (!deviceId) {
      return { ok: false, error: 'deviceId is required' };
    }

    void client.leave(`device:${deviceId}`);
    return { ok: true, deviceId };
  }
}
