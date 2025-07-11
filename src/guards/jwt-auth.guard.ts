import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
    getRequest(context: ExecutionContext) {
        // Check if this is a GraphQL context
        const gqlContext = GqlExecutionContext.create(context);
        if (gqlContext.getType() === 'graphql') {
            // Extract request from GraphQL context
            return gqlContext.getContext().req;
        }
        
        // For REST endpoints, return the request as usual
        return context.switchToHttp().getRequest();
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        // If there's an error or no user, return null instead of throwing
        // This allows the resolver to handle authentication failures gracefully
        if (err || !user) {
            return null;
        }
        return user;
    }
}