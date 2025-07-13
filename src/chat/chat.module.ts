import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { Chat } from '../entities/chat.entity';
import { User } from '../entities/users.entity';
import { Message } from '../entities/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, User, Message])],
  providers: [ChatService, ChatResolver],
  exports: [ChatService],
  
})
export class ChatModule {}
