import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany, JoinTable } from 'typeorm';
import { User } from './users.entity';
import { Message } from './message.entity';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  isGroup: boolean;
  

  @Column({ nullable: true })
  name?: string;

  @ManyToMany(() => User, user => user.chats)
  @JoinTable()
  participants: User[];

  @OneToMany(() => Message, message => message.chat)
  messages: Message[];

  // Virtual field for the last message (not stored in DB, computed in service)
  lastMessage?: Message | null;
}
