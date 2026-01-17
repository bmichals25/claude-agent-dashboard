-- Agent Dashboard Tables (prefixed with dashboard_)
-- These tables support the Claude Agent Dashboard UI
-- Deployed to: Muse Agents project (qtjnjagyqycbxjqzmcip)

-- Sessions table (groups messages, tasks, projects for a chat session)
create table if not exists dashboard_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  name text
);

-- Messages table (chat history)
create table if not exists dashboard_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references dashboard_sessions(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  agent_id text
);

-- Projects table
create table if not exists dashboard_projects (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references dashboard_sessions(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  color text not null default '#6366f1'
);

-- Tasks table
create table if not exists dashboard_tasks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references dashboard_sessions(id) on delete cascade not null,
  project_id uuid references dashboard_projects(id) on delete set null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'review', 'completed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  assigned_agent_id text,
  delegated_from text,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  current_step text
);

-- Stream entries table (live output from agents)
create table if not exists dashboard_stream_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references dashboard_tasks(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  agent_id text not null,
  type text not null check (type in ('thought', 'action', 'result', 'error')),
  content text not null
);

-- Events table (activity log)
create table if not exists dashboard_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references dashboard_sessions(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  type text not null check (type in ('task_created', 'task_assigned', 'task_completed', 'agent_thinking', 'agent_action', 'error', 'delegation')),
  agent_id text,
  task_id uuid references dashboard_tasks(id) on delete set null,
  message text not null,
  data jsonb
);

-- Create indexes for common queries
create index if not exists idx_dashboard_messages_session on dashboard_messages(session_id);
create index if not exists idx_dashboard_messages_created on dashboard_messages(created_at);
create index if not exists idx_dashboard_tasks_session on dashboard_tasks(session_id);
create index if not exists idx_dashboard_tasks_status on dashboard_tasks(status);
create index if not exists idx_dashboard_tasks_agent on dashboard_tasks(assigned_agent_id);
create index if not exists idx_dashboard_stream_entries_task on dashboard_stream_entries(task_id);
create index if not exists idx_dashboard_events_session on dashboard_events(session_id);
create index if not exists idx_dashboard_events_created on dashboard_events(created_at);

-- Enable Row Level Security
alter table dashboard_sessions enable row level security;
alter table dashboard_messages enable row level security;
alter table dashboard_projects enable row level security;
alter table dashboard_tasks enable row level security;
alter table dashboard_stream_entries enable row level security;
alter table dashboard_events enable row level security;

-- Create policies (open access for now - can be tightened with auth)
create policy "Allow all access to dashboard_sessions" on dashboard_sessions for all using (true);
create policy "Allow all access to dashboard_messages" on dashboard_messages for all using (true);
create policy "Allow all access to dashboard_projects" on dashboard_projects for all using (true);
create policy "Allow all access to dashboard_tasks" on dashboard_tasks for all using (true);
create policy "Allow all access to dashboard_stream_entries" on dashboard_stream_entries for all using (true);
create policy "Allow all access to dashboard_events" on dashboard_events for all using (true);

-- Enable realtime for live updates
alter publication supabase_realtime add table dashboard_tasks;
alter publication supabase_realtime add table dashboard_stream_entries;
alter publication supabase_realtime add table dashboard_events;

-- Function to update updated_at timestamp
create or replace function dashboard_update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_dashboard_sessions_updated_at
  before update on dashboard_sessions
  for each row execute function dashboard_update_updated_at();

create trigger update_dashboard_projects_updated_at
  before update on dashboard_projects
  for each row execute function dashboard_update_updated_at();

create trigger update_dashboard_tasks_updated_at
  before update on dashboard_tasks
  for each row execute function dashboard_update_updated_at();
