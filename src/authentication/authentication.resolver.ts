import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { AuthenticationService } from './authentication.service';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/guards/jwt-auth.guard';

@Resolver()
export class AuthenticationResolver {
  constructor(private readonly authenticationService: AuthenticationService) {}
  
  // Will return the Google authentication URL that the frontend will use to redirect the user
  @Query(() => String)
  getGoogleAuthUrl(): string {
    return this.authenticationService.loginUrl('google');
  }

  @Mutation(() => Boolean)
  async logout(@Context() context: any): Promise<boolean> {
    try {
      const response = context.res;
      
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
    const user = context.req.user;
    if (!user) {
      return false; // Token is invalid or expired
    }
    return true; // Token is valid
  }
}
