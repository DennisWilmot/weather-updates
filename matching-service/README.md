# Matching Service

Global allocation planner for disaster relief logistics.

## Overview

This is a standalone Hono worker service that implements a global allocation algorithm for disaster relief. It computes optimal allocation plans for distributing supplies from warehouses to communities based on needs, distance, risk, and fairness constraints.

## Project Structure

```
matching-service/
├── src/
│   ├── types/          # TypeScript type definitions
│   ├── planner/        # Planner implementations
│   ├── utils/          # Utility functions
│   ├── db/             # Database integration
│   ├── validation/     # Zod schemas
│   └── runtime/        # Runtime adapters
├── tests/              # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

```bash
npm install
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Type check without building
npm run type-check

# Build for production
npm run build

# Run production build
npm start
```

## Environment Variables

Create a `.env` file in the root directory (see `.env.example` for template):

```bash
# Required
DATABASE_URL=postgresql://user:password@host:port/database

# Optional
PORT=3001
HOSTNAME=0.0.0.0
NODE_ENV=development
CORS_ORIGIN=*
LOG_LEVEL=info
```

## Usage

This service exposes HTTP endpoints for planning allocation:

- `POST /plan` - Compute allocation plan from JSON input
- `POST /plan/from-db` - Compute allocation plan from database
- `GET /health` - Health check endpoint
- `GET /` - API information and available endpoints

## Algorithm

The service implements a greedy min-cost flow heuristic that:
- Respects warehouse stock limits and reserve fractions
- Minimizes composite cost (distance + risk + fairness)
- Maximizes fulfillment of community needs
- Tracks fairness to avoid starving under-served parishes

The planner interface is designed to be pluggable, allowing future integration with LP/MIP solvers (OR-Tools, Gurobi, etc.) while maintaining the same interface.

## Types

All core types are defined in `src/types/planner.ts`:
- `Warehouse` - Supply nodes with inventory
- `Community` - Demand nodes
- `CommunityNeed` - Specific needs to fulfill
- `GlobalPlanningProblem` - Complete problem definition
- `GlobalPlanningResult` - Allocation plan with shipments

## Deployment

### Node.js (Railway, Fly.io, Render, etc.)

```bash
# Build
npm run build

# Start
npm start
```

The service will automatically detect Node.js runtime and start the server.

### Docker

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

Or manually:

```bash
docker build -t matching-service .
docker run -p 3001:3001 --env-file .env matching-service
```

### Cloudflare Workers

Wrangler is installed as a dev dependency. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

```bash
# Authenticate with Cloudflare (first time only)
npx wrangler login

# Set environment variables as secrets
npx wrangler secret put DATABASE_URL
npx wrangler secret put CORS_ORIGIN  # Optional

# Deploy
npm run cf:deploy

# Local development
npm run cf:dev
```

**Note**: For long-running computations (100k+ records), Cloudflare Workers may hit CPU time limits. Consider:
- Using Durable Objects for stateful computations
- Breaking work into smaller batches
- Using Cloudflare Pages Functions with increased limits
- Deploying to Node.js-compatible platforms for heavy workloads

### Bun

The service automatically detects Bun runtime. Simply run:

```bash
bun run src/index.ts
```

## Runtime Detection

The service automatically detects the runtime environment:
- **Node.js**: Uses `@hono/node-server`
- **Bun**: Uses Bun's native HTTP server
- **Cloudflare Workers**: Uses default export (fetch handler)

## Related Documentation

See `.claude/hono-planner-implementation-plan.md` for the complete implementation plan.

## License

ISC

