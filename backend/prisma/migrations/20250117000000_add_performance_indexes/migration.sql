-- Add indexes for faster query performance

-- Index for chat lookups by user
CREATE INDEX IF NOT EXISTS "idx_chats_userId" ON "chats"("userId");

-- Index for messages lookups by chat
CREATE INDEX IF NOT EXISTS "idx_messages_chatId" ON "messages"("chatId");

-- Composite index for messages ordered by creation date within a chat
CREATE INDEX IF NOT EXISTS "idx_messages_chatId_createdAt" ON "messages"("chatId", "createdAt");

-- Index for user memories lookups
CREATE INDEX IF NOT EXISTS "idx_user_memories_userId" ON "user_memories"("userId");

-- Composite index for recent memories by user
CREATE INDEX IF NOT EXISTS "idx_user_memories_userId_createdAt" ON "user_memories"("userId", "createdAt" DESC);

-- Index for user context lookups
CREATE INDEX IF NOT EXISTS "idx_user_contexts_userId" ON "user_contexts"("userId");

-- Index for user embeddings lookups
CREATE INDEX IF NOT EXISTS "idx_user_embeddings_userId" ON "user_embeddings"("user_id");

-- Index for message usage tracking
CREATE INDEX IF NOT EXISTS "idx_message_usage_userId_hour" ON "message_usage"("userId", "hour");

-- Index for subscription lookups
CREATE INDEX IF NOT EXISTS "idx_subscriptions_userId" ON "subscriptions"("userId");

-- Index for faster user lookups by clerkId
CREATE INDEX IF NOT EXISTS "idx_users_clerkId" ON "users"("clerkId");