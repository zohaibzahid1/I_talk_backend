# Chat Application Schema and Entities

This project contains the TypeORM entities and GraphQL schemas for a real-time chat application.

## TypeORM Entities

### User Entity (`/entities/users.entity.ts`)
- `id`: Primary key
- `email`: Unique email address
- `isOnline`: Online status (default: false)
- `googleId`: Google OAuth ID (nullable)
- `refreshToken`: JWT refresh token (nullable)
- **Relations:**
  - `messages`: One-to-many with Message entity
  - `chats`: Many-to-many with Chat entity

### Message Entity (`/entities/message.entity.ts`)
- `id`: Primary key
- `content`: Message content
- `createdAt`: Timestamp (auto-generated)
- **Relations:**
  - `sender`: Many-to-one with User entity
  - `chat`: Many-to-one with Chat entity

### Chat Entity (`/entities/chat.entity.ts`)
- `id`: Primary key
- `isGroup`: Boolean indicating if it's a group chat
- `name`: Chat name (nullable, mainly for group chats)
- **Relations:**
  - `participants`: Many-to-many with User entity (uses join table)
  - `messages`: One-to-many with Message entity

## GraphQL Schema

### Main Schema (`/graphql/schema.graphql`)
Complete schema with all types, queries, mutations, and subscriptions.

### Individual Type Schemas
- `/graphql/user.graphql`: User type and operations
- `/graphql/message.graphql`: Message type and operations
- `/graphql/chat.graphql`: Chat type and operations

### Key Features
- **Queries**: Get users, chats, and messages
- **Mutations**: Create chats, send messages, update user status
- **Subscriptions**: Real-time message updates and user status changes
- **Custom Scalars**: DateTime for timestamp handling

## Usage

1. **TypeORM**: Import entities in your TypeORM configuration
2. **GraphQL**: Use the schema files with your GraphQL setup (Code First or Schema First)
3. **Relations**: The entities use string-based relations to avoid circular dependencies

## Database Tables

The entities will create the following tables:
- `user`: User information and auth data
- `message`: Chat messages with references to sender and chat
- `chat`: Chat rooms/conversations
- `chat_participants_user`: Join table for chat participants (auto-created by TypeORM)
