/**
 * GraphQL Schema Files - Modular Approach
 * 
 * This directory contains the GraphQL schema definitions using a modular approach:
 * - base.graphql: Base schema with root Query, Mutation, and Subscription types
 * - user.graphql: User type and extends root types with user operations
 * - message.graphql: Message type and extends root types with message operations  
 * - chat.graphql: Chat type and extends root types with chat operations
 * 
 * This modular approach is recommended for larger applications as it:
 * - Keeps related types and operations together
 * - Makes the schema more maintainable
 * - Allows for better code organization
 * - Supports schema stitching and federation
 * 
 * Usage: Load all .graphql files in your GraphQL module configuration.
 * NestJS will automatically merge all the extended types into a single schema.
 */
