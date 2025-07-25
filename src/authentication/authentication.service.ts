import { Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from '../users/users.service'; 
import { Response } from "express";

@Injectable()
export class AuthenticationService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService, // Inject the UsersService to access user-related methods
    ) {}    
    
    // Returns the login URL for Google or Facebook based on the input.
    loginUrl(input: string): string {
        if (input === 'google') {
            return String(process.env.GOOGLE_AUTH_URL);
        }
        if (input === 'facebook') {
            // return String(process.env.FACEBOOK_AUTH_URL);
        }
        return 'Invalid input, please provide either "google" or "facebook".';
    }

   // Handles the generation of tokens and setting of cookies for the authenticated user.
    async handleTokenAndCookies(user: UserDto, res: Response) {
    console.log('Handling tokens and cookies for user:', user.email, 'ID:', user.id);
    
    // generate tokens for the user
    const tokens = await this.generateTokens(user);
    
    console.log('Tokens generated successfully');

    // Store refresh token after hashing in DB
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    
    // Set user online status in database (user just authenticated)
    try {
        await this.usersService.updateOnlineStatus(user.id, true);
        console.log('User online status set to true');
    } catch (error) {
        console.error('Failed to set user online status:', error);
    }
    
    // set auth cookies
    this.setAuthCookies(res, tokens);
    
    console.log('Cookies set successfully');

    return {
      tokens,
      user,
    };
  }
   // set auth cookies
  async setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
   
    // Set refresh token as a secure, HTTP-only cookie
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Lax for development
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined, // Only set domain in production
    });
    // Set access token (optional in cookie)
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Lax for development
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
      domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined, // Only set domain in production
    });
    
    
  }
    //  Generates tokens for a given user.
  async generateTokens(user: UserDto): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || '30m', // Default to 30 minutes if not set
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d', // Default to 7 days if not set
    });

    return { accessToken, refreshToken };
  }
   // Stores the hashed refresh token in the database.
  async storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.usersService.addRefreshToken(userId, hashed);
  }


}
