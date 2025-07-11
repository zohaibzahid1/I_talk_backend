import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { UsersService } from '../../users/users.service'; // Adjust the import path as necessary
// Import your UsersService to handle user logic
/**
 * Google OAuth2 Strategy for Passport in NestJS
 * This strategy enables users to sign in via Google OAuth.
 */

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private usersService: UsersService) {
    
    // Configure the Google strategy with credentials and scopes
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!, // Google OAuth Client ID
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!, // Google OAuth Client Secret
      callbackURL: process.env.GOOGLE_CALLBACK_URL!, // URL to redirect to after Google login
      scope: ['profile', 'email'], // Scopes to request from Google
    });
  }

  /**
   * This function runs after Google successfully authenticates the user.
   * It receives the user's profile and tokens, and is responsible for finding or creating the user in our system.
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<any> {
 
    const { id, emails, name, photos } = profile;
    const firstName = name?.givenName || '';
    const lastName = name?.familyName || '';
    const email = emails?.[0]?.value || '';
    const avatar = photos?.[0]?.value || '';

    // Use a user service to find or create the user
    const user = await this.usersService.findOrCreateOAuthUser({
      googleId: id,
      email,
      firstName,
      lastName,
      avatar,
    });
    
    
    return user;
  }
}
