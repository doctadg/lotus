-- Enhanced Memory System Migration
-- This migration adds support for deep user understanding and mirroring capabilities

-- Add enhanced fields to user_memories table
ALTER TABLE "user_memories" 
ADD COLUMN "relationships" JSONB,
ADD COLUMN "temporal_decay" FLOAT DEFAULT 0.0,
ADD COLUMN "access_frequency" INTEGER DEFAULT 0,
ADD COLUMN "emotional_weight" FLOAT DEFAULT 0.0,
ADD COLUMN "verification_level" TEXT DEFAULT 'explicit',
ADD COLUMN "valid_from" TIMESTAMP DEFAULT NOW(),
ADD COLUMN "valid_until" TIMESTAMP,
ADD COLUMN "quality_score" FLOAT DEFAULT 0.5,
ADD COLUMN "last_accessed" TIMESTAMP DEFAULT NOW(),
ADD COLUMN "access_count" INTEGER DEFAULT 0,
ADD COLUMN "synthesis_level" TEXT DEFAULT 'concrete',
ADD COLUMN "supporting_memories" TEXT[],
ADD COLUMN "contradiction_count" INTEGER DEFAULT 0,
ADD COLUMN "last_verified" TIMESTAMP DEFAULT NOW(),
ADD COLUMN "expected_change_freq" TEXT DEFAULT 'static',
ADD COLUMN "sensitivity_level" TEXT DEFAULT 'public',
ADD COLUMN "contextual_relevance" FLOAT DEFAULT 0.5,
ADD COLUMN "life_domain" TEXT;

-- Create indexes for enhanced memory fields
CREATE INDEX IF NOT EXISTS "idx_user_memories_type" ON "user_memories"("userId", "type");
CREATE INDEX IF NOT EXISTS "idx_user_memories_quality" ON "user_memories"("userId", "quality_score");
CREATE INDEX IF NOT EXISTS "idx_user_memories_last_accessed" ON "user_memories"("userId", "last_accessed");
CREATE INDEX IF NOT EXISTS "idx_user_memories_life_domain" ON "user_memories"("userId", "life_domain");

-- Create memory relationships table
CREATE TABLE IF NOT EXISTS "memory_relationships" (
    "id" TEXT NOT NULL,
    "source_memory_id" TEXT NOT NULL,
    "target_memory_id" TEXT NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "strength" FLOAT NOT NULL DEFAULT 0.5,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

    CONSTRAINT "memory_relationships_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for memory relationships
CREATE UNIQUE INDEX IF NOT EXISTS "memory_relationships_source_target_type_unique" 
ON "memory_relationships"("source_memory_id", "target_memory_id", "relationship_type");

-- Create cognitive patterns table
CREATE TABLE IF NOT EXISTS "cognitive_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pattern_type" TEXT NOT NULL,
    "pattern_value" TEXT NOT NULL,
    "confidence" FLOAT NOT NULL DEFAULT 0.5,
    "evidence" JSONB,
    "last_observed" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "observation_count" INTEGER NOT NULL DEFAULT 1,
    "strength" FLOAT NOT NULL DEFAULT 0.5,
    "context" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

    CONSTRAINT "cognitive_patterns_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for cognitive patterns
CREATE UNIQUE INDEX IF NOT EXISTS "cognitive_patterns_user_type_value_unique" 
ON "cognitive_patterns"("userId", "pattern_type", "pattern_value");

-- Create emotional profiles table
CREATE TABLE IF NOT EXISTS "emotional_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "baseline_mood" TEXT,
    "emotional_triggers" JSONB,
    "coping_mechanisms" JSONB,
    "stress_indicators" JSONB,
    "emotional_vocabulary" TEXT[],
    "empathy_level" FLOAT DEFAULT 0.5,
    "emotional_regulation" JSONB,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

    CONSTRAINT "emotional_profiles_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for emotional profiles
CREATE UNIQUE INDEX IF NOT EXISTS "emotional_profiles_userId_unique" 
ON "emotional_profiles"("userId");

-- Create life contexts table
CREATE TABLE IF NOT EXISTS "life_contexts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "current_life_phase" TEXT,
    "primary_roles" JSONB,
    "life_goals" JSONB,
    "current_challenges" JSONB,
    "support_system" JSONB,
    "environmental_factors" JSONB,
    "time_constraints" JSONB,
    "financial_context" JSONB,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

    CONSTRAINT "life_contexts_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for life contexts
CREATE UNIQUE INDEX IF NOT EXISTS "life_contexts_userId_unique" 
ON "life_contexts"("userId");

-- Create behavioral patterns table
CREATE TABLE IF NOT EXISTS "behavioral_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pattern_category" TEXT NOT NULL,
    "pattern_type" TEXT NOT NULL,
    "pattern_data" JSONB NOT NULL,
    "strength" FLOAT NOT NULL DEFAULT 0.5,
    "frequency" FLOAT DEFAULT 0.0,
    "last_observed" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "observation_count" INTEGER NOT NULL DEFAULT 1,
    "context" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

    CONSTRAINT "behavioral_patterns_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for behavioral patterns
CREATE UNIQUE INDEX IF NOT EXISTS "behavioral_patterns_user_category_type_unique" 
ON "behavioral_patterns"("userId", "pattern_category", "pattern_type");

-- Create value systems table
CREATE TABLE IF NOT EXISTS "value_systems" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "core_values" JSONB NOT NULL,
    "ethical_principles" JSONB,
    "belief_systems" JSONB,
    "priorities" JSONB,
    "non_negotiables" TEXT[],
    "growth_areas" JSONB,
    "conflict_resolution" TEXT,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

    CONSTRAINT "value_systems_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for value systems
CREATE UNIQUE INDEX IF NOT EXISTS "value_systems_userId_unique" 
ON "value_systems"("userId");

-- Create self concepts table
CREATE TABLE IF NOT EXISTS "self_concepts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "identity_labels" TEXT[],
    "self_perception" JSONB,
    "aspirational_self" JSONB,
    "perceived_strengths" JSONB,
    "perceived_weaknesses" JSONB,
    "growth_mindset" FLOAT DEFAULT 0.5,
    "self_awareness" FLOAT DEFAULT 0.5,
    "narrative_identity" TEXT,
    "confidence_level" FLOAT DEFAULT 0.5,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

    CONSTRAINT "self_concepts_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for self concepts
CREATE UNIQUE INDEX IF NOT EXISTS "self_concepts_userId_unique" 
ON "self_concepts"("userId");

-- Create temporal evolutions table
CREATE TABLE IF NOT EXISTS "temporal_evolutions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "evolution_type" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "previous_state" JSONB,
    "current_state" JSONB,
    "change_date" TIMESTAMP(3) NOT NULL,
    "confidence" FLOAT NOT NULL DEFAULT 0.5,
    "evidence" JSONB,
    "significance" FLOAT DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

    CONSTRAINT "temporal_evolutions_pkey" PRIMARY KEY ("id")
);

-- Create indexes for temporal evolutions
CREATE INDEX IF NOT EXISTS "idx_temporal_evolutions_user_type_date" 
ON "temporal_evolutions"("userId", "evolution_type", "change_date");

-- Create reflective insights table
CREATE TABLE IF NOT EXISTS "reflective_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insight_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "impact" TEXT,
    "suggestions" TEXT[],
    "confidence" FLOAT NOT NULL DEFAULT 0.5,
    "category" TEXT,
    "is_viewed" BOOLEAN NOT NULL DEFAULT false,
    "user_feedback" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

    CONSTRAINT "reflective_insights_pkey" PRIMARY KEY ("id")
);

-- Create indexes for reflective insights
CREATE INDEX IF NOT EXISTS "idx_reflective_insights_user_type_viewed" 
ON "reflective_insights"("userId", "insight_type", "is_viewed");

-- Update the _prisma_migrations table
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES 
(
    '20251014170846_enhanced_memory_system',
    '0000000000000000000000000000000000000000000000000000000000000000',
    NOW(),
    'enhanced_memory_system',
    '',
    NULL,
    NOW(),
    1
) ON CONFLICT ("id") DO NOTHING;