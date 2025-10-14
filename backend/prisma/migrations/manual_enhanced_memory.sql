-- Add new columns to existing UserMemory table
ALTER TABLE "UserMemory" 
ADD COLUMN IF NOT EXISTS "relationships" JSONB,
ADD COLUMN IF NOT EXISTS "temporalDecay" DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS "accessCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "emotionalWeight" DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS "verificationLevel" VARCHAR(20) DEFAULT 'explicit',
ADD COLUMN IF NOT EXISTS "validFrom" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "qualityScore" DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS "lastAccessed" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "synthesisLevel" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "supportingMemories" TEXT[],
ADD COLUMN IF NOT EXISTS "contradictionCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastVerified" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "expectedChangeFreq" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "sensitivityLevel" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "contextualRelevance" DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS "lifeDomain" VARCHAR(50);

-- Create new tables for enhanced memory system
CREATE TABLE IF NOT EXISTS "memory_relationships" (
    "id" TEXT NOT NULL,
    "sourceMemoryId" TEXT NOT NULL,
    "targetMemoryId" TEXT NOT NULL,
    "relationshipType" VARCHAR(50) NOT NULL,
    "strength" DECIMAL(3,2) NOT NULL,
    "bidirectional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_relationships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cognitive_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternType" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "confidence" DECIMAL(3,2) NOT NULL,
    "firstObserved" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastObserved" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "contexts" JSONB,
    "impact" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cognitive_patterns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "emotional_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "baselineMood" VARCHAR(50),
    "emotionalTriggers" JSONB,
    "copingMechanisms" JSONB,
    "stressIndicators" JSONB,
    "emotionalVocabulary" JSONB,
    "empathyLevel" DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    "emotionalRegulation" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emotional_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "life_contexts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contextType" VARCHAR(50) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "impact" VARCHAR(20),
    "associatedMemories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_contexts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "behavioral_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternType" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "triggers" JSONB,
    "frequency" VARCHAR(20),
    "contexts" JSONB,
    "outcomes" JSONB,
    "confidence" DECIMAL(3,2) NOT NULL,
    "firstObserved" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastObserved" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "behavioral_patterns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "value_systems" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "valueName" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50),
    "importance" DECIMAL(3,2) NOT NULL,
    "description" TEXT,
    "evidence" JSONB,
    "conflicts" JSONB,
    "evolution" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "value_systems_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "self_concepts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptType" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "evidence" JSONB,
    "contradictions" JSONB,
    "sources" JSONB,
    "impact" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "self_concepts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "temporal_evolutions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" TEXT NOT NULL,
    "changeType" VARCHAR(50) NOT NULL,
    "previousState" JSONB,
    "newState" JSONB,
    "changeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "catalyst" TEXT,
    "impact" VARCHAR(20),
    "confidence" DECIMAL(3,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temporal_evolutions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reflective_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insightType" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "relatedMemories" TEXT[],
    "patterns" JSONB,
    "confidence" DECIMAL(3,2) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "impact" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reflective_insights_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "memory_relationships_source_idx" ON "memory_relationships"("sourceMemoryId");
CREATE INDEX IF NOT EXISTS "memory_relationships_target_idx" ON "memory_relationships"("targetMemoryId");
CREATE INDEX IF NOT EXISTS "cognitive_patterns_user_idx" ON "cognitive_patterns"("userId");
CREATE INDEX IF NOT EXISTS "cognitive_patterns_type_idx" ON "cognitive_patterns"("patternType");
CREATE INDEX IF NOT EXISTS "emotional_profiles_user_idx" ON "emotional_profiles"("userId");
CREATE INDEX IF NOT EXISTS "life_contexts_user_idx" ON "life_contexts"("userId");
CREATE INDEX IF NOT EXISTS "behavioral_patterns_user_idx" ON "behavioral_patterns"("userId");
CREATE INDEX IF NOT EXISTS "value_systems_user_idx" ON "value_systems"("userId");
CREATE INDEX IF NOT EXISTS "self_concepts_user_idx" ON "self_concepts"("userId");
CREATE INDEX IF NOT EXISTS "temporal_evolutions_user_idx" ON "temporal_evolutions"("userId");
CREATE INDEX IF NOT EXISTS "reflective_insights_user_idx" ON "reflective_insights"("userId");