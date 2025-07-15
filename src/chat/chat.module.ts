import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { Chat } from '../entities/chat.entity';
import { User } from '../entities/users.entity';
import { Message } from '../entities/message.entity';
import { ChatGateway } from './chat.gateway';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, User, Message]),

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [ChatService, ChatResolver, ChatGateway, UsersService],
  exports: [ChatService],
})

export class ChatModule {}
