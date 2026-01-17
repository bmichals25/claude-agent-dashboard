-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Sessions table (groups messages, tasks, projects for a chat session)
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text
);

-- Messages table (chat history)
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  agent_id text
);

-- Projects table
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  color text not null default '#6366f1'
);

-- Tasks table
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
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
create table if not exists stream_entries (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  agent_id text not null,
  type text not null check (type in ('thought', 'action', 'result', 'error')),
  content text not null
);

-- Events table (activity log)
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  type text not null check (type in ('task_created', 'task_assigned', 'task_completed', 'agent_thinking', 'agent_action', 'error', 'delegation')),
  agent_id text,
  task_id uuid references tasks(id) on delete set null,
  message text not null,
  data jsonb
);

-- Create indexes for common queries
create index if not exists idx_messages_session on messages(session_id);
create index if not exists idx_messages_created on messages(created_at);
create index if not exists idx_tasks_session on tasks(session_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_agent on tasks(assigned_agent_id);
create index if not exists idx_stream_entries_task on stream_entries(task_id);
create index if not exists idx_events_session on events(session_id);
create index if not exists idx_events_created on events(created_at);

-- Enable Row Level Security
alter table sessions enable row level security;
alter table messages enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table stream_entries enable row level security;
alter table events enable row level security;

-- Create policies (open access for now - can be tightened with auth)
create policy "Allow all access to sessions" on sessions for all using (true);
create policy "Allow all access to messages" on messages for all using (true);
create policy "Allow all access to projects" on projects for all using (true);
create policy "Allow all access to tasks" on tasks for all using (true);
create policy "Allow all access to stream_entries" on stream_entries for all using (true);
create policy "Allow all access to events" on events for all using (true);

-- Enable realtime for live updates
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table stream_entries;
alter publication supabase_realtime add table events;

-- Function to update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_sessions_updated_at
  before update on sessions
  for each row execute function update_updated_at();

create trigger update_projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create trigger update_tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();
