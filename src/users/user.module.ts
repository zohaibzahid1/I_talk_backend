import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { User } from '../entities/users.entity';
import { Message } from '../entities/message.entity';
import { Chat } from '../entities/chat.entity';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Message, Chat]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
  //controllers: [UsersController],
})
export class UsersModule {}
