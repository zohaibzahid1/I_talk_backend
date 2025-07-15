import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/users.entity';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,)
    {}  

  //  Find by email
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  //  Find by ID
  async findById(id: number): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  //  Find by Google ID
  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { googleId },withDeleted:true });
  }

  //  Find or create user via Google OAuth
  async findOrCreateOAuthUser(data: { googleId: string; email: string; firstName: string; lastName: string; avatar?: string }): Promise<User> {
    let user = await this.findByGoogleId(data.googleId);
    // if user dosent exist, create a new one
    if (!user) {

      user = this.usersRepo.create({
        email: data.email,
        googleId: data.googleId,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
        isOnline: true, // Set isOnline to true for new users
      });
      await this.usersRepo.save(user);
    } else {
      // If user exists, update avatar if provided (in case it changed)
      if (data.avatar && user.avatar !== data.avatar) {
        user.avatar = data.avatar;
        await this.usersRepo.save(user);
      }
    }

    return user;
  }
  // add refresh token to user
  async addRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const user = await this.findById(userId);
    if (user) {
      user.refreshToken = [...(user.refreshToken || []), refreshToken];
      await this.usersRepo.save(user);
    }
  }

  // find all users
  async findAll(): Promise<User[]> {
    // Fetch all users from the repository
    return this.usersRepo.find();
  }

  // Update online status
  async updateOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    await this.usersRepo.update(userId, { isOnline });
  }

  // Set all users offline (useful for app startup)
  async setAllUsersOffline(): Promise<void> {
    await this.usersRepo.createQueryBuilder()
      .update(User)
      .set({ isOnline: false })
      .execute();
  }

}