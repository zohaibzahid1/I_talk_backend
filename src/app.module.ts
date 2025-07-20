import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './authentication/authentication.module';
import { UsersModule } from './users/user.module';
import { ChatModule } from './chat/chat.module';
import { User } from './entities/users.entity';
import { Message } from './entities/message.entity';
import { Chat } from './entities/chat.entity';
  
@Module({
  imports: [
    ConfigModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphql'],
      playground: true,
      introspection: true,
      context: ({ req, res }) => {
         return { req, res };
      },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres' ,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity.{ts,js}'], // Path to your entity files
      migrations: [__dirname + '/../migrations/*.{ts,js}'], // Path to your migration files
      synchronize: false, // ❌ Do not use in production because we use migrations
      autoLoadEntities: true, 
      migrationsTableName: 'migrations', // where all migrations are stored
    }),
    UsersModule,
    AuthenticationModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
