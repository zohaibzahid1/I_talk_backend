// typeorm.config.ts
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'password',
  database: 'Chat_app',
  entities: ['src/entities/*.entity.{ts,js}'],
  migrations: ['src/migrations/*.ts'],
});
