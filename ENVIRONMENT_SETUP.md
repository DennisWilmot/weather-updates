# Environment Variables Setup

This document outlines the environment variables needed for the Twitter/X list scraper integration.

## Vercel Environment Variables

Add these to your Vercel project settings (Project → Settings → Environment Variables):

### Required Variables

1. **`INGEST_TOKEN`** (Server-only)
   - A random 32+ character secret string
   - Used to protect the `/api/ingest` endpoint
   - Generate with: `openssl rand -base64 32`
   - Example: `aBcD1234EfGh5678IjKl9012MnOp3456QrSt7890`

2. **`SUPABASE_SERVICE_ROLE`** (Server-only)
   - Your Supabase service role key
   - Found in Supabase Dashboard → Settings → API
   - Used for server-side database writes
   - **Never expose this to the browser**

### Existing Variables (Already Set)

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## GitHub Repository Secrets

Add these to your GitHub repository (Settings → Secrets and variables → Actions):

### Required Secrets

1. **`INGEST_URL`**
   - Your deployed app's ingest endpoint
   - Format: `https://yourdomain.com/api/ingest`
   - Example: `https://hurricane-melissa-update.vercel.app/api/ingest`

2. **`INGEST_TOKEN`**
   - Same token as set in Vercel
   - Must match exactly for authentication

### Optional Variables

1. **`TW_LIST`** (Repository Variable)
   - The Twitter/X list ID to scrape
   - Default: `1981892452895117355`
   - Can be overridden if you want to scrape a different list

## Database Setup

### Supabase SQL Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Create tweets table for storing scraped Twitter/X list data
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

-- Add RLS (Row Level Security) policies
alter table public.tweets enable row level security;

-- Allow public read access to tweets
create policy "Allow public read access to tweets" on public.tweets
  for select using (true);

-- Allow service role to insert/update tweets
create policy "Allow service role to manage tweets" on public.tweets
  for all using (auth.role() = 'service_role');
```

## Testing Checklist

1. ✅ Deploy Next.js app with new routes
2. ✅ Set all Vercel environment variables
3. ✅ Set GitHub Secrets
4. ✅ Run SQL migration in Supabase
5. ✅ Manually trigger GitHub workflow (Actions → "Run workflow")
6. ✅ Verify tweets appear at `/api/tweets`
7. ✅ Check News Feed tab displays tweets correctly
8. ✅ Confirm 10-minute auto-refresh works

## Local Testing

To test the scraper locally:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Test the scraper (without pushing to API)
python test_scraper.py

# Test with actual API push (requires INGEST_TOKEN)
INGEST_TOKEN=your-token python scrape_and_push.py
```

## Emergency Cleanup (After 1-2 weeks)

When the emergency period ends:

1. **Disable GitHub workflow:**
   - Go to Actions → scrape.yml → Disable workflow
   - Or change cron to `"0 0 0 1 1 *"` (never runs)

2. **Optional cleanup:**
   - Delete `INGEST_TOKEN` from Vercel and GitHub
   - Tweets remain archived in Supabase for historical record

3. **Keep running:**
   - News Feed tab can remain live showing archived data
   - No need to remove the code or database
