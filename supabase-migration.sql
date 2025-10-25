-- Create tweets table for storing scraped Twitter/X list data
-- Run this in Supabase SQL Editor

create table if not exists public.tweets (
  id text primary key,
  author text,
  handle text,
  created_at timestamptz,
  text text,
  url text,
  raw jsonb
);

-- Add index for efficient sorting by creation time
create index if not exists tweets_created_at_idx on public.tweets (created_at desc);

-- Add RLS (Row Level Security) policies if needed
-- For now, we'll allow public read access to tweets
alter table public.tweets enable row level security;

-- Allow public read access to tweets
create policy "Allow public read access to tweets" on public.tweets
  for select using (true);

-- Allow service role to insert/update tweets
create policy "Allow service role to manage tweets" on public.tweets
  for all using (auth.role() = 'service_role');
