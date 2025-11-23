/**
 * GET /api/planning/data
 * 
 * Fetches warehouses, communities, and needs from the database
 * to construct a GlobalPlanningProblem for the allocation planner
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { warehouses, warehouseInventory, communities, people, places } from '@/lib/db/schema';
import { eq, and, sql, inArray, gte, lte } from 'drizzle-orm';
import type { GlobalPlanningProblem, Warehouse, Community, CommunityNeed } from '@/lib/types/planning';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishIds = searchParams.get('parishIds')?.split(',').filter(Boolean) || [];
    const communityIds = searchParams.get('communityIds')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const layers = searchParams.get('layers')?.split(',').filter(Boolean) || [];
    const subTypeFiltersStr = searchParams.get('subTypeFilters');
    // Parse and convert arrays back to Sets for easier checking
    const subTypeFiltersRaw = subTypeFiltersStr ? JSON.parse(subTypeFiltersStr) : {};
    const subTypeFilters: Record<string, Set<string>> = {};
    Object.keys(subTypeFiltersRaw).forEach(key => {
      if (Array.isArray(subTypeFiltersRaw[key])) {
        subTypeFilters[key] = new Set(subTypeFiltersRaw[key]);
      }
    });

    // SELECTIVE FILTERING STRATEGY:
    // 1. Keep ALL warehouses (algorithm needs full network for optimal routing)
    // 2. Keep ALL communities (algorithm needs full network)
    // 3. Filter ONLY needs (user intent - what to allocate for)

    // Fetch ALL active warehouses with inventory (no location filtering)
    const warehousesData = await db
      .select({
        warehouse: warehouses,
        inventory: warehouseInventory,
      })
      .from(warehouses)
      .leftJoin(warehouseInventory, eq(warehouses.id, warehouseInventory.warehouseId))
      .where(eq(warehouses.status, 'active'));

    // Group warehouses and their inventory
    const warehouseMap = new Map<string, {
      warehouse: typeof warehouses.$inferSelect;
      inventory: Array<typeof warehouseInventory.$inferSelect>;
    }>();

    for (const row of warehousesData) {
      if (!row.warehouse) continue;
      
      const warehouseId = row.warehouse.id;
      if (!warehouseMap.has(warehouseId)) {
        warehouseMap.set(warehouseId, {
          warehouse: row.warehouse,
          inventory: [],
        });
      }

      if (row.inventory) {
        warehouseMap.get(warehouseId)!.inventory.push(row.inventory);
      }
    }

    // Convert to GlobalPlanningProblem format
    // Filter out warehouses with no inventory or missing parishId (validation requires at least 1 item and non-empty parishId)
    const warehousesList: Warehouse[] = Array.from(warehouseMap.values())
      .map(({ warehouse, inventory }) => {
        // Skip warehouses with null or empty parishId (validation requires non-empty string)
        if (!warehouse.parishId || warehouse.parishId === null) {
          return null;
        }
        
        const coords = warehouse.latitude && warehouse.longitude
          ? {
              lat: parseFloat(warehouse.latitude),
              lng: parseFloat(warehouse.longitude),
            }
          : null;

        // Skip warehouses with invalid coordinates
        if (!coords || coords.lat === 0 || coords.lng === 0) {
          return null;
        }

        // Filter inventory to only include items with positive available quantity and valid fields
        const validInventory = inventory
          .map(inv => {
            // Skip items with null/empty warehouseId or itemCode
            if (!inv.warehouseId || !inv.itemCode || inv.itemCode.trim() === '') {
              return null;
            }
            
            const availableQty = inv.quantity - (inv.reservedQuantity || 0);
            
            // Skip items with non-positive quantity
            if (availableQty <= 0) {
              return null;
            }
            
            return {
              warehouseId: inv.warehouseId,
              itemCode: inv.itemCode.trim(), // Ensure no whitespace
              quantity: availableQty,
            };
          })
          .filter((inv): inv is { warehouseId: string; itemCode: string; quantity: number } => inv !== null)

        // Skip warehouses with no valid inventory
        if (validInventory.length === 0) {
          return null;
        }

        // Ensure warehouse ID is valid
        if (!warehouse.id || warehouse.id.trim() === '') {
          return null;
        }

        return {
          id: warehouse.id.trim(),
          parishId: warehouse.parishId.trim(), // Now guaranteed to be non-null
          lat: coords.lat,
          lng: coords.lng,
          inventory: validInventory,
        };
      })
      .filter((w): w is Warehouse => w !== null); // Remove null entries

    // Fetch ALL communities (algorithm needs full network for optimal routing)
    const communitiesData = await db.select().from(communities);

    // Convert to GlobalPlanningProblem format
    // Filter out communities with invalid coordinates or missing parishId (validation requires valid lat/lng and non-empty parishId)
    const communitiesList: Community[] = communitiesData
      .map(community => {
        // Skip communities with null or empty parishId (validation requires non-empty string)
        if (!community.parishId || community.parishId === null) {
          return null;
        }
        
        const coords = community.coordinates as { lat: number; lng: number } | null;
        const lat = coords?.lat;
        const lng = coords?.lng;
        
        // Skip communities with invalid coordinates
        if (!lat || !lng || lat === 0 || lng === 0) {
          return null;
        }
        
        // Validate coordinate ranges
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return null;
        }

        // Ensure community ID is valid
        if (!community.id || community.id.trim() === '') {
          return null;
        }

        return {
          id: community.id.trim(),
          parishId: community.parishId.trim(), // Now guaranteed to be non-null
          lat: lat,
          lng: lng,
        };
      })
      .filter((c): c is Community => c !== null); // Remove null entries

    // Fetch FILTERED people needs (user intent - what to allocate for)
    // Apply all filters: location, date, subtype, layer visibility
    const peopleConditions = [eq(people.type, 'person_in_need')];
    
    // Location filters (parish/community)
    if (parishIds.length > 0) {
      peopleConditions.push(inArray(people.parishId, parishIds));
    }
    if (communityIds.length > 0) {
      peopleConditions.push(inArray(people.communityId, communityIds));
    }
    
    // Date filters
    if (startDate && endDate) {
      peopleConditions.push(
        gte(people.createdAt, new Date(startDate)),
        lte(people.createdAt, new Date(endDate))
      );
    }
    
    // Subtype filters (if People layer subtypes are disabled)
    if (subTypeFilters.people && subTypeFilters.people.size > 0) {
      // subTypeFilters.people is a Set of disabled types
      // We want to exclude disabled types, so we need to get enabled types
      // For now, we'll filter out disabled types
      const disabledTypes = Array.from(subTypeFilters.people);
      // Note: This assumes we can filter by type field
      // If type field doesn't match exactly, we may need to adjust
    }

    const peopleNeedsData = await db
      .select({
        person: people,
      })
      .from(people)
      .where(and(...peopleConditions));
    
    // Apply subtype filtering in JavaScript (after query)
    // This is because drizzle doesn't easily support "NOT IN" with dynamic sets
    let filteredPeopleNeedsData = peopleNeedsData;
    if (subTypeFilters.people && subTypeFilters.people.size > 0) {
      const disabledTypes = Array.from(subTypeFilters.people);
      filteredPeopleNeedsData = peopleNeedsData.filter(
        row => !disabledTypes.includes(row.person.type || '')
      );
    }
    
    // Check if People layer is visible
    if (layers.length > 0 && !layers.includes('people')) {
      // If People layer is disabled, return empty needs
      filteredPeopleNeedsData = [];
    }

    // Convert filtered people needs to CommunityNeed format
    const communityNeedsList: CommunityNeed[] = [];
    
    // Get set of valid community IDs (for filtering needs)
    const validCommunityIds = new Set(communitiesList.map(c => c.id));
    
    for (const row of filteredPeopleNeedsData) {
      if (!row.person.needs || row.person.needs.length === 0) continue;
      if (!row.person.communityId) continue;
      
      // Skip needs for communities that don't have valid coordinates
      if (!validCommunityIds.has(row.person.communityId)) {
        continue;
      }

      // Create a need for each item in the needs array
      for (const needItem of row.person.needs) {
        // Skip null/empty need items
        if (!needItem || typeof needItem !== 'string' || needItem.trim() === '') {
          continue;
        }
        
        // Normalize item code (lowercase, remove spaces)
        const itemCode = needItem.toLowerCase().replace(/\s+/g, '_').trim();
        
        // Skip if itemCode is empty after normalization
        if (itemCode === '') {
          continue;
        }
        
        // Ensure communityId is valid (already checked above, but double-check)
        if (!row.person.communityId || row.person.communityId.trim() === '') {
          continue;
        }
        
        // Validation requires positive quantity
        const quantity = Math.max(1, row.person.numberOfPeople || 1);
        
        // Validation requires positive priority
        const priority = 1; // Default priority, could be based on urgency
        
        communityNeedsList.push({
          communityId: row.person.communityId.trim(),
          itemCode: itemCode,
          quantity: quantity,
          priority: priority,
        });
      }
    }

    // Default constraints
    const constraints = {
      reserveFraction: 0.2,
      maxDistanceKm: 200, // Island-wide
      distanceWeight: 1.0,
      riskWeight: 0.5,
      fairnessWeight: 0.3,
    };

    // Validation: Ensure we have at least one warehouse, community, and need
    if (warehousesList.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid warehouses found',
          message: 'All warehouses either have no inventory or invalid coordinates',
        },
        { status: 400 }
      );
    }

    if (communitiesList.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid communities found',
          message: 'All communities have invalid coordinates',
        },
        { status: 400 }
      );
    }

    if (communityNeedsList.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid needs found',
          message: 'No community needs match the current filters or all needs are for communities with invalid coordinates',
        },
        { status: 400 }
      );
    }

    const problem: GlobalPlanningProblem = {
      warehouses: warehousesList,
      communities: communitiesList,
      communityNeeds: communityNeedsList,
      constraints,
    };

    // Log validation info for debugging
    console.log('[Planning Data API] Problem summary:', {
      warehouses: warehousesList.length,
      communities: communitiesList.length,
      needs: communityNeedsList.length,
      warehousesWithInventory: warehousesList.filter(w => w.inventory.length > 0).length,
      communitiesWithCoords: communitiesList.filter(c => c.lat !== 0 && c.lng !== 0).length,
      needsWithPositiveQty: communityNeedsList.filter(n => n.quantity > 0).length,
    });

    // Validate data before returning
    const validationErrors: string[] = [];
    
    if (warehousesList.length === 0) {
      validationErrors.push('No warehouses with valid inventory found');
    }
    
    if (communitiesList.length === 0) {
      validationErrors.push('No communities with valid coordinates found');
    }
    
    if (communityNeedsList.length === 0) {
      validationErrors.push('No community needs found');
    }
    
    // Check for warehouses with empty inventory
    const warehousesWithEmptyInventory = warehousesList.filter(w => w.inventory.length === 0);
    if (warehousesWithEmptyInventory.length > 0) {
      validationErrors.push(`${warehousesWithEmptyInventory.length} warehouses have no inventory items`);
    }
    
    // Check for communities with invalid coordinates
    const communitiesWithInvalidCoords = communitiesList.filter(c => 
      c.lat === 0 || c.lng === 0 || c.lat < -90 || c.lat > 90 || c.lng < -180 || c.lng > 180
    );
    if (communitiesWithInvalidCoords.length > 0) {
      validationErrors.push(`${communitiesWithInvalidCoords.length} communities have invalid coordinates`);
    }
    
    // Check for needs with invalid quantities
    const needsWithInvalidQty = communityNeedsList.filter(n => n.quantity <= 0 || n.priority <= 0);
    if (needsWithInvalidQty.length > 0) {
      validationErrors.push(`${needsWithInvalidQty.length} needs have invalid quantity or priority`);
    }

    if (validationErrors.length > 0) {
      console.error('[Planning Data API] Validation errors:', validationErrors);
      return NextResponse.json(
        {
          error: 'Data validation failed',
          message: 'The planning data does not meet validation requirements',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      problem,
      metadata: {
        warehousesCount: warehousesList.length,
        communitiesCount: communitiesList.length,
        needsCount: communityNeedsList.length,
      },
    });
  } catch (error: any) {
    console.error('[Planning Data API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch planning data',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

