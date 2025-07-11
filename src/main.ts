import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable cookie parsing
  app.use(cookieParser());
  
  app.enableCors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:3001'], // Allow both env variable and localhost
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

