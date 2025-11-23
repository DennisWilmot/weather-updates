# Phase 6: Database Schema Extensions - Detailed Plan

## Goal
Create database tables for warehouses, warehouse inventory, allocation plans, and allocation shipments to support the global allocation planning system.

## Overview
This phase extends the existing database schema with new tables specifically designed for the allocation planning system. These tables will enable storing warehouse locations, inventory, planning results, and shipment tracking.

## Tasks Breakdown

### Task 6.1: Review Existing Schema
**Objective**: Understand existing tables that relate to allocation planning

**Steps**:
1. Review `assets` table:
   - Currently tracks individual assets (Starlink, iPhones, generators, etc.)
   - Has `parishId`, `communityId`, `latitude`, `longitude`, `type`, `status`
   - Can be used as a source for warehouse inventory (but not ideal structure)
2. Review `peopleNeeds` table:
   - Tracks needs by person/community
   - Has `parishId`, `communityId`, `needs` (JSONB array), `urgency`, `status`
   - Can be aggregated to create `CommunityNeed` data
3. Review `communities` table:
   - Has `id`, `parishId`, `coordinates` (JSONB), `bounds` (JSONB)
   - Already suitable for planner's `Community` type
4. Document relationships:
   - `parishes` ← `communities` ← `peopleNeeds`
   - `parishes` ← `assets` (for supply)
   - New tables will reference these existing tables

**Deliverable**: Documentation of existing schema relationships

---

### Task 6.2: Create Warehouses Table
**Objective**: Create table for warehouse/depot locations

**Steps**:
1. Add to `lib/db/schema.ts`:
   ```typescript
   export const warehouses = pgTable(
     "warehouses",
     {
       id: uuid("id").primaryKey().defaultRandom(),
       name: text("name").notNull(),
       parishId: uuid("parish_id")
         .references(() => parishes.id)
         .notNull(),
       communityId: uuid("community_id").references(() => communities.id),
       latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
       longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
       address: text("address"),
       status: text("status", {
         enum: ["active", "inactive", "maintenance"],
       })
         .notNull()
         .default("active"),
       capacity: integer("capacity"), // Optional: total capacity metric
       createdAt: timestamp("created_at").defaultNow().notNull(),
       updatedAt: timestamp("updated_at").defaultNow().notNull(),
     },
     (table) => ({
       parishIdIdx: index("warehouses_parish_id_idx").on(table.parishId),
       statusIdx: index("warehouses_status_idx").on(table.status),
       locationIdx: index("warehouses_location_idx").on(table.latitude, table.longitude),
     })
   );
   ```
2. Add JSDoc comments explaining:
   - Purpose: Store warehouse/depot locations
   - Relationship to assets (warehouses can have inventory)
   - Status enum values
   - Capacity field usage

**Key Points**:
- References existing `parishes` and `communities` tables
- Includes geographic coordinates for distance calculations
- Status field for operational state
- Indexes for common queries (parish, status, location)

**Deliverable**: `warehouses` table definition in schema.ts

---

### Task 6.3: Create Warehouse Inventory Table
**Objective**: Create table for tracking inventory items at warehouses

**Steps**:
1. Add to `lib/db/schema.ts`:
   ```typescript
   export const warehouseInventory = pgTable(
     "warehouse_inventory",
     {
       id: uuid("id").primaryKey().defaultRandom(),
       warehouseId: uuid("warehouse_id")
         .references(() => warehouses.id, { onDelete: "cascade" })
         .notNull(),
       itemCode: text("item_code").notNull(), // e.g., "food", "water", "medicine"
       quantity: integer("quantity").notNull().default(0),
       reservedQuantity: integer("reserved_quantity").notNull().default(0), // Reserved for ongoing plans
       lastUpdated: timestamp("last_updated").defaultNow().notNull(),
       createdAt: timestamp("created_at").defaultNow().notNull(),
     },
     (table) => ({
       warehouseIdIdx: index("warehouse_inventory_warehouse_id_idx").on(table.warehouseId),
       itemCodeIdx: index("warehouse_inventory_item_code_idx").on(table.itemCode),
       uniqueWarehouseItem: unique().on(table.warehouseId, table.itemCode), // One row per warehouse-item
     })
   );
   ```
2. Add JSDoc comments explaining:
   - Purpose: Track inventory quantities per warehouse
   - Relationship to warehouses (cascade delete)
   - `reservedQuantity` for tracking allocations in progress
   - Unique constraint prevents duplicate entries

**Key Points**:
- Foreign key to warehouses with cascade delete
- Unique constraint on (warehouseId, itemCode)
- Reserved quantity for tracking ongoing allocations
- Indexes for fast lookups

**Deliverable**: `warehouseInventory` table definition in schema.ts

---

### Task 6.4: Create Allocation Plans Table
**Objective**: Create table for storing allocation plan metadata

**Steps**:
1. Add to `lib/db/schema.ts`:
   ```typescript
   export const allocationPlans = pgTable(
     "allocation_plans",
     {
       id: uuid("id").primaryKey().defaultRandom(),
       planName: text("plan_name").notNull(),
       status: text("status", {
         enum: ["draft", "pending", "approved", "executing", "completed", "cancelled"],
       })
         .notNull()
         .default("draft"),
       constraints: jsonb("constraints").notNull(), // Store GlobalPlanningConstraints as JSONB
       createdBy: text("created_by"), // User ID who created the plan
       createdAt: timestamp("created_at").defaultNow().notNull(),
       executedAt: timestamp("executed_at"), // When plan execution started
       completedAt: timestamp("completed_at"), // When plan execution finished
     },
     (table) => ({
       statusIdx: index("allocation_plans_status_idx").on(table.status),
       createdAtIdx: index("allocation_plans_created_at_idx").on(table.createdAt),
     })
   );
   ```
2. Add JSDoc comments explaining:
   - Purpose: Store plan metadata and status
   - Constraints stored as JSONB (matches GlobalPlanningConstraints type)
   - Status workflow: draft → pending → approved → executing → completed
   - Timestamps for tracking plan lifecycle

**Key Points**:
- JSONB for flexible constraint storage
- Status enum for workflow tracking
- Timestamps for audit trail
- Indexes for status and date queries

**Deliverable**: `allocationPlans` table definition in schema.ts

---

### Task 6.5: Create Allocation Shipments Table
**Objective**: Create table for storing individual shipments from plans

**Steps**:
1. Add to `lib/db/schema.ts`:
   ```typescript
   export const allocationShipments = pgTable(
     "allocation_shipments",
     {
       id: uuid("id").primaryKey().defaultRandom(),
       planId: uuid("plan_id")
         .references(() => allocationPlans.id, { onDelete: "cascade" })
         .notNull(),
       fromWarehouseId: uuid("from_warehouse_id")
         .references(() => warehouses.id)
         .notNull(),
       toCommunityId: uuid("to_community_id")
         .references(() => communities.id)
         .notNull(),
       itemCode: text("item_code").notNull(),
       quantity: integer("quantity").notNull(),
       cost: decimal("cost", { precision: 10, scale: 2 }), // Computed cost from planner
       status: text("status", {
         enum: ["planned", "scheduled", "in_transit", "delivered", "cancelled"],
       })
         .notNull()
         .default("planned"),
       scheduledDate: timestamp("scheduled_date"), // When shipment is scheduled
       executedDate: timestamp("executed_date"), // When shipment actually happened
       createdAt: timestamp("created_at").defaultNow().notNull(),
     },
     (table) => ({
       planIdIdx: index("allocation_shipments_plan_id_idx").on(table.planId),
       warehouseIdIdx: index("allocation_shipments_warehouse_id_idx").on(table.fromWarehouseId),
       communityIdIdx: index("allocation_shipments_community_id_idx").on(table.toCommunityId),
       statusIdx: index("allocation_shipments_status_idx").on(table.status),
     })
   );
   ```
2. Add JSDoc comments explaining:
   - Purpose: Store individual shipments from allocation plans
   - Relationship to plans (cascade delete)
   - References warehouses and communities
   - Status workflow for shipment tracking
   - Cost field stores planner's computed cost

**Key Points**:
- Foreign keys to plans, warehouses, and communities
- Status enum for shipment lifecycle
- Cost stored for analysis
- Indexes for common queries

**Deliverable**: `allocationShipments` table definition in schema.ts

---

### Task 6.6: Generate Migration Files
**Objective**: Generate Drizzle migration files for the new tables

**Steps**:
1. Run migration generation:
   ```bash
   npm run db:generate
   ```
2. Review generated SQL files in `drizzle/` directory:
   - Check that tables are created correctly
   - Verify indexes are created
   - Verify foreign keys and constraints
   - Check that enums are created properly
3. Document migration:
   - Note migration file name
   - List tables created
   - List indexes created
   - Note any potential issues

**Key Points**:
- Migration files are auto-generated by Drizzle
- Review SQL before applying
- Test migrations locally first

**Deliverable**: Migration files in `drizzle/` directory

---

## File Structure After Phase 6

```
hurricane-melissa-update/
├── lib/
│   └── db/
│       ├── schema.ts                 ✅ Phase 6 (updated)
│       └── index.ts                  (existing)
├── drizzle/
│   └── XXXX_*.sql                    ✅ Phase 6 (new migration)
└── matching-service/
    └── src/
        └── db/
            └── loadProblem.ts        ✅ Phase 5 (will use new tables)
```

## Implementation Details

### Table Relationships

```
parishes
  ├── communities
  │     └── allocationShipments (toCommunityId)
  └── warehouses
        ├── warehouseInventory (warehouseId)
        └── allocationShipments (fromWarehouseId)

allocationPlans
  └── allocationShipments (planId)
```

### Enum Types

**Warehouse Status**:
- `active`: Warehouse is operational
- `inactive`: Warehouse is closed/temporarily unavailable
- `maintenance`: Warehouse is under maintenance

**Plan Status**:
- `draft`: Plan is being created/edited
- `pending`: Plan is awaiting approval
- `approved`: Plan is approved and ready to execute
- `executing`: Plan is currently being executed
- `completed`: Plan execution finished
- `cancelled`: Plan was cancelled

**Shipment Status**:
- `planned`: Shipment is in the plan but not scheduled
- `scheduled`: Shipment is scheduled for execution
- `in_transit`: Shipment is currently in transit
- `delivered`: Shipment has been delivered
- `cancelled`: Shipment was cancelled

### Indexes Strategy

**Warehouses**:
- `parishId`: Filter warehouses by parish
- `status`: Filter by operational status
- `(latitude, longitude)`: Geographic queries

**Warehouse Inventory**:
- `warehouseId`: Get all inventory for a warehouse
- `itemCode`: Find warehouses with specific items
- `(warehouseId, itemCode)`: Unique constraint

**Allocation Plans**:
- `status`: Filter plans by status
- `createdAt`: Sort by creation date

**Allocation Shipments**:
- `planId`: Get all shipments for a plan
- `warehouseId`: Get shipments from a warehouse
- `communityId`: Get shipments to a community
- `status`: Filter by shipment status

## Validation Checklist

After completing Phase 6, verify:

- [ ] All tables are defined in schema.ts
- [ ] Foreign keys reference correct tables
- [ ] Unique constraints are defined
- [ ] Indexes are created for common queries
- [ ] Enums are properly defined
- [ ] Migration files are generated
- [ ] Migration SQL is correct
- [ ] TypeScript compiles without errors
- [ ] Tables can be created in database (test with db:push)

## Testing Phase 6

1. **Test Schema Compilation**:
   ```bash
   npm run type-check
   # Should compile without errors
   ```

2. **Test Migration Generation**:
   ```bash
   npm run db:generate
   # Should create migration files
   ```

3. **Test Migration Application** (development):
   ```bash
   npm run db:push
   # Should create tables in database
   ```

4. **Verify Tables Created**:
   - Check database for new tables
   - Verify indexes exist
   - Verify foreign keys work
   - Verify enums are created

## Edge Cases to Handle

1. **Cascade Deletes**:
   - Deleting warehouse should cascade delete inventory
   - Deleting plan should cascade delete shipments
   - Test cascade behavior

2. **Unique Constraints**:
   - Prevent duplicate warehouse-item inventory entries
   - Handle constraint violations gracefully

3. **Nullable Fields**:
   - `communityId` in warehouses (optional)
   - `executedAt` and `completedAt` in plans (nullable until execution)
   - `scheduledDate` and `executedDate` in shipments (nullable until scheduled/executed)

4. **JSONB Constraints**:
   - Validate JSONB structure matches expected types
   - Handle invalid JSON gracefully

## Next Steps After Phase 6

Once Phase 6 is complete, proceed to:
- **Update `loadProblem.ts`**: Implement actual queries using new tables
- **Phase 7**: Runtime Setup & Deployment Config
  - Create runtime adapters
  - Set up deployment configurations

## Estimated Time

- Task 6.1: 15-20 minutes (schema review)
- Task 6.2: 20-30 minutes (warehouses table)
- Task 6.3: 20-30 minutes (warehouse inventory table)
- Task 6.4: 20-30 minutes (allocation plans table)
- Task 6.5: 20-30 minutes (allocation shipments table)
- Task 6.6: 15-20 minutes (migration generation and review)

**Total: 110-160 minutes (approximately 2-2.5 hours)**

## Notes

- Tables follow existing schema patterns (UUIDs, timestamps, indexes)
- Foreign keys maintain referential integrity
- JSONB used for flexible constraint storage
- Indexes optimized for common query patterns
- Cascade deletes maintain data consistency
- Status enums enable workflow tracking
- Migration files are auto-generated (review before applying)
- Test migrations locally before production deployment

