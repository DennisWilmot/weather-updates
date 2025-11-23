# Deployment Guide - Matching Service

## Cloudflare Workers Deployment

### Prerequisites

1. **Wrangler CLI** (already installed as dev dependency)
   ```bash
   # Verify installation
   npx wrangler --version
   ```

2. **Cloudflare Account**
   - Sign up at https://dash.cloudflare.com
   - Free tier is sufficient for testing

### Initial Setup

1. **Authenticate with Cloudflare**
   ```bash
   cd matching-service
   npx wrangler login
   ```
   This will open your browser to authenticate. Follow the prompts.

2. **Set Environment Variables (Secrets)**
   
   Cloudflare Workers use secrets for sensitive environment variables:
   
   ```bash
   # Required: Database connection string
   npx wrangler secret put DATABASE_URL
   # When prompted, paste your PostgreSQL connection string:
   # postgresql://user:password@host:port/database
   
   # Optional: CORS origin (comma-separated list)
   npx wrangler secret put CORS_ORIGIN
   # Example: https://yourdomain.com,http://localhost:3000
   # Or use '*' for all origins (development only)
   
   # Optional: Environment
   npx wrangler secret put NODE_ENV
   # Enter: production
   ```

### Local Development

Test your service locally before deploying:

```bash
# Start local Cloudflare Workers environment
npm run cf:dev

# Or directly:
npx wrangler dev
```

This will:
- Start a local server (usually on http://localhost:8787)
- Use your local `.env` file for environment variables
- Hot-reload on code changes

### Deploy to Cloudflare Workers

```bash
# Deploy to production
npm run cf:deploy

# Or directly:
npx wrangler deploy
```

**First deployment:**
- Wrangler will ask you to confirm the deployment
- It will create a new Worker with the name from `wrangler.toml`
- You'll get a URL like: `https://matching-service.your-subdomain.workers.dev`

**Subsequent deployments:**
- Just run `npm run cf:deploy` to update the Worker

### Deploy to Specific Environment

```bash
# Deploy to staging
npx wrangler deploy --env staging

# Deploy to production
npx wrangler deploy --env production
```

### Verify Deployment

After deployment, test your endpoints:

```bash
# Health check
curl https://matching-service.your-subdomain.workers.dev/health

# Should return:
# {
#   "status": "ok",
#   "timestamp": "...",
#   "service": "matching-service",
#   "version": "0.1.0"
# }
```

### Update Secrets

To update a secret:

```bash
npx wrangler secret put DATABASE_URL
# Enter new value when prompted
```

To delete a secret:

```bash
npx wrangler secret delete DATABASE_URL
```

### View Logs

```bash
# View real-time logs
npx wrangler tail

# View logs for specific environment
npx wrangler tail --env production
```

### Important Notes

#### Database Connection Limitations

⚠️ **Important**: The `postgres` npm package uses Node.js-specific APIs that **do not work** in Cloudflare Workers.

**Options:**

1. **Use HTTP-based database APIs** (Recommended for Cloudflare)
   - Use Supabase REST API or PostgREST
   - Modify `src/db/loadProblem.ts` to use `fetch()` instead of `postgres`
   - Example: `fetch('https://your-project.supabase.co/rest/v1/warehouses')`

2. **Deploy to Node.js platform instead** (Recommended for production)
   - Railway, Fly.io, or Render
   - These support the `postgres` package natively
   - See deployment guides for those platforms

3. **Use Cloudflare D1** (SQLite)
   - If you can migrate to SQLite
   - Requires schema changes

#### CPU Time Limits

- **Free tier**: ~50ms CPU time per request
- **Paid plans**: Up to 50 seconds (configured in `wrangler.toml`)

For 100k+ record processing:
- Consider breaking work into batches
- Use Durable Objects for long-running tasks
- Or deploy to Node.js platforms (Railway/Fly.io) instead

#### Memory Limits

- Default: 128MB
- Configured: 256MB in `wrangler.toml`
- Can be increased if needed

### Troubleshooting

**Error: "Module not found"**
- Some Node.js packages don't work in Workers
- Check Cloudflare Workers compatibility
- Consider using Workers-compatible alternatives

**Error: "CPU time limit exceeded"**
- Your computation is too long
- Break into smaller batches
- Use Durable Objects
- Or deploy to Node.js platform

**Error: "Database connection failed"**
- `postgres` package doesn't work in Workers
- Use HTTP-based database APIs
- Or deploy to Node.js platform

**Error: "Secret not found"**
- Make sure you've set secrets: `npx wrangler secret put <KEY>`
- Check environment: `npx wrangler secret list`

### Next Steps

1. **Update Next.js app** to use the Cloudflare Workers URL:
   ```env
   # In your Next.js .env.local
   MATCHING_SERVICE_URL=https://matching-service.your-subdomain.workers.dev
   ```

2. **Create Next.js API proxy** (see Phase 9 of implementation plan):
   - `app/api/matching/route.ts` - Proxy to matching service
   - Handle authentication/authorization
   - Forward requests and return results

3. **Monitor and optimize**:
   - Use `wrangler tail` to monitor logs
   - Optimize for CPU time if needed
   - Consider caching with Workers KV

