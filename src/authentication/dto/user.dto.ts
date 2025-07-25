import { IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class UserDto {
    @IsInt() 
    id: number;
    
    @IsEmail()
    email: string;
    
    @IsOptional()
    @IsString()
    firstName?: string;
    
    @IsOptional()
    @IsString()
    lastName?: string;
    
    @IsOptional()
    @IsString()
    avatar?: string;
    
    @IsOptional()
    @IsString()
    googleId?: string;
}