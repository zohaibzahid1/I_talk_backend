import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Message } from 'src/entities/message.entity';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ||  
    'http://localhost:3001',}
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Store user sessions: userId -> socketId
  private userSessions = new Map<string, string>();

  constructor(private usersService: UsersService) {}

  async afterInit(server: Server) {
    console.log('Socket Gateway initialized');
    // Set all users offline when server starts
    try {
      await this.usersService.setAllUsersOffline();
      console.log('All users set to offline status');
    } catch (error) {
      console.error('Failed to set users offline on startup:', error);
    }
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Find and remove user session
    for (const [userId, socketId] of this.userSessions.entries()) {
      if (socketId === client.id) {
        this.userSessions.delete(userId);
        
        // Update user online status in database
        try {
          await this.usersService.updateOnlineStatus(parseInt(userId), false);
        } catch (error) {
          console.error('Failed to update user offline status:', error);
        }
        
        // Broadcast user offline status
        this.server.emit('userStatusChanged', { 
          userId, 
          isOnline: false 
        });
        break;
      }
    }
  }

  @SubscribeMessage('userOnline')
  async handleUserOnline(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    // Store user session
    this.userSessions.set(userId, client.id);
    
    // Update user online status in database
    try {
      await this.usersService.updateOnlineStatus(parseInt(userId), true);
    } catch (error) {
      console.error('Failed to update user online status:', error);
    }
    
    // Broadcast user online status
    this.server.emit('userStatusChanged', { 
      userId, 
      isOnline: true 
    });
    
    console.log(`User ${userId} is now online`);
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

  @SubscribeMessage('userStartTyping')
  async handleUserStartTyping(
    @MessageBody() data: { chatId: string; userId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { chatId, userId } = data;
    
    // Emit to all other clients in the chat room (exclude sender)
    client.to(chatId).emit('userTypingStatusChanged', {
      chatId,
      userId,
      isTyping: true
    });
  }

  @SubscribeMessage('userStopTyping')
  async handleUserStopTyping(
    @MessageBody() data: { chatId: string; userId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { chatId, userId } = data;
    
    // Emit to all other clients in the chat room (exclude sender)
    client.to(chatId).emit('userTypingStatusChanged', {
      chatId,
      userId,
      isTyping: false
    });
  }
}
