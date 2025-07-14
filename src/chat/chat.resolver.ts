import { Resolver, Query, Mutation, Args, Context, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Chat } from '../entities/chat.entity';
import { JwtGuard } from '../guards/jwt-auth.guard';
import { Message } from '../entities/message.entity';

@Resolver(() => Chat)
export class ChatResolver {
  constructor(private chatService: ChatService) {}

  @Query(() => Chat, { nullable: true })
  @UseGuards(JwtGuard)
  async getChat(@Args('id', { type: () => Int }) id: number): Promise<Chat | null> {
    return await this.chatService.findChatById(id);
  }

  @Query(() => [Chat])
  @UseGuards(JwtGuard)
  async getUserChats(@Context() context: any): Promise<Chat[]> {
    const user = context.req.user;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await this.chatService.getUserChats(user.userId);
  }

  @Query(() => [Message])
  @UseGuards(JwtGuard)
  async getChatMessages(
    @Args('chatId', { type: () => Int }) chatId: number,
    @Context() context: any
  ): Promise<Message[]> {
    const user = context.req.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify user is participant in the chat
    const chat = await this.chatService.findChatById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }


    const isParticipant = chat.participants.some(p => p.id === user.userId);
    if (!isParticipant) {
      throw new Error('User is not a participant in this chat');
    }

    const msgs = await this.chatService.getChatMessages(chatId);
    return msgs;  
  }
  


  @Mutation(() => Chat)
  @UseGuards(JwtGuard)
  async openOrCreateChat(
    @Args('otherUserId', { type: () => Int }) otherUserId: number,
    @Context() context: any
  ): Promise<Chat> {
    const user = context.req.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // For direct messages, find or create a chat between current user and other user
    return await this.chatService.findOrCreateDirectChat(user.userId, otherUserId);
  }

  @Mutation(() => Chat)
  @UseGuards(JwtGuard)
  async createGroupChat(
    @Args('name') name: string,
    @Args('participantIds', { type: () => [Int] }) participantIds: number[],
    @Context() context: any
  ): Promise<Chat> {
    const user = context.req.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Add current user to participants if not already included
    const allParticipants = [...new Set([user.userId, ...participantIds])];
    
    return await this.chatService.createGroupChat(name, allParticipants);
  }

  @Mutation(() => Chat)
  @UseGuards(JwtGuard)
  async addParticipant(
    @Args('chatId', { type: () => Int }) chatId: number,
    @Args('userId', { type: () => Int }) userId: number
  ): Promise<Chat> {
    return await this.chatService.addParticipant(chatId, userId);
  }

  @Mutation(() => Chat)
  @UseGuards(JwtGuard)
  async removeParticipant(
    @Args('chatId', { type: () => Int }) chatId: number,
    @Args('userId', { type: () => Int }) userId: number
  ): Promise<Chat> {
    return await this.chatService.removeParticipant(chatId, userId);
  }

  @Mutation(() => Message)

  @UseGuards(JwtGuard)
  async sendMessage(
    @Args('chatId', { type: () => ID }) chatId: string,
    @Args('content') content: string,
    @Context() context: any
  ): Promise<Message> {
    const user = context.req.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Convert chatId to number (assuming it's stored as number in DB)
    const numericChatId = parseInt(chatId, 10);
    if (isNaN(numericChatId)) {
      throw new Error('Invalid chat ID');
    }

    return await this.chatService.sendMessage(numericChatId, user.userId, content);
  }
}
