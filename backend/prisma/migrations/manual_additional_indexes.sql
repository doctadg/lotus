-- Additional performance indexes for chat optimization
-- These indexes complement the existing ones

-- Ensure chat table has the basic userId index if not already present
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chats_user_id" 
ON "chats"("userId");

-- Ensure messages table has the basic chatId index if not already present  
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_messages_chat_id" 
ON "messages"("chatId");

-- Composite index for chat listing with message counts
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chats_user_created_desc" 
ON "chats"("userId", "createdAt" DESC);