-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to user_embeddings table if not exists
DO $$ 
BEGIN 
    -- Drop the existing text column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_embeddings' 
        AND column_name = 'vector_embedding'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE user_embeddings DROP COLUMN vector_embedding;
    END IF;
    
    -- Add vector column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_embeddings' 
        AND column_name = 'vector_embedding'
    ) THEN
        ALTER TABLE user_embeddings ADD COLUMN vector_embedding vector(1536); -- OpenAI embeddings are 1536 dimensions
    END IF;
END $$;

-- Create index for vector similarity search (removed CONCURRENTLY for transaction compatibility)
CREATE INDEX IF NOT EXISTS user_embeddings_vector_idx 
ON user_embeddings 
USING ivfflat (vector_embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create function for semantic search
CREATE OR REPLACE FUNCTION search_user_memories(
    user_id_param TEXT,
    query_embedding vector(1536),
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INT DEFAULT 10
)
RETURNS TABLE (
    id TEXT,
    content TEXT,
    type TEXT,
    metadata JSONB,
    similarity FLOAT,
    created_at TIMESTAMP
)
LANGUAGE sql STABLE
AS $$
    SELECT 
        ue.id,
        ue.content,
        ue.type,
        ue.metadata,
        1 - (ue.vector_embedding <=> query_embedding) as similarity,
        ue.created_at
    FROM user_embeddings ue
    WHERE ue.user_id = user_id_param
    AND 1 - (ue.vector_embedding <=> query_embedding) > similarity_threshold
    ORDER BY ue.vector_embedding <=> query_embedding
    LIMIT max_results;
$$;