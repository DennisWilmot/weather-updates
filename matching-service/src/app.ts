/**
 * Hono Application
 * 
 * Main HTTP application for the matching service.
 * Provides REST API endpoints for global allocation planning.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { GreedyMinCostPlanner } from './planner/GreedyMinCostPlanner.js';
import { validatePlanningProblem, GlobalPlanningConstraintsSchema } from './validation/schemas.js';
import { loadProblemFromDb } from './db/loadProblem.js';
import type { GlobalPlanningResult } from './types/planner.js';

const app = new Hono();

// CORS middleware
app.use(
  '/*',
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Type'],
    credentials: true,
  })
);

// Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(
    `${c.req.method} ${c.req.path} - ${c.res.status} (${duration}ms)`
  );
});

// Error handling middleware
app.onError((err, c) => {
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    return c.json(
      {
        error: 'Validation error',
        message: 'Invalid request data',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      400
    );
  }

  // Handle planner validation errors
  if (
    err.message.includes('Problem must have') ||
    err.message.includes('must be') ||
    err.message.includes('Invalid')
  ) {
    return c.json(
      {
        error: 'Invalid problem',
        message: err.message,
      },
      400
    );
  }

  // Generic error
  return c.json(
    {
      error: 'Internal server error',
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'An error occurred while processing your request',
    },
    500
  );
});

/**
 * POST /plan
 * 
 * Solve a global allocation planning problem.
 * 
 * Request body: GlobalPlanningProblem (JSON)
 * Response: GlobalPlanningResult (JSON)
 * 
 * @example Request
 * ```json
 * {
 *   "warehouses": [
 *     {
 *       "id": "w1",
 *       "parishId": "p1",
 *       "lat": 18.0,
 *       "lng": -76.8,
 *       "inventory": [
 *         { "warehouseId": "w1", "itemCode": "food", "quantity": 1000 }
 *       ]
 *     }
 *   ],
 *   "communities": [
 *     {
 *       "id": "c1",
 *       "parishId": "p1",
 *       "lat": 18.1,
 *       "lng": -76.9
 *     }
 *   ],
 *   "communityNeeds": [
 *     {
 *       "communityId": "c1",
 *       "itemCode": "food",
 *       "quantity": 100,
 *       "priority": 1
 *     }
 *   ],
 *   "constraints": {
 *     "reserveFraction": 0.2,
 *     "maxDistanceKm": 100,
 *     "distanceWeight": 1.0,
 *     "riskWeight": 0.5,
 *     "fairnessWeight": 0.3
 *   }
 * }
 * ```
 * 
 * @example Response
 * ```json
 * {
 *   "shipments": [
 *     {
 *       "fromWarehouseId": "w1",
 *       "toCommunityId": "c1",
 *       "itemCode": "food",
 *       "quantity": 100,
 *       "cost": 12.5
 *     }
 *   ],
 *   "summary": {
 *     "totalShipments": 1,
 *     "totalItemsAllocated": 100,
 *     "totalCost": 12.5,
 *     "unmetNeeds": [],
 *     "fulfillmentRate": 1.0
 *   }
 * }
 * ```
 */
app.post('/plan', async (c) => {
  try {
    // Parse request body
    const body = await c.req.json();

    // Validate input
    const problem = validatePlanningProblem(body);

    // Instantiate planner
    const planner = new GreedyMinCostPlanner();

    // Execute planning
    const result: GlobalPlanningResult = planner.plan(problem);

    // Return result
    return c.json(result, 200);
  } catch (error) {
    // Errors are handled by error middleware
    throw error;
  }
});

/**
 * POST /plan/from-db
 * 
 * Load a planning problem from the database and solve it.
 * 
 * Request body: ProblemLoadConfig (JSON)
 * Response: GlobalPlanningResult (JSON)
 * 
 * @example Request
 * ```json
 * {
 *   "parishIds": ["uuid-1", "uuid-2"],
 *   "communityIds": ["uuid-3"],
 *   "constraints": {
 *     "reserveFraction": 0.2,
 *     "maxDistanceKm": 100,
 *     "distanceWeight": 1.0,
 *     "riskWeight": 0.5,
 *     "fairnessWeight": 0.3
 *   },
 *   "riskLayers": {
 *     "warehouse-1-community-1": 0.3
 *   }
 * }
 * ```
 * 
 * @example Response
 * ```json
 * {
 *   "shipments": [...],
 *   "summary": {
 *     "totalShipments": 5,
 *     "totalItemsAllocated": 500,
 *     "totalCost": 125.5,
 *     "unmetNeeds": [],
 *     "fulfillmentRate": 1.0
 *   }
 * }
 * ```
 */
app.post('/plan/from-db', async (c) => {
  try {
    // Parse request body
    const body = await c.req.json();

    // Validate input
    const ProblemLoadConfigSchema = z.object({
      parishIds: z.array(z.string().uuid()).optional(),
      communityIds: z.array(z.string().uuid()).optional(),
      constraints: GlobalPlanningConstraintsSchema,
      riskLayers: z.record(z.string(), z.number().finite()).optional(),
    });

    const config = ProblemLoadConfigSchema.parse(body);

    // Load problem from database
    const problem = await loadProblemFromDb(config);

    // Instantiate planner
    const planner = new GreedyMinCostPlanner();

    // Execute planning
    const result: GlobalPlanningResult = planner.plan(problem);

    // Return result
    return c.json(result, 200);
  } catch (error) {
    // Errors are handled by error middleware
    throw error;
  }
});

/**
 * GET /health
 * 
 * Health check endpoint for monitoring and load balancers.
 * 
 * @example Response
 * ```json
 * {
 *   "status": "ok",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "service": "matching-service",
 *   "version": "0.1.0"
 * }
 * ```
 */
app.get('/health', (c) => {
  return c.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'matching-service',
      version: '0.1.0',
    },
    200
  );
});

/**
 * GET /
 * 
 * Root endpoint with API information.
 */
app.get('/', (c) => {
  return c.json(
    {
      service: 'matching-service',
      version: '0.1.0',
      description: 'Global allocation planner for disaster relief logistics',
      endpoints: {
        'POST /plan': 'Solve a global allocation planning problem (with JSON input)',
        'POST /plan/from-db': 'Load problem from database and solve it',
        'GET /health': 'Health check endpoint',
        'GET /': 'API information',
      },
    },
    200
  );
});

export default app;

