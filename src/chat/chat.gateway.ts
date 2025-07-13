import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ||  
    'http://localhost:3001',},
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { chatId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { chatId, message } = data;

    // Broadcast to other clients in the chat
    client.to(chatId).emit('receiveMessage', { message });  
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
    client.join(chatId);
    console.log(`Client ${client.id} joined room ${chatId}`);
  }
}
