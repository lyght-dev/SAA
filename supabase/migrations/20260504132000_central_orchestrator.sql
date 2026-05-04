create extension if not exists pgcrypto with schema extensions;

create table if not exists public.local_agents (
  agent_id text primary key,
  node_name text not null,
  hostname text not null,
  capabilities jsonb not null default '{}'::jsonb,
  status text not null check (status in ('online', 'stale', 'offline')),
  registered_at timestamptz not null,
  last_seen_at timestamptz not null
);

create table if not exists public.agent_sessions (
  id text primary key,
  agent_id text not null references public.local_agents(agent_id) on delete cascade,
  conversation_id text not null,
  status text not null check (status in ('created', 'bound', 'active', 'waiting_approval', 'completed', 'agent_offline', 'failed')),
  binding jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.agent_commands (
  id text primary key,
  agent_id text not null references public.local_agents(agent_id) on delete cascade,
  session_id text not null references public.agent_sessions(id) on delete cascade,
  type text not null,
  status text not null check (status in ('queued', 'leased', 'acked', 'completed', 'expired', 'failed')),
  payload jsonb not null,
  queued_at timestamptz not null,
  lease_owner text,
  lease_expires_at timestamptz,
  completed_at timestamptz,
  error text,
  result jsonb
);

create table if not exists public.domain_events (
  id text primary key,
  agent_id text not null,
  session_id text not null,
  type text not null,
  occurred_at timestamptz not null,
  payload jsonb not null
);

create table if not exists public.approval_requests (
  id text primary key,
  session_id text not null references public.agent_sessions(id) on delete cascade,
  agent_id text not null references public.local_agents(agent_id) on delete cascade,
  status text not null check (status in ('pending', 'approved', 'denied', 'expired', 'cancelled')),
  tool_name text not null,
  question text not null,
  choices jsonb not null,
  arguments jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null,
  responded_at timestamptz
);

create index if not exists local_agents_status_last_seen_idx
  on public.local_agents (status, last_seen_at desc);

create index if not exists agent_sessions_agent_status_idx
  on public.agent_sessions (agent_id, status);

create index if not exists agent_commands_agent_status_queued_idx
  on public.agent_commands (agent_id, status, queued_at);

create index if not exists agent_commands_lease_expires_idx
  on public.agent_commands (lease_expires_at)
  where status = 'leased';

create index if not exists domain_events_session_occurred_idx
  on public.domain_events (session_id, occurred_at);

create index if not exists approval_requests_session_status_idx
  on public.approval_requests (session_id, status);

alter table public.local_agents enable row level security;
alter table public.agent_sessions enable row level security;
alter table public.agent_commands enable row level security;
alter table public.domain_events enable row level security;
alter table public.approval_requests enable row level security;
