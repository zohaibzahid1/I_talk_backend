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
import { Exclude } from 'class-transformer';
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
    console.log('=== Socket Gateway initialized ===');
    // Set all users offline when server starts
    try {
      await this.usersService.setAllUsersOffline();
      console.log('All users set to offline status');
    } catch (error) {
      console.error('Failed to set users offline on startup:', error);
    }
  }

  handleConnection(client: Socket) {
    console.log(`=== Client connected: ${client.id} ===`);
    console.log(`Total connections: ${this.server.engine.clientsCount}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`=== Client disconnected: ${client.id} ===`);
    console.log(`Total connections: ${this.server.engine.clientsCount}`);
    
    // Find and remove user session
    for (const [userId, socketId] of this.userSessions.entries()) {
      if (socketId === client.id) {
        this.userSessions.delete(userId);
        console.log(`Removed user session for userId: ${userId}`);
        
        // // Update user online status in database
        // try {
        //   await this.usersService.updateOnlineStatus(parseInt(userId), false);
        // } catch (error) {
        //   console.error('Failed to update user offline status:', error);
        // }
        
        // Broadcast user offline status
        // this.server.emit('userStatusChanged', { 
        //   userId, 
        //   isOnline: false 
        // });
        break;
      }
    }
  }

  @SubscribeMessage('userOnline')
  async handleUserOnline(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`=== User ${userId} coming online on socket ${client.id} ===`);
    
    // Check if user already has a session
    const existingSocketId = this.userSessions.get(userId);
    if (existingSocketId && existingSocketId !== client.id) {
      console.log(`User ${userId} already has a session with socket ${existingSocketId}, replacing with ${client.id}`);
    }
    
    // Store user session
    this.userSessions.set(userId, client.id);
    console.log(`User sessions count: ${this.userSessions.size}`);
    
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
    
    
  }

  @SubscribeMessage('userOffline')
  async handleUserOffline(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    // Remove user session
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
    console.log(`User ${userId} is now offline`);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { chatId: string; message: Message },
    @ConnectedSocket() client: Socket,
  ) {
    const { chatId, message } = data;
    // Broadcast to other clients in the chat
    console.log(`Message sent in chat ${chatId}:`, message);
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
    console.log(`User ${userId} is typing in chat ${chatId}`);
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

  // Notify participants when a new chat is created
  notifyNewChatCreated(chat: any, excludeUserId?: number) {
    console.log(`=== Notifying participants about new chat ${chat.id} ===`);
    console.log('Chat participants:', chat.participants.map(p => p.id));
    // Notify each participant about the new chat
    chat.participants.forEach((participant: any) => {
      // Skip the user who created the chat if excludeUserId is provided
        
      if (excludeUserId && participant.id === excludeUserId) {
        console.log('excluding creator from notification', excludeUserId);
        return;
      }
      
      const participantSocketId = this.userSessions.get(participant.id.toString());
      if (participantSocketId) {
        console.log(`Notifying user ${participant.id} about new chat via socket ${participantSocketId}`);
        this.server.to(participantSocketId).emit('newChatCreated', {
          chat: chat
        });
      } else {
        console.log(`User ${participant.id} is not online, cannot notify about new chat`);
      }
    });
  }
}
