-- Christmas Planner Database Schema
-- Run this in Supabase SQL Editor or via migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (family members)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Wish list items
CREATE TABLE IF NOT EXISTS wishes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  url text,
  priority int CHECK (priority BETWEEN 1 AND 3) DEFAULT 2,
  created_at timestamptz DEFAULT now()
);

-- Gift assignments (who is giving what)
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wish_id uuid NOT NULL REFERENCES wishes(id) ON DELETE CASCADE UNIQUE,
  assigned_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Surprise gifts (not requested)
CREATE TABLE IF NOT EXISTS surprise_gifts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  giver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishes_user_id ON wishes(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_wish_id ON assignments(wish_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_by ON assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_surprise_gifts_giver_id ON surprise_gifts(giver_id);
CREATE INDEX IF NOT EXISTS idx_surprise_gifts_recipient_id ON surprise_gifts(recipient_id);

-- Insert test users (replace with real family members later)
INSERT INTO users (email, name) VALUES
  ('victor.95.manuel@gmail.com', 'Victor'),
  ('test1@example.com', 'Usuario Test 1'),
  ('test2@example.com', 'Usuario Test 2')
ON CONFLICT (email) DO NOTHING;
