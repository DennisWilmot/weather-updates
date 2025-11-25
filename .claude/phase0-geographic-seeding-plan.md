# Phase 0: Geographic Data Seeding Plan

## Overview
Seed realistic test data with assets, people, and places distributed across Jamaica (especially western parishes) to enable proper testing of the allocation planning algorithm. Current data is clustered together, making distance-based allocation testing ineffective.

## Problem Statement
- Assets, people, and places are currently clustered within a few meters of each other
- This prevents testing realistic allocation scenarios where distance matters
- Need geographic distribution across multiple parishes to test the planning algorithm

## Target Distribution

### Western Jamaica Focus (Primary)
Focus on these parishes for realistic disaster relief scenarios:
1. **St. James** (Montego Bay area) - Major city, tourism hub
2. **Hanover** - Rural, coastal
3. **Westmoreland** - Agricultural, coastal
4. **St. Elizabeth** - Large parish, agricultural
5. **Trelawny** - Mixed urban/rural

### Additional Parishes (Secondary)
6. **St. Ann** - Tourism (Ocho Rios)
7. **Clarendon** - Central Jamaica
8. **Manchester** - Central Jamaica
9. **St. Catherine** - Near Kingston

## Implementation Plan

### Step 1: Create Seed Data Files

#### 1.1 `lib/db/seed-data/geographic-assets.ts`
- Create 20-30 assets distributed across 8-10 parishes
- Asset types: `food`, `water`, `generator`, `hygiene_kit`, `box_shelter`
- Each asset should have:
  - Realistic coordinates within parish bounds
  - Different parishes (spread across island)
  - Status: `available` (for planning)
  - Quantities: 100-1000 units for consumables

**Distribution Strategy:**
- 3-4 assets in St. James (Montego Bay area)
- 2-3 assets in each of Hanover, Westmoreland, St. Elizabeth
- 2-3 assets in St. Ann, Clarendon, Manchester
- 1-2 assets in St. Catherine
- Ensure minimum 20-30km distance between assets in same parish

#### 1.2 `lib/db/seed-data/geographic-people.ts`
- Create 15-25 people records (mix of `person_in_need` and `aid_worker`)
- Distribute across 6-8 parishes
- Each person should have:
  - Realistic coordinates within parish/community
  - Different parishes from assets (to create allocation needs)
  - Needs array for `person_in_need` types
  - Skills array for `aid_worker` types

**Distribution Strategy:**
- Focus on communities that DON'T have nearby assets
- Create demand nodes that require cross-parish allocation
- Mix of urgent and non-urgent needs

#### 1.3 `lib/db/seed-data/geographic-places.ts`
- Create 10-15 places (shelters, hospitals, community centers)
- Distribute across 5-7 parishes
- Types: `shelter`, `hospital`, `community_center`
- Each place should have:
  - Realistic coordinates
  - Different parishes from assets (to test allocation to places)
  - Capacity information for shelters

**Distribution Strategy:**
- Place shelters in communities with high needs
- Place hospitals in central locations
- Ensure geographic spread

### Step 2: Update Seed Script

#### 2.1 Modify `lib/db/seed.ts`
- Add new seed data imports
- Add functions to seed assets, people, places
- Ensure parish/community resolution works correctly
- Add option to clear existing data before seeding (optional flag)

**New Functions:**
- `seedGeographicAssets()` - Seeds assets with geographic distribution
- `seedGeographicPeople()` - Seeds people across parishes
- `seedGeographicPlaces()` - Seeds places across parishes

### Step 3: Coordinate Validation

#### 3.1 Ensure Realistic Coordinates
- Use parish bounds from `parishes.ts` to validate coordinates
- Use community coordinates from `communities.ts` as reference points
- Add small random offsets (±0.01-0.05 degrees) to create realistic spread
- Ensure coordinates are within Jamaica's bounds (17.7°N to 18.5°N, -78.4°W to -76.2°W)

### Step 4: Create Warehouse Inventory Data

#### 4.1 For Allocation Planning Testing
- Assets need to map to warehouse inventory
- Create `warehouse_inventory` records linking assets to warehouses
- Ensure warehouses have multiple item types
- Ensure realistic quantities (100-5000 units per item)

**Warehouse Strategy:**
- Group assets by location to create warehouses
- Each warehouse should have 2-4 different item types
- Quantities should vary (some warehouses well-stocked, others limited)

## File Structure

### New Files
- `lib/db/seed-data/geographic-assets.ts` - Asset seed data
- `lib/db/seed-data/geographic-people.ts` - People seed data  
- `lib/db/seed-data/geographic-places.ts` - Places seed data
- `scripts/seed-geographic-data.ts` - Standalone seeding script (optional)

### Modified Files
- `lib/db/seed.ts` - Add geographic seeding functions

## Data Requirements

### Assets (20-30 records)
- **Types**: food, water, generator, hygiene_kit, box_shelter
- **Distribution**: 8-10 parishes
- **Coordinates**: Within parish bounds, spread 20-30km apart
- **Status**: `available` (for planning)
- **Quantities**: Realistic (100-1000 for consumables, 1-10 for equipment)

### People (15-25 records)
- **Types**: Mix of `person_in_need` (60%) and `aid_worker` (40%)
- **Distribution**: 6-8 parishes
- **Needs**: Food, Water, Shelter, Medical (for people_in_need)
- **Skills**: Search & Rescue, Medical, Logistics (for aid_workers)
- **Coordinates**: Within community bounds

### Places (10-15 records)
- **Types**: shelter (60%), hospital (20%), community_center (20%)
- **Distribution**: 5-7 parishes
- **Coordinates**: Central locations within communities
- **Capacity**: 50-500 for shelters

## Testing Strategy

### After Seeding
1. Run `scripts/check-data-distribution.ts` to verify geographic spread
2. Calculate distances between assets and people/places
3. Verify minimum distances (should be 10-50km between parishes)
4. Test allocation planning with real data

### Validation Checks
- [ ] Assets spread across at least 8 parishes
- [ ] People spread across at least 6 parishes  
- [ ] Places spread across at least 5 parishes
- [ ] Minimum distance between same-type entities: 5km
- [ ] Maximum distance between entities: 200km (island-wide)
- [ ] All coordinates within Jamaica bounds
- [ ] All parishes/communities resolve correctly

## Example Data Structure

### Asset Example
```typescript
{
  name: "Montego Bay Food Warehouse",
  type: "food",
  parishCode: "JAM", // St. James
  communityName: "Montego Bay",
  latitude: 18.4762,
  longitude: -77.9189,
  status: "available",
  quantity: 5000, // For warehouse_inventory
}
```

### Person Example
```typescript
{
  name: "John Smith",
  type: "person_in_need",
  parishCode: "WML", // Westmoreland
  communityName: "Savanna-la-Mar",
  latitude: 18.2189,
  longitude: -78.1328,
  needs: ["Food", "Water"],
  urgency: "high",
}
```

### Place Example
```typescript
{
  name: "Savanna-la-Mar Community Shelter",
  type: "shelter",
  parishCode: "WML",
  communityName: "Savanna-la-Mar",
  latitude: 18.2200,
  longitude: -78.1350,
  maxCapacity: 200,
}
```

## Execution Steps

1. **Create seed data files** with geographic distribution
2. **Update seed script** to include new data
3. **Run seed script** to populate database
4. **Verify distribution** using check script
5. **Test allocation planning** with real geographic data

## Success Criteria

- Assets distributed across 8+ parishes
- People distributed across 6+ parishes
- Places distributed across 5+ parishes
- Minimum 20km distance between major entities
- Allocation planning can demonstrate cross-parish allocation
- Realistic test scenarios possible

## Estimated Time
2-3 hours

