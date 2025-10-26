# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14 application for tracking Tropical Storm Melissa in relation to Jamaica. It features a community-driven submission feed where users report real-time status updates about power, services, road conditions, and hazards using a hierarchical location system (Parish → Community → Location/Place).

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server at localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Operations
```bash
npm run db:generate  # Generate Drizzle migration files from schema
npm run db:push      # Push schema changes directly to Supabase (development)
npm run db:migrate   # Run migrations (production)
```

**Important**: Use `db:push` for rapid development iteration. Use `db:generate` + `db:migrate` for production deployments.

## Architecture

### Hierarchical Location System

The app uses a 3-tier location hierarchy stored in PostgreSQL via Drizzle ORM:

1. **Parishes** (14 total) - Top-level administrative divisions of Jamaica
2. **Communities** - Neighborhoods/towns within parishes (unique per parish)
3. **Locations** - Specific landmarks, buildings, or streets within communities

**Schema relationships**: `parishes` ← `communities` ← `locations` ← `submissions`

Each level references its parent via foreign key (`parishId`, `communityId`, `locationId`). Submissions can optionally include custom `placeName` and `streetName` fields for locations not in the database.

### Geolocation Detection

The app uses browser geolocation with two-stage community detection:

1. **Bounds-based**: Check if coordinates fall within any community's bounding box
2. **Distance fallback**: If no bounds match, select the closest community by Haversine distance

**Critical implementation details**:
- Geolocation uses `maximumAge: 0` to prevent caching (fresh GPS on every tap)
- Community bounds are fetched from `/api/communities/bounds?parishId=xxx`
- Detection logic is in `lib/reverseGeocoding.ts:findClosestCommunity()`
- Auto-selection updates the community dropdown via `handleCommunityChange()`

### Service Status Tracking

Submissions track service availability with 3-state toggles (working/outage/unknown):

- **JPS Electricity** (`hasElectricity`)
- **Flow Cable/Internet** (`flowService`)
- **Digicel Mobile** (`digicelService`)

**Note**: Water service was removed from the form. `hasWifi` is kept for backward compatibility but not actively used.

### Hazard Reporting

Boolean flags for infrastructure hazards:
- `flooding`
- `downedPowerLines`
- `fallenTrees`
- `structuralDamage`

### API Architecture

**Key endpoints**:

- `GET /api/parishes` - List all parishes
- `GET /api/parishes/:id/communities` - Communities in a parish
- `GET /api/parishes/stats` - Parish-level statistics with severity calculation
- `GET /api/parishes/:id/community-stats` - Community-level breakdown
- `GET /api/communities/bounds` - Communities with geolocation bounds
- `GET /api/submissions` - Community feed with optional filtering
- `POST /api/submissions` - Create submission (supports both legacy name-based and new ID-based format)
- `DELETE /api/submissions/:id` - Delete submission (requires admin authentication via `Authorization: Bearer` header)
- `GET /api/submissions/:id` - Get single submission by ID
- `GET /api/melissa` - Storm data from National Hurricane Center

**Backward compatibility**: The submissions API accepts both old format (parish/community as text names) and new format (UUIDs). It automatically resolves IDs from names and creates communities if needed.

**Admin Authentication**: Delete operations require an admin key passed via `Authorization: Bearer YOUR_KEY` header. The key is verified server-side using `lib/admin-auth.ts` against the `ADMIN_SECRET_KEY` environment variable.

### State Management

- **TanStack React Query** for server state with 30-second refetch intervals
- **Mantine hooks** (`useDisclosure`, custom `useGeolocation`)
- Component-level `useState` for form inputs and UI state

### UI Structure

**Main page** (`app/page.tsx`):
- Tab-based navigation: Feed, Report, Storm, Contacts, News
- Mobile-first design with bottom navigation bar
- Desktop navigation with horizontal buttons
- Mobile drawer menu for additional options

**Key components**:
- `CommunityFeed` - Displays submissions with parish statistics overview (Jamaica Overview card)
- `SubmitUpdateEnhanced` - Enhanced submission form with 3-state service toggles
- `HierarchicalLocationPicker` - Location selector with geolocation auto-detection
- `StormUpdates` - Storm tracking information
- `EmergencyContacts` - Contact directory
- `NewsFeed` - RSS news aggregation

**Removed components** (per user request):
- `ParishDashboard` - Parish statistics dashboard (consolidated into CommunityFeed)
- `HierarchicalSearch` - Search bar (removed from CommunityFeed)

## Database Schema Notes

### Submissions Table Schema Evolution

The schema has evolved to support hierarchical locations. Key fields:

**Required fields**:
- `parishId`, `communityId` (UUIDs)
- `hasElectricity` (boolean)
- `roadStatus` (enum: clear/flooded/blocked/mudslide/damaged)
- `needsHelp` (boolean)

**Optional fields**:
- `locationId` (UUID - for verified landmarks)
- `placeName`, `streetName` (text - for custom locations)
- `flowService`, `digicelService` (boolean or null - 3-state)
- Hazard flags (boolean, default false)
- `helpType` (enum - only if `needsHelp` is true)

**Legacy fields** (keep for backward compatibility):
- `parish`, `community` (text) - Will be deprecated after full migration

### Migrations and Schema Changes

When modifying the database schema:

1. Update `lib/db/schema.ts`
2. Run `npm run db:generate` to create migration files
3. Review generated SQL in `drizzle/` directory
4. Test locally with `npm run db:push` (development only)
5. For production, use `npm run db:migrate`

## Mobile-First Design Principles

All UI consolidation follows mobile-first approach:

- Bottom padding of 120px on mobile containers to prevent bottom nav overlap
- Parish statistics integrated directly into Community Feed as "Jamaica Overview" card
- No separate dashboard or search components
- Location inputs are never disabled (users can type before selecting community)
- Geolocation detection shows alerts with detected community, place, and street

## Git Workflow

**Branches**:
- `main` - Production-ready code
- `dev` - Development branch

**Merging strategy**: When merging branches with conflicts, the user prefers keeping the target branch's changes using `-X ours` strategy.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgres_connection_string
ADMIN_SECRET_KEY=your_secure_admin_key_here  # For admin operations (deleting submissions)
```

Generate a secure admin key using: `openssl rand -base64 32`

## Supabase Configuration

- Enable Row Level Security (RLS) with public read/write policies on `submissions` table
- Enable Realtime on `submissions` table for live updates
- Postgres connection via Drizzle ORM (not Supabase client for DB operations)
- Supabase client used only for real-time subscriptions and future auth

## Common Debugging Notes

**SQL errors related to "parish" column**: The `communities` table uses `parishId` (UUID), not `parish` (text). Always query with `parishId`.

**Geolocation not auto-selecting**: Ensure `handleCommunityChange()` is called when community is detected AND the Select component's `onChange` handler is properly wired.

**Submit button hidden**: Mobile containers need sufficient bottom padding (120px) to clear the bottom navigation bar.

**DOM nesting warnings**: Mantine's `Text` component renders as `<p>`. Don't nest `Stack`, `div`, or other block elements inside `Text`. Use `Stack` with multiple `Text` children instead.

**Debounced search syntax errors**: Use `useRef` pattern for storing timeout IDs, not IIFEs inside `useCallback`.
