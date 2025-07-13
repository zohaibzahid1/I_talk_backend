import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from '../entities/chat.entity';
import { User } from '../entities/users.entity';
import { Message } from '../entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @Inject(forwardRef(() => require('./chat.gateway').ChatGateway))
    private chatGateway?: any,
  ) {}

  async findOrCreateDirectChat(currentUserId: number, otherUserId: number): Promise<Chat> {
    // First, check if a direct chat already exists between these two users
    // Use a subquery approach to avoid GROUP BY issues with leftJoinAndSelect
    const existingChatId = await this.chatRepository
      .createQueryBuilder('chat')
      .select('chat.id')
      .leftJoin('chat.participants', 'participant')
      .where('chat.isGroup = :isGroup', { isGroup: false })
      .andWhere('participant.id IN (:...userIds)', { userIds: [currentUserId, otherUserId] })
      .groupBy('chat.id')
      .having('COUNT(DISTINCT participant.id) = :count', { count: 2 })
      .getRawOne();

    if (existingChatId) {
      // Return existing chat with full participants data
      const fullChat = await this.chatRepository.findOne({
        where: { id: existingChatId.chat_id },
        relations: ['participants', 'messages', 'messages.sender']
      });
      
      if (!fullChat) {
        throw new Error('Chat not found');
      }
      
      return fullChat;
    }

    // If no existing chat, create a new one
    return await this.createDirectChat(currentUserId, otherUserId);
  }

  async createDirectChat(currentUserId: number, otherUserId: number): Promise<Chat> {
    // Get both users
    const users = await this.userRepository.findByIds([currentUserId, otherUserId]);
    
    if (users.length !== 2) {
      throw new Error('One or both users not found');
    }

    // Create new chat
    const newChat = this.chatRepository.create({
      isGroup: false,
      participants: users,
      messages: []
    });

    const savedChat = await this.chatRepository.save(newChat);
    
    // 🚀 Emit new chat to both participants
    if (this.chatGateway) {
      await this.chatGateway.emitNewChat(savedChat.id, [currentUserId, otherUserId]);
    }
    
    // Return chat with all relations loaded
    return await this.chatRepository.findOne({
      where: { id: savedChat.id },
      relations: ['participants', 'messages', 'messages.sender']
    }) || savedChat;
  }

  async createGroupChat(name: string, participantIds: number[]): Promise<Chat> {
    // Get all participants
    const participants = await this.userRepository.findByIds(participantIds);
    
    if (participants.length !== participantIds.length) {
      throw new Error('Some participants not found');
    }

    // Create new group chat
    const newChat = this.chatRepository.create({
      isGroup: true,
      name,
      participants,
      messages: []
    });

    const savedChat = await this.chatRepository.save(newChat);

    // 🚀 Emit new chat to all participants
    if (this.chatGateway) {
      await this.chatGateway.emitNewChat(savedChat.id, participantIds);
    }

    return savedChat;
  }

  async findChatById(id: number): Promise<Chat | null> {
    return await this.chatRepository.findOne({
      where: { id },
      relations: ['participants']
    });
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    const chats = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoin('chat.participants', 'filterParticipant') // for filtering only
      .leftJoinAndSelect('chat.participants', 'participant') // actual full participant list
      .where('filterParticipant.id = :userId', { userId }) // filtering only
      .orderBy('chat.id', 'DESC')
      .getMany();

    console.log('User chats (without messages):', chats);
    console.log('Chat participants:', chats.map(chat => chat.participants));
    return chats;
  }

  // New method to get messages for a specific chat
  async getChatMessages(chatId: number, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.chatId = :chatId', { chatId })
      .orderBy('message.createdAt', 'ASC')
      .limit(limit)
      .offset(offset)
      .getMany();

    console.log(`Chat ${chatId} messages:`, messages);
    return messages;
  }


  async addParticipant(chatId: number, userId: number): Promise<Chat> {
    const chat = await this.findChatById(chatId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!chat || !user) {
      throw new Error('Chat or user not found');
    }


    // Check if user is already a participant
    const isAlreadyParticipant = chat.participants.some(p => p.id === userId);
    
    if (!isAlreadyParticipant) {
      chat.participants.push(user);
      await this.chatRepository.save(chat);
    }

    return chat;
  }

  async removeParticipant(chatId: number, userId: number): Promise<Chat> {
    const chat = await this.findChatById(chatId);

    if (!chat) {
      throw new Error('Chat not found');
    }

    chat.participants = chat.participants.filter(p => p.id !== userId);
    return await this.chatRepository.save(chat);
  }

  async sendMessage(chatId: number, senderId: number, content: string): Promise<Message> {
    const chat = await this.findChatById(chatId);
    const sender = await this.userRepository.findOne({ where: { id: senderId } });

    if (!chat || !sender) {
      throw new Error('Chat or sender not found');
    }

    // Check if the sender is a participant in the chat
    const isParticipant = chat.participants.some(p => p.id === senderId);
    if (!isParticipant) {
      throw new Error('User is not a participant in this chat');
    }

    // Create the message
    const message = this.messageRepository.create({
      content,
      sender,
      chat
    });

    // Save the message with sender relation
    const savedMessage = await this.messageRepository.save(message);
    
    // Return message with sender information loaded
    const messageWithSender = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender']
    }) || savedMessage;

    // 🚀 Emit the message to all connected sockets
    if (this.chatGateway) {
      await this.chatGateway.emitNewMessage(messageWithSender, chatId);
    }

    return messageWithSender;
  }
}
