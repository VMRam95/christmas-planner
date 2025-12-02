-- Christmas Planner Database Schema
-- Uses dedicated 'christmas_planner' schema to isolate from other projects
-- Run this in Supabase SQL Editor

-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS christmas_planner;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant usage on schema to authenticated and anon roles
GRANT USAGE ON SCHEMA christmas_planner TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA christmas_planner TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA christmas_planner TO anon, authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA christmas_planner
GRANT ALL ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA christmas_planner
GRANT ALL ON SEQUENCES TO anon, authenticated;

-- Users table (family members)
CREATE TABLE IF NOT EXISTS christmas_planner.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Wish list items
CREATE TABLE IF NOT EXISTS christmas_planner.wishes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES christmas_planner.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  url text,
  priority int CHECK (priority BETWEEN 1 AND 3) DEFAULT 2,
  created_at timestamptz DEFAULT now()
);

-- Gift assignments (who is giving what)
CREATE TABLE IF NOT EXISTS christmas_planner.assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wish_id uuid NOT NULL REFERENCES christmas_planner.wishes(id) ON DELETE CASCADE UNIQUE,
  assigned_by uuid NOT NULL REFERENCES christmas_planner.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Surprise gifts (not requested, direct gifts)
CREATE TABLE IF NOT EXISTS christmas_planner.surprise_gifts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  giver_id uuid NOT NULL REFERENCES christmas_planner.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES christmas_planner.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  url text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishes_user_id ON christmas_planner.wishes(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_wish_id ON christmas_planner.assignments(wish_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_by ON christmas_planner.assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_surprise_gifts_giver_id ON christmas_planner.surprise_gifts(giver_id);
CREATE INDEX IF NOT EXISTS idx_surprise_gifts_recipient_id ON christmas_planner.surprise_gifts(recipient_id);

-- Insert admin user (replace with real family members later)
INSERT INTO christmas_planner.users (email, name) VALUES
  ('victor.95.manuel@gmail.com', 'Victor')
ON CONFLICT (email) DO NOTHING;
