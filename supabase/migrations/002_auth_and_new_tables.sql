-- Claude Agent Dashboard - Auth & New Tables Migration
-- Run this SQL in Supabase SQL Editor after enabling Auth

-- ===========================================
-- New Tables for Netlify Deployment
-- ===========================================

-- Settings per user/session
CREATE TABLE IF NOT EXISTS dashboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES dashboard_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  theme TEXT DEFAULT 'dark',
  accent_color TEXT DEFAULT '#00fff0',
  show_notifications BOOLEAN DEFAULT true,
  auto_scroll_chat BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  sound_volume DECIMAL DEFAULT 0.5,
  app_name TEXT DEFAULT 'Claude Agent',
  app_tagline TEXT DEFAULT '19-Agent Orchestration',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id)
);

-- Skills (replaces filesystem storage)
CREATE TABLE IF NOT EXISTS dashboard_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  skill_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  content TEXT NOT NULL,
  github_url TEXT,
  is_installed BOOLEAN DEFAULT true,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Agent configs (replaces filesystem storage)
CREATE TABLE IF NOT EXISTS dashboard_agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  agent_id TEXT NOT NULL,
  config_content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_id)
);

-- Project appearance settings
CREATE TABLE IF NOT EXISTS dashboard_project_appearance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES dashboard_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  project_id TEXT NOT NULL,
  logo_url TEXT,
  background_color TEXT,
  background_preset TEXT,
  hero_background_image TEXT,
  subtitle TEXT,
  slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, project_id)
);

-- ===========================================
-- Add user_id to existing tables
-- ===========================================

ALTER TABLE dashboard_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE dashboard_tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE dashboard_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE dashboard_projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE dashboard_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE dashboard_stream_entries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- ===========================================
-- Additional Indexes
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_sessions_user ON dashboard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON dashboard_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON dashboard_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON dashboard_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user ON dashboard_events(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_session ON dashboard_settings(session_id);
CREATE INDEX IF NOT EXISTS idx_settings_user ON dashboard_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_user ON dashboard_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_user ON dashboard_agent_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_project_appearance_session ON dashboard_project_appearance(session_id);
CREATE INDEX IF NOT EXISTS idx_project_appearance_user ON dashboard_project_appearance(user_id);

-- ===========================================
-- Enable RLS on new tables
-- ===========================================

ALTER TABLE dashboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_project_appearance ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- Drop old open policies and create user-scoped policies
-- ===========================================

-- Sessions
DROP POLICY IF EXISTS "Allow all access to dashboard_sessions" ON dashboard_sessions;
CREATE POLICY "Users can access own sessions" ON dashboard_sessions
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Tasks
DROP POLICY IF EXISTS "Allow all access to dashboard_tasks" ON dashboard_tasks;
CREATE POLICY "Users can access own tasks" ON dashboard_tasks
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Messages
DROP POLICY IF EXISTS "Allow all access to dashboard_messages" ON dashboard_messages;
CREATE POLICY "Users can access own messages" ON dashboard_messages
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Projects
DROP POLICY IF EXISTS "Allow all access to dashboard_projects" ON dashboard_projects;
CREATE POLICY "Users can access own projects" ON dashboard_projects
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Events
DROP POLICY IF EXISTS "Allow all access to dashboard_events" ON dashboard_events;
CREATE POLICY "Users can access own events" ON dashboard_events
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Stream entries
DROP POLICY IF EXISTS "Allow all access to dashboard_stream_entries" ON dashboard_stream_entries;
CREATE POLICY "Users can access own stream entries" ON dashboard_stream_entries
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Settings
CREATE POLICY "Users can access own settings" ON dashboard_settings
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Skills
CREATE POLICY "Users can access own skills" ON dashboard_skills
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Agent configs
CREATE POLICY "Users can access own agent configs" ON dashboard_agent_configs
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Project appearance
CREATE POLICY "Users can access own project appearance" ON dashboard_project_appearance
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- ===========================================
-- Updated timestamp triggers for new tables
-- ===========================================

CREATE TRIGGER update_dashboard_settings_updated_at
  BEFORE UPDATE ON dashboard_settings
  FOR EACH ROW EXECUTE FUNCTION dashboard_update_updated_at();

CREATE TRIGGER update_dashboard_agent_configs_updated_at
  BEFORE UPDATE ON dashboard_agent_configs
  FOR EACH ROW EXECUTE FUNCTION dashboard_update_updated_at();

CREATE TRIGGER update_dashboard_project_appearance_updated_at
  BEFORE UPDATE ON dashboard_project_appearance
  FOR EACH ROW EXECUTE FUNCTION dashboard_update_updated_at();

-- ===========================================
-- Enable realtime for new tables
-- ===========================================

ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_skills;
ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_agent_configs;
