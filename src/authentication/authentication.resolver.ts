import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { AuthenticationService } from './authentication.service';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/guards/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';

@Resolver()
export class AuthenticationResolver {
  
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly usersService: UsersService
  ) {}
  
  // Will return the Google authentication URL that the frontend will use to redirect the user
  @Query(() => String)
  getGoogleAuthUrl(): string {
    return this.authenticationService.loginUrl('google');
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtGuard)
  async logout(@Context() context: any): Promise<boolean> {
    try {
      const response = context.res;
      const user = context.req.user; // Get user from JWT context
      
      // Set user offline status
      if (user && user.id) {
        try {
          await this.usersService.updateOnlineStatus(user.id, false);
          console.log(`User ${user.id} set to offline on logout`);
        } catch (error) {
          console.error('Failed to set user offline:', error);
        }
      }
      
      // Clear the authentication cookies with the same options as when they were set
      response.clearCookie('access_token', {
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
      });
      response.clearCookie('refresh_token', {
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
      });
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }

  // validatetoken
  @Query(() => Boolean)
  @UseGuards(JwtGuard)
  validateToken(@Context() context: any): boolean {
    // if the JWT guard is used, it will automatically validate the token
    // and attach the user to the request object
    // You can access the user from the context to check if the token is valid
    const response = context.res;
    
    const user = context.req.user;
    if (!user) {
      // remove cookies if user is not authenticated
      response.clearCookie('access_token', {});
      response.clearCookie('refresh_token', {});
      return false; // Token is invalid or expired
    }
    return true; // Token is valid
  }
}

