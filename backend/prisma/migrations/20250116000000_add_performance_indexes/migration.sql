-- Add performance indexes for serverless optimization

-- Messages table indexes for chat queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_messages_chat_created" 
ON "messages"("chatId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_messages_role_created" 
ON "messages"("role", "createdAt" DESC);

-- User memories indexes for fast retrieval
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_memories_user_type" 
ON "user_memories"("userId", "type", "updatedAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_memories_confidence" 
ON "user_memories"("confidence" DESC, "updatedAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_memories_category" 
ON "user_memories"("category", "updatedAt" DESC);

-- User embeddings indexes for vector search
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_embeddings_user_type" 
ON "user_embeddings"("userId", "type", "createdAt" DESC);

-- Chats table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chats_user_updated" 
ON "chats"("userId", "updatedAt" DESC);

-- Usage tracking indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_usage_user_hour" 
ON "message_usage"("userId", "hour" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_image_usage_user_day" 
ON "image_usage"("userId", "day" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_deep_research_usage_user_day" 
ON "deep_research_usage"("userId", "day" DESC);

-- Admin actions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_admin_actions_admin_created" 
ON "admin_actions"("adminId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_admin_actions_action_created" 
ON "admin_actions"("action", "createdAt" DESC);

-- Subscription indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_subscriptions_status" 
ON "subscriptions"("status", "updatedAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_subscriptions_plan_type" 
ON "subscriptions"("planType", "updatedAt" DESC);

-- User table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_email" 
ON "users"("email");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_clerk_id" 
ON "users"("clerkId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_role" 
ON "users"("role");

-- Composite index for user lookups with subscriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_subscription_status" 
ON "users"("role", "createdAt" DESC);

-- Add partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_messages_active_chats" 
ON "messages"("chatId", "createdAt" DESC) 
WHERE "role" IN ('user', 'assistant');

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_memories_active" 
ON "user_memories"("userId", "updatedAt" DESC) 
WHERE "confidence" > 0.5;

-- Text search indexes for memory content (if using PostgreSQL)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_memories_content_search" 
-- ON "user_memories" USING gin(to_tsvector('english', "key" || ' ' || "value"));

-- Create index for message content search (if needed)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_messages_content_search" 
-- ON "messages" USING gin(to_tsvector('english', "content"));