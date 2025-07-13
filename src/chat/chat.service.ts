import { Injectable } from '@nestjs/common';
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
      // Return existing chat with participants and last message only
      const fullChat = await this.chatRepository.findOne({
        where: { id: existingChatId.chat_id },
        relations: ['participants']
      });
      
      if (!fullChat) {
        throw new Error('Chat not found');
      }

      // Get the last message for the existing chat
      const lastMessage = await this.messageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sender', 'sender')
        .where('message.chatId = :chatId', { chatId: fullChat.id })
        .orderBy('message.createdAt', 'DESC')
        .limit(1)
        .getOne();

      return {
        ...fullChat,
        lastMessage: lastMessage || null
      };
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
    
    // Return chat with participants and lastMessage as null (new chat)
    const chatWithParticipants = await this.chatRepository.findOne({
      where: { id: savedChat.id },
      relations: ['participants']
    }) || savedChat;

    return {
      ...chatWithParticipants,
      lastMessage: null
    };
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

    // Return new chat with lastMessage as null
    return {
      ...savedChat,
      lastMessage: null
    };
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

    // Get the latest message for each chat and attach it
    const chatsWithLastMessage = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await this.messageRepository
          .createQueryBuilder('message')
          .leftJoinAndSelect('message.sender', 'sender')
          .where('message.chatId = :chatId', { chatId: chat.id })
          .orderBy('message.createdAt', 'DESC')
          .limit(1)
          .getOne();

        return {
          ...chat,
          lastMessage: lastMessage || null
        };
      })
    );

    // Sort chats by last message timestamp (most recent first)
    chatsWithLastMessage.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      
      const timeA = new Date(a.lastMessage.createdAt).getTime();
      const timeB = new Date(b.lastMessage.createdAt).getTime();
      return timeB - timeA; // Most recent first
    });

    console.log('User chats with last message:', chatsWithLastMessage);
    return chatsWithLastMessage;
  }

  // New method to get messages for a specific chat
  async getChatMessages(chatId: number): Promise<Message[]> {
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.chatId = :chatId', { chatId })
      .orderBy('message.createdAt', 'ASC')
      .getMany();

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

    return messageWithSender;
  }
}
