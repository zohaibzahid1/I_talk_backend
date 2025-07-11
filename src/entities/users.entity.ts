import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { Message } from './message.entity';
import { Chat } from './chat.entity';
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  googleId: string;

 
  @Column({ nullable: true })
  firstName?: string; // User's first name, optional

  
  @Column({ nullable: true })
  lastName?: string; // User's last name, optional

  @Column({ nullable: true })
  avatar?: string; // User's profile picture URL from Google
  
  // there can be multiple refresh tokens for a user loginned on multiple devices, so we use an array
  @Column({ type: 'text', array: true, nullable: true })
  refreshToken: string[];
  
  @OneToMany(() => Message, msg => msg.sender)
  messages: Message[];

  
  @ManyToMany(() => Chat, chat => chat.participants)
  chats: Chat[];
}