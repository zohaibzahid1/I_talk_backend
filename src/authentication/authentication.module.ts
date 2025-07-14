import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationResolver } from './authentication.resolver';
import { AuthenticationController } from './authentication.controller';
import { UsersModule } from '../users/user.module'; // Import the user module to access user services
import { PassportModule } from '@nestjs/passport'; // Import PassportModule for authentication strategies
import { GoogleStrategy } from './strategy/google.strategy'; // Import the Google strategy for OAuth authentication
import { JwtStrategy } from './strategy/jwt.strategy'; // Import the JWT strategy for JWT authentication
import { JwtModule } from '@nestjs/jwt'; // Import JwtModule

@Module({
  providers: [AuthenticationResolver, AuthenticationService, GoogleStrategy, JwtStrategy],
  controllers: [AuthenticationController],
  imports: 
  [   UsersModule,
      PassportModule,
      JwtModule.register({
        secret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
        signOptions: { expiresIn: '1m' },
      }),
    ], // Import the user module to access user services
})
export class AuthenticationModule {}

