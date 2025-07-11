import { Resolver, Query, Mutation, Args, Context, Int } from "@nestjs/graphql";
import { UsersService } from "./users.service";
import { User } from "src/entities/users.entity";
import { JwtService } from "@nestjs/jwt";

@Resolver(() => User) // this is called thunk that tells typescript what is the type of the object
export class UsersResolver {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}

    @Query(() => User, { nullable: true })
    async getCurrentUser(@Context() context: any): Promise<User | null> {
        try {
            // Extract token from cookies
            const request = context.req;
            const accessToken = request?.cookies?.access_token;
            
            if (!accessToken) {
                console.log('No access token found in cookies');
                return null;
            }
            
            // Verify and decode the token
            const decoded = this.jwtService.verify(accessToken, {
                secret: process.env.JWT_ACCESS_SECRET
            });
            
            console.log('Token decoded successfully, user ID:', decoded.sub);
            
            // Get user from database
            const user = await this.usersService.findById(decoded.sub);
            
            if (user) {
                console.log('User found:', user.email);
            } else {
                console.log('User not found in database');
            }
            
            return user;
        } catch (error) {
            console.error('Error getting current user:', error.message);
            return null;
        }
    }
    // get all users
    @Query(() => [User])
    async getAllUsers(): Promise<User[]> {
        try {
            const users = await this.usersService.findAll();
            return users;
        } catch (error) {
            console.error('Error getting all users:', error.message);
            throw new Error('Failed to fetch users');   
        }
    }
}