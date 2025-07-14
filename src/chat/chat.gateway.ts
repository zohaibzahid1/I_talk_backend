import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Message } from 'src/entities/message.entity';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ||  
    'http://localhost:3001',}
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  server: Server;

  handleConnection(client: Socket) {
    // Client connected
  }

  handleDisconnect(client: Socket) {
    // Client disconnected
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { chatId: string; message: Message },
    @ConnectedSocket() client: Socket,
  ) {
    const { chatId, message } = data;
    // Broadcast to other clients in the chat
    client.to(chatId).emit('receiveMessage', { chatId, message });  
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
    client.join(chatId);
  }
}
