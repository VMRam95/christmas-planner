-- User Preferences Migration
-- Adds table for storing user notification preferences

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS christmas_planner.user_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES christmas_planner.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications_enabled boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON christmas_planner.user_preferences(user_id);

-- Grant permissions
GRANT ALL ON christmas_planner.user_preferences TO anon, authenticated;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION christmas_planner.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON christmas_planner.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON christmas_planner.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION christmas_planner.update_updated_at_column();

-- Insert default preferences for existing users (all enabled by default)
INSERT INTO christmas_planner.user_preferences (user_id, email_notifications_enabled)
SELECT id, true FROM christmas_planner.users
ON CONFLICT (user_id) DO NOTHING;
