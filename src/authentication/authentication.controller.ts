import {Controller,Get,Req,Res,UseGuards,} from '@nestjs/common';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { AuthenticationService } from './authentication.service';

  @Controller('authentication')
  export class AuthenticationController {
    constructor(private readonly authService: AuthenticationService) {}   
   
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth() {
      // Initiates the Google OAuth2 login flow
      // The actual redirection to Google happens in the guard
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthCallback(@Req() req: any, @Res() res: any) {
      // Handle the callback from Google after authentication
      // req.user will contain the authenticated user information
      const user = req.user;
      
      await this.authService.handleTokenAndCookies(user, res);
         
      // Redirect to the frontend application after successful authentication
      return res.redirect(`${process.env.FRONTEND_URL_REDIRECT}`);
    }
}

