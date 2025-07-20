// typeorm.config.ts
import { DataSource } from 'typeorm';
import { User } from '../backend/src/entities/users.entity';
import { Chat } from '../backend/src/entities/chat.entity';
import { Message } from './src/entities/message.entity';

export default new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'yourpassword',
  database: 'chat_app',
  entities: [User, Message, Chat],
  migrations: ['src/migrations/*.ts'],
});
