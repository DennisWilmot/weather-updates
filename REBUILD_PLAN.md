# Atlas.TM Website Rebuild Plan

## Project Overview

Complete rebuild of Atlas.TM into a comprehensive dashboard of Jamaica with multiple data layer overlays. The system will support four main portals (Assets, Places, People, Aid Workers) with both manual form entry and CSV bulk import capabilities.

---

## Current State Analysis

### Existing Infrastructure
- ✅ MapLibre GL map with GeoJSON layers (Shelters, JDF Bases, User Locations)
- ✅ Hierarchical location system (Parishes → Communities → Locations)
- ✅ Form submission system (`SubmitUpdateEnhanced`)
- ✅ Real-time location tracking via SSE
- ✅ Authentication system (Better Auth) with role-based access
- ✅ Supabase storage for file uploads

### Features to Remove
- ❌ Community Feed (`/` route)
- ❌ Online Retailers (`/onlineretailers`)
- ❌ Report Incident (part of current home page)
- ❌ Emergency Contacts (part of current home page)

---

## New Features & Requirements

### 1. Comprehensive Map Dashboard
- Multiple data layer overlays (Assets, Places, People, Aid Workers)
- Heat maps for asset distributions
- Time-based filtering
- Category filtering
- Real-time updates

### 2. Four Portals with Forms

#### **Assets Portal**
- Distribution form with recipient information
- Track: Starlink, iPhones, Powerbanks, Food, Water, Box shelters, Generators, Hygiene kits
- Heat maps: Where assets were delivered, When delivered, One-time vs recurring

#### **Places Portal**
- Operational status updates
- Track: Electricity, Water, WiFi status, Shelter capacity

#### **People Portal**
- Needs reporting
- Track: Food, Water, Shelter, Electricity, Hygiene kits, Internet, Cell phone connectivity

#### **Aid Workers Portal**
- Schedule/deployment management
- Track: Capabilities, Availability, Mission schedules (24-72hr planning)

### 3. CSV Import Functionality
- Bulk import for all portals
- CSV template generation
- Field mapping interface
- Validation and error reporting

---

## Implementation Plan

## Phase 1: Foundation & Database Schema (Weeks 1-2)

### 1.1 Database Schema Updates

**New Tables to Create:**

```typescript
// Assets & Distributions
asset_distributions
  - id, organization_name, distribution_date, organization_entity
  - parish_id, community_id, latitude, longitude
  - items_distributed (JSONB array)
  - recipient_* fields (first_name, last_name, DOB, sex, TRN, phone, signature)
  - submitted_by, created_at

// Place Status
place_status
  - id, parish_id, community_id, town
  - electricity_status, water_status, wifi_status
  - shelter_name, shelter_capacity, shelter_max_capacity, shelter_at_capacity
  - notes, reported_by, verified, created_at

// People Needs
people_needs
  - id, parish_id, community_id, latitude, longitude
  - needs (JSONB array)
  - contact_name, contact_phone, contact_email
  - number_of_people, urgency, description
  - status, reported_by, created_at

// Aid Worker Schedules
aid_worker_schedules
  - id, worker_name, worker_id, organization
  - capabilities (JSONB array)
  - mission_type, start_time, end_time, duration_hours
  - current_latitude, current_longitude, deployment_area
  - status, contact_phone, contact_email
  - created_by, created_at
```

**Tasks:**
- [ ] Create Drizzle schema definitions for all new tables
- [ ] Generate and run database migrations
- [ ] Create seed data for testing
- [ ] Add database indexes for performance
- [ ] Update TypeScript types

**Deliverables:**
- Database migrations
- Updated `lib/db/schema.ts`
- Seed scripts

---

### 1.2 Form Schema Definitions

**Tasks:**
- [ ] Define TypeScript interfaces for all 4 form schemas
- [ ] Create Zod validation schemas
- [ ] Document field requirements (required/optional)
- [ ] Define allowed enum values

**Deliverables:**
- `lib/schemas/distribution-schema.ts`
- `lib/schemas/place-status-schema.ts`
- `lib/schemas/people-needs-schema.ts`
- `lib/schemas/aid-worker-schema.ts`

---

### 1.3 CSV Import Infrastructure

**Tasks:**
- [ ] Install CSV parsing library (`papaparse`)
- [ ] Install validation library (`zod`)
- [ ] Create CSV parser utility functions
- [ ] Create CSV template generator functions
- [ ] Build CSV validation engine

**Deliverables:**
- `lib/csv/parser.ts`
- `lib/csv/validator.ts`
- `lib/csv/template-generator.ts`

---

## Phase 2: Map Infrastructure Enhancement (Weeks 3-4)

### 2.1 Enhanced Map Component

**Tasks:**
- [ ] Refactor `SheltersJDFMap` to support dynamic layers
- [ ] Create `MapLayerManager` component
- [ ] Implement layer toggle system
- [ ] Add layer visibility controls
- [ ] Create layer legend component

**Deliverables:**
- `components/EnhancedMap.tsx`
- `components/MapLayerManager.tsx`
- `components/MapLayerToggle.tsx`
- `components/MapLegend.tsx`

---

### 2.2 Heat Map Implementation

**Tasks:**
- [ ] Research MapLibre heat map capabilities
- [ ] Implement heat map layer type
- [ ] Create heat map data aggregation functions
- [ ] Add time-based filtering for heat maps
- [ ] Add category filtering

**Deliverables:**
- `lib/maps/heatmap.ts`
- `lib/maps/aggregation.ts`
- Heat map layer integration

---

### 2.3 Data Layer Integration

**Tasks:**
- [ ] Create API endpoints for each data type
- [ ] Implement GeoJSON conversion for all data types
- [ ] Add real-time updates via SSE/WebSocket
- [ ] Implement clustering for dense data points
- [ ] Add zoom-based filtering

**Deliverables:**
- `app/api/assets/route.ts`
- `app/api/places/status/route.ts`
- `app/api/people/needs/route.ts`
- `app/api/aid-workers/schedules/route.ts`
- GeoJSON conversion utilities

---

## Phase 3: Portal Forms Development (Weeks 5-7)

### 3.1 Reusable Form Components

**Tasks:**
- [ ] Create `MultiSelectCheckbox` component
- [ ] Create `DatePicker` component wrapper
- [ ] Create `SignatureCapture` component
- [ ] Enhance `LocationMapPicker` component
- [ ] Create form field validation components

**Deliverables:**
- `components/forms/MultiSelectCheckbox.tsx`
- `components/forms/DatePicker.tsx`
- `components/forms/SignatureCapture.tsx`
- `components/forms/LocationMapPicker.tsx`
- `components/forms/FormField.tsx`

---

### 3.2 Assets Portal

**Tasks:**
- [ ] Create distribution form component
- [ ] Implement form validation
- [ ] Add image upload for signatures
- [ ] Create form submission API endpoint
- [ ] Add success/error handling
- [ ] Integrate with map layer

**Form Fields:**
- Organization Information (name, date, entity)
- Location (parish, community, coordinates)
- Items Distributed (multi-select)
- Recipient Information (name, DOB, sex, TRN, phone)
- Signature capture

**Deliverables:**
- `app/assets-portal/page.tsx`
- `components/portals/AssetsDistributionForm.tsx`
- `app/api/assets/distributions/route.ts`

---

### 3.3 Places Portal

**Tasks:**
- [ ] Create operational status form
- [ ] Implement status toggle components
- [ ] Add shelter capacity inputs
- [ ] Create form submission API endpoint
- [ ] Integrate with map layer

**Form Fields:**
- Location (parish, community, town)
- Electricity Status
- Water Status
- WiFi Status
- Shelter Information (name, capacity, at capacity)
- Notes

**Deliverables:**
- `app/places-portal/page.tsx`
- `components/portals/PlaceStatusForm.tsx`
- `app/api/places/status/route.ts`

---

### 3.4 People Portal

**Tasks:**
- [ ] Create needs reporting form
- [ ] Implement needs multi-select
- [ ] Add urgency selector
- [ ] Create form submission API endpoint
- [ ] Integrate with map layer

**Form Fields:**
- Location (parish, community, coordinates)
- Needs (multi-select)
- Contact Information
- Number of People
- Urgency Level
- Description

**Deliverables:**
- `app/people-portal/page.tsx`
- `components/portals/PeopleNeedsForm.tsx`
- `app/api/people/needs/route.ts`

---

### 3.5 Aid Workers Portal

**Tasks:**
- [ ] Create schedule/deployment form
- [ ] Implement capabilities multi-select
- [ ] Add mission type selector
- [ ] Create date/time pickers
- [ ] Create form submission API endpoint
- [ ] Integrate with map layer

**Form Fields:**
- Worker Information (name, organization)
- Capabilities (multi-select)
- Mission Type
- Schedule (start time, end time, duration)
- Location (current, deployment area)
- Status
- Contact Information

**Deliverables:**
- `app/aid-workers-portal/page.tsx`
- `components/portals/AidWorkerScheduleForm.tsx`
- `app/api/aid-workers/schedules/route.ts`

---

## Phase 4: CSV Import Functionality (Week 8)

### 4.1 CSV Upload Component

**Tasks:**
- [ ] Create `CSVUploader` component
- [ ] Add drag-and-drop file upload
- [ ] Implement CSV preview table
- [ ] Add field mapping interface
- [ ] Create validation error display
- [ ] Add progress indicator

**Deliverables:**
- `components/csv/CSVUploader.tsx`
- `components/csv/CSVPreview.tsx`
- `components/csv/FieldMapper.tsx`
- `components/csv/ValidationErrors.tsx`

---

### 4.2 CSV Import API Endpoints

**Tasks:**
- [ ] Create bulk import endpoints for each portal
- [ ] Implement server-side validation
- [ ] Add batch insert with transactions
- [ ] Create error reporting system
- [ ] Add import progress tracking

**Endpoints:**
- `POST /api/assets/distributions/import`
- `POST /api/places/status/import`
- `POST /api/people/needs/import`
- `POST /api/aid-workers/schedules/import`

**Deliverables:**
- `app/api/assets/distributions/import/route.ts`
- `app/api/places/status/import/route.ts`
- `app/api/people/needs/import/route.ts`
- `app/api/aid-workers/schedules/import/route.ts`

---

### 4.3 CSV Template Generation

**Tasks:**
- [ ] Create template generator for each portal
- [ ] Add template download functionality
- [ ] Create sample CSV files
- [ ] Add template documentation

**Deliverables:**
- `public/templates/distribution-template.csv`
- `public/templates/place-status-template.csv`
- `public/templates/people-needs-template.csv`
- `public/templates/aid-worker-template.csv`
- Template download API endpoints

---

### 4.4 CSV Import Integration

**Tasks:**
- [ ] Integrate CSV uploader into Assets Portal
- [ ] Integrate CSV uploader into Places Portal
- [ ] Integrate CSV uploader into People Portal
- [ ] Integrate CSV uploader into Aid Workers Portal
- [ ] Add import history/audit log

**Deliverables:**
- CSV import UI in all portals
- Import history tracking

---

## Phase 5: Main Dashboard & Navigation (Week 9)

### 5.1 Main Map Dashboard

**Tasks:**
- [ ] Create new main dashboard page (`/dashboard`)
- [ ] Integrate enhanced map component
- [ ] Add layer control panel
- [ ] Add filter panel (time, category, status)
- [ ] Add statistics panel
- [ ] Implement real-time updates

**Deliverables:**
- `app/dashboard/page.tsx`
- `components/dashboard/MapDashboard.tsx`
- `components/dashboard/LayerControls.tsx`
- `components/dashboard/FilterPanel.tsx`
- `components/dashboard/StatisticsPanel.tsx`

---

### 5.2 Navigation Restructure

**Tasks:**
- [ ] Update main navigation
- [ ] Remove deprecated routes
- [ ] Add portal navigation links
- [ ] Update mobile navigation drawer
- [ ] Add breadcrumbs

**New Navigation:**
- Dashboard (Map)
- Assets Portal
- Places Portal
- People Portal
- Aid Workers Portal

**Deliverables:**
- Updated `app/layout.tsx`
- Updated navigation components
- Mobile navigation updates

---

## Phase 6: Data Migration & Cleanup (Week 10)

### 6.1 Data Migration

**Tasks:**
- [ ] Create migration scripts for existing data
- [ ] Archive old submissions data
- [ ] Migrate user locations if needed
- [ ] Test migration scripts
- [ ] Run production migration

**Deliverables:**
- `scripts/migrate-existing-data.ts`
- Migration documentation
- Rollback scripts

---

### 6.2 Feature Removal

**Tasks:**
- [ ] Remove Community Feed route
- [ ] Remove Online Retailers route
- [ ] Remove Report Incident functionality
- [ ] Remove Emergency Contacts from home page
- [ ] Clean up unused components
- [ ] Update documentation

**Deliverables:**
- Removed routes/components
- Updated README
- Migration guide for users

---

## Phase 7: Testing & Polish (Week 11)

### 7.1 Testing

**Tasks:**
- [ ] Unit tests for form schemas
- [ ] Unit tests for CSV parsing
- [ ] Integration tests for API endpoints
- [ ] E2E tests for form submissions
- [ ] E2E tests for CSV imports
- [ ] Performance testing (map with 1000+ points)
- [ ] Mobile responsiveness testing

**Deliverables:**
- Test suite
- Test documentation
- Performance benchmarks

---

### 7.2 UI/UX Polish

**Tasks:**
- [ ] Consistent styling across all portals
- [ ] Loading states and error handling
- [ ] Success notifications
- [ ] Form validation feedback
- [ ] Mobile optimization
- [ ] Accessibility improvements

**Deliverables:**
- Polished UI components
- Style guide documentation

---

## Phase 8: Documentation & Deployment (Week 12)

### 8.1 Documentation

**Tasks:**
- [ ] API documentation
- [ ] User guide for each portal
- [ ] CSV import guide
- [ ] Admin documentation
- [ ] Deployment guide

**Deliverables:**
- `docs/API.md`
- `docs/USER_GUIDE.md`
- `docs/CSV_IMPORT_GUIDE.md`
- `docs/ADMIN_GUIDE.md`

---

### 8.2 Deployment

**Tasks:**
- [ ] Production database migration
- [ ] Environment variable configuration
- [ ] Deploy to production
- [ ] Smoke testing
- [ ] Monitor for issues

**Deliverables:**
- Production deployment
- Monitoring setup
- Rollback plan

---

## Technical Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** Mantine UI
- **Maps:** MapLibre GL JS
- **Forms:** React Hook Form + Zod
- **CSV Parsing:** PapaParse
- **State Management:** TanStack Query

### Backend
- **Runtime:** Node.js
- **Database:** PostgreSQL (via Drizzle ORM)
- **File Storage:** Supabase Storage
- **Authentication:** Better Auth
- **Real-time:** Server-Sent Events / WebSockets

### Libraries to Install
```json
{
  "papaparse": "^5.4.1",
  "zod": "^3.22.4",
  "react-signature-canvas": "^1.0.6",
  "@mantine/dates": "^7.x",
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x"
}
```

---

## Success Criteria

### Functional Requirements
- ✅ All 4 portals functional with forms
- ✅ CSV import working for all portals
- ✅ Map displays all layer categories with toggle controls
- ✅ Heat maps render correctly
- ✅ Real-time updates work for all data types
- ✅ Mobile responsive design

### Performance Requirements
- ✅ Map loads in <3 seconds with 1000+ points
- ✅ CSV import handles 1000+ rows in <30 seconds
- ✅ Form submissions complete in <2 seconds
- ✅ Real-time updates appear within 5 seconds

### Data Requirements
- ✅ All form submissions stored correctly
- ✅ CSV imports validate and report errors
- ✅ Data integrity maintained
- ✅ Historical data preserved

---

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Map performance degradation | Implement clustering, lazy loading, zoom-based filtering |
| Database query performance | Add indexes, optimize queries, use aggregation |
| CSV import failures | Client-side + server-side validation, detailed error reporting |
| Real-time update scaling | Use WebSockets, implement batching, fallback to polling |
| Data migration issues | Thorough testing, rollback scripts, staged migration |

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1: Foundation | 2 weeks | Database schema, form schemas, CSV infrastructure |
| Phase 2: Map Enhancement | 2 weeks | Enhanced map, heat maps, data layers |
| Phase 3: Portal Forms | 3 weeks | All 4 portal forms and APIs |
| Phase 4: CSV Import | 1 week | CSV uploader, import APIs, templates |
| Phase 5: Dashboard | 1 week | Main dashboard, navigation |
| Phase 6: Migration | 1 week | Data migration, feature removal |
| Phase 7: Testing | 1 week | Testing, UI polish |
| Phase 8: Documentation | 1 week | Docs, deployment |

**Total Duration: 12 weeks**

---

## Next Steps

1. **Immediate Actions:**
   - Review and approve this plan
   - Set up project tracking (GitHub Issues/Projects)
   - Create feature branches
   - Begin Phase 1: Database schema design

2. **Week 1 Focus:**
   - Database schema finalization
   - Form schema definitions
   - CSV parser setup

3. **Communication:**
   - Weekly progress updates
   - Demo after each phase
   - Issue tracking and resolution

---

## Appendix

### Form Schema Definitions

See detailed form schemas in:
- `docs/schemas/distribution-form.md`
- `docs/schemas/place-status-form.md`
- `docs/schemas/people-needs-form.md`
- `docs/schemas/aid-worker-form.md`

### CSV Template Examples

See CSV templates in:
- `public/templates/distribution-template.csv`
- `public/templates/place-status-template.csv`
- `public/templates/people-needs-template.csv`
- `public/templates/aid-worker-template.csv`

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-XX  
**Status:** Planning Phase



