-- Notifications Migration
-- Adds table for storing in-app notifications

-- Create notifications table
CREATE TABLE IF NOT EXISTS christmas_planner.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES christmas_planner.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'new_wish',
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON christmas_planner.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON christmas_planner.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON christmas_planner.notifications(created_at DESC);

-- Grant permissions
GRANT ALL ON christmas_planner.notifications TO anon, authenticated;
