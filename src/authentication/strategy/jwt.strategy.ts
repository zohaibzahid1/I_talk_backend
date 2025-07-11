import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as JwtStrategyBase, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';

// Passport strategy for handling JWT authentication in NestJS.
// This strategy extracts the JWT from cookie 
// this verifies the jwt token make sure it is valid and not expired
@Injectable()
export class JwtStrategy extends PassportStrategy(JwtStrategyBase, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        // Try to get token from cookies first
        if (req.cookies && req.cookies['access_token']) {
          return req.cookies['access_token'];
        }
        // Fallback to Authorization header
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
        secretOrKey: process.env.JWT_ACCESS_SECRET!,
    });
  }
  // This method runs after the JWT is verified.
  async validate(payload: any) {
    console.log("validate", payload);
    return { userId: payload.sub, email: payload.email }; // attach user info to request
  }
}

