-- Add imageUrl column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;