// Load environment variables FIRST before any other imports
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" }); // Fallback to .env if .env.local doesn't exist

import { db } from "./index";
import {
  parishes,
  communities,
  places,
  people,
  assets,
  warehouses,
  warehouseInventory,
  aidMissions,
  aidWorkerCapabilities,
  missionAssignments,
  assetDistributions,
  placeStatus,
  aidWorkerSchedules,
  roles,
} from "./schema";
import { jamaicaParishes } from "./seed-data/parishes";
import { jamaimaCommunities } from "./seed-data/communities";
import { sampleAssetDistributions } from "./seed-data/asset-distributions";
import { samplePlaceStatus } from "./seed-data/place-status";
import { sampleAidWorkerSchedules } from "./seed-data/aid-worker-schedules";
import { geographicAssets } from "./seed-data/geographic-assets";
import { geographicPeople } from "./seed-data/geographic-people";
import { geographicPlaces } from "./seed-data/geographic-places";
import { eq, and, sql } from "drizzle-orm";
import { rolePermissions } from "../permissions";
import type { UserRole } from "../permissions";

export async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  try {
    // Step 0: Seed default system roles
    await seedDefaultRoles();

    // Step 1: Seed parishes
    console.log("📍 Seeding parishes...");
    const parishMap = new Map<string, string>(); // code -> id mapping

    for (const parish of jamaicaParishes) {
      const [inserted] = await db
        .insert(parishes)
        .values({
          name: parish.name,
          code: parish.code,
          coordinates: parish.coordinates,
        })
        .onConflictDoUpdate({
          target: parishes.name,
          set: {
            code: parish.code,
            coordinates: parish.coordinates,
          },
        })
        .returning();

      parishMap.set(parish.code, inserted.id);
      console.log(`  ✓ ${parish.name} (${parish.code})`);
    }

    console.log(`✓ Seeded ${jamaicaParishes.length} parishes`);

    // Step 2: Seed communities
    console.log("🏘️  Seeding communities...");
    let communitiesCount = 0;

    for (const community of jamaimaCommunities) {
      const parishId = parishMap.get(community.parishCode);

      if (!parishId) {
        console.warn(
          `  ⚠️  Parish ${community.parishCode} not found for community ${community.name}`
        );
        continue;
      }

      await db
        .insert(communities)
        .values({
          name: community.name,
          parishId: parishId,
          coordinates: community.coordinates,
        })
        .onConflictDoNothing();

      communitiesCount++;
    }

    console.log(`✓ Seeded ${communitiesCount} communities`);

    // Step 3: Build community map (parishCode + communityName -> communityId)
    console.log("🗺️  Building community map...");
    const communityMap = new Map<string, string>(); // "parishCode:communityName" -> communityId

    for (const community of jamaimaCommunities) {
      const parishId = parishMap.get(community.parishCode);
      if (!parishId) continue;

      const [found] = await db
        .select()
        .from(communities)
        .where(
          and(
            eq(communities.parishId, parishId),
            eq(communities.name, community.name)
          )
        )
        .limit(1);

      if (found) {
        communityMap.set(`${community.parishCode}:${community.name}`, found.id);
      }
    }

    // Step 4: Seed asset distributions
    console.log("📦 Seeding asset distributions...");
    let distributionsCount = 0;

    for (const distribution of sampleAssetDistributions) {
      const communityKey = `${distribution.parishCode}:${distribution.communityName}`;
      const communityId = communityMap.get(communityKey);
      const parishId = parishMap.get(distribution.parishCode);

      if (!parishId || !communityId) {
        console.warn(
          `  ⚠️  Location not found for distribution: ${distribution.parishCode}:${distribution.communityName}`
        );
        continue;
      }

      await db
        .insert(assetDistributions)
        .values({
          organizationName: distribution.organizationName,
          distributionDate: distribution.distributionDate,
          organizationEntity: distribution.organizationEntity,
          parishId,
          communityId,
          latitude: distribution.latitude
            ? distribution.latitude.toString()
            : undefined,
          longitude: distribution.longitude
            ? distribution.longitude.toString()
            : undefined,
          itemsDistributed: distribution.itemsDistributed,
          recipientFirstName: distribution.recipientFirstName,
          recipientMiddleNames: distribution.recipientMiddleNames,
          recipientLastName: distribution.recipientLastName,
          recipientAlias: distribution.recipientAlias,
          recipientDateOfBirth: distribution.recipientDateOfBirth
            .toISOString()
            .split("T")[0], // Convert Date to YYYY-MM-DD string
          recipientSex: distribution.recipientSex,
          recipientTRN: distribution.recipientTRN,
          recipientPhone: distribution.recipientPhone,
          submittedBy: "system-seed", // Placeholder user ID
        })
        .onConflictDoNothing();

      distributionsCount++;
    }

    console.log(`✓ Seeded ${distributionsCount} asset distributions`);

    // Step 5: Seed place status
    console.log("🏢 Seeding place status...");
    let placeStatusCount = 0;

    for (const status of samplePlaceStatus) {
      const communityKey = `${status.parishCode}:${status.communityName}`;
      const communityId = communityMap.get(communityKey);
      const parishId = parishMap.get(status.parishCode);

      if (!parishId || !communityId) {
        console.warn(
          `  ⚠️  Location not found for place status: ${status.parishCode}:${status.communityName}`
        );
        continue;
      }

      await db
        .insert(placeStatus)
        .values({
          parishId,
          communityId,
          town: status.town,
          electricityStatus: status.electricityStatus,
          waterStatus: status.waterStatus,
          wifiStatus: status.wifiStatus,
          shelterName: status.shelterName,
          shelterCapacity: status.shelterCapacity,
          shelterMaxCapacity: status.shelterMaxCapacity,
          shelterAtCapacity: status.shelterAtCapacity,
          atCapacity: status.shelterAtCapacity ?? false, // Use shelterAtCapacity or default to false
          notes: status.notes,
          reportedBy: "system-seed", // Placeholder user ID
        })
        .onConflictDoNothing();

      placeStatusCount++;
    }

    console.log(`✓ Seeded ${placeStatusCount} place status records`);

    // Step 6: Seed aid worker schedules
    console.log("👷 Seeding aid worker schedules...");
    let schedulesCount = 0;

    for (const schedule of sampleAidWorkerSchedules) {
      await db
        .insert(aidWorkerSchedules)
        .values({
          workerName: schedule.workerName,
          workerId: schedule.workerId,
          organization: schedule.organization,
          capabilities: schedule.capabilities,
          missionType: schedule.missionType,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          durationHours: schedule.durationHours,
          currentLatitude: schedule.currentLatitude
            ? schedule.currentLatitude.toString()
            : undefined,
          currentLongitude: schedule.currentLongitude
            ? schedule.currentLongitude.toString()
            : undefined,
          deploymentArea: schedule.deploymentArea,
          status: schedule.status,
          contactPhone: schedule.contactPhone,
          contactEmail: schedule.contactEmail,
          createdBy: "system-seed", // Placeholder user ID
        })
        .onConflictDoNothing();

      schedulesCount++;
    }

    console.log(`✓ Seeded ${schedulesCount} aid worker schedules`);

    // Step 7: Seed geographic assets (for allocation planning)
    console.log("📦 Seeding geographic assets...");
    let assetsCount = 0;
    const warehouseMap = new Map<string, string>(); // "parishCode:lat:lng" -> warehouseId

    for (const asset of geographicAssets) {
      const communityKey = `${asset.parishCode}:${asset.communityName}`;
      const communityId = communityMap.get(communityKey);
      const parishId = parishMap.get(asset.parishCode);

      if (!parishId) {
        console.warn(
          `  ⚠️  Parish ${asset.parishCode} not found for asset ${asset.name}`
        );
        continue;
      }

      // Create or get warehouse for this location
      // Group assets by location (same lat/lng = same warehouse)
      const warehouseKey = `${asset.parishCode}:${asset.latitude.toFixed(4)}:${asset.longitude.toFixed(4)}`;
      let warehouseId = warehouseMap.get(warehouseKey);

      if (!warehouseId) {
        // Check if warehouse already exists at this location
        const [existing] = await db
          .select()
          .from(warehouses)
          .where(
            and(
              eq(warehouses.parishId, parishId),
              eq(warehouses.latitude, asset.latitude.toString()),
              eq(warehouses.longitude, asset.longitude.toString())
            )
          )
          .limit(1);

        if (existing) {
          warehouseId = existing.id;
          warehouseMap.set(warehouseKey, warehouseId);
        } else {
          // Create new warehouse
          const [warehouse] = await db
            .insert(warehouses)
            .values({
              name: asset.name
                .replace(" Warehouse", "")
                .replace(" Storage", "")
                .replace(" Depot", "")
                .replace(" Facility", "")
                .replace(" Center", "")
                .replace(" Food Bank", "")
                .replace(" Distribution", ""),
              parishId,
              communityId: communityId || undefined,
              latitude: asset.latitude.toString(),
              longitude: asset.longitude.toString(),
              status: "active",
            })
            .returning();

          if (warehouse) {
            warehouseId = warehouse.id;
            warehouseMap.set(warehouseKey, warehouseId);
          } else {
            console.warn(`  ⚠️  Could not create warehouse for ${asset.name}`);
            continue;
          }
        }
      }

      // Create or update warehouse inventory record
      if (warehouseId) {
        await db
          .insert(warehouseInventory)
          .values({
            warehouseId,
            itemCode: asset.type,
            quantity: asset.quantity,
            reservedQuantity: 0,
          })
          .onConflictDoUpdate({
            target: [
              warehouseInventory.warehouseId,
              warehouseInventory.itemCode,
            ],
            set: {
              quantity: asset.quantity, // Update to new quantity if conflict
            },
          });

        assetsCount++;
      }
    }

    console.log(
      `✓ Seeded ${assetsCount} geographic assets (warehouse inventory)`
    );

    // Step 8: Seed geographic people
    console.log("👥 Seeding geographic people...");
    let peopleCount = 0;

    for (const person of geographicPeople) {
      const communityKey = `${person.parishCode}:${person.communityName}`;
      const communityId = communityMap.get(communityKey);
      const parishId = parishMap.get(person.parishCode);

      if (!parishId) {
        console.warn(
          `  ⚠️  Parish ${person.parishCode} not found for person ${person.name}`
        );
        continue;
      }

      await db
        .insert(people)
        .values({
          name: person.name,
          type: person.type,
          parishId,
          communityId: communityId || undefined,
          latitude: person.latitude.toString(),
          longitude: person.longitude.toString(),
          contactName: person.contactName,
          contactPhone: person.contactPhone,
          contactEmail: person.contactEmail,
          needs: person.needs || [],
          skills: person.skills || [],
          organization: person.organization,
        })
        .onConflictDoNothing();

      peopleCount++;
    }

    console.log(`✓ Seeded ${peopleCount} geographic people`);

    // Step 9: Seed geographic places
    console.log("🏢 Seeding geographic places...");
    let placesCount = 0;

    for (const place of geographicPlaces) {
      const communityKey = `${place.parishCode}:${place.communityName}`;
      const communityId = communityMap.get(communityKey);
      const parishId = parishMap.get(place.parishCode);

      if (!parishId) {
        console.warn(
          `  ⚠️  Parish ${place.parishCode} not found for place ${place.name}`
        );
        continue;
      }

      await db
        .insert(places)
        .values({
          name: place.name,
          type: place.type,
          parishId,
          communityId: communityId || undefined,
          latitude: place.latitude.toString(),
          longitude: place.longitude.toString(),
          address: place.address,
          maxCapacity: place.maxCapacity,
          description: place.description,
          verified: true, // Mark as verified for seed data
        })
        .onConflictDoNothing();

      placesCount++;
    }

    console.log(`✓ Seeded ${placesCount} geographic places`);

    console.log("✅ Database seed completed successfully!");
    return {
      success: true,
      parishes: jamaicaParishes.length,
      communities: communitiesCount,
      distributions: distributionsCount,
      placeStatus: placeStatusCount,
      schedules: schedulesCount,
      geographicAssets: assetsCount,
      geographicPeople: peopleCount,
      geographicPlaces: placesCount,
    };
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

/**
 * Seed default system roles into the database
 */
async function seedDefaultRoles() {
  console.log("👥 Seeding default system roles...");

  const roleDescriptions: Record<UserRole, string> = {
    admin:
      "System Administrator - Full system access with complete administrative privileges",
    ops: "Operations Lead - Manages field deployments and coordinates response operations",
    field:
      "Field Reporter - Front-line personnel capturing real-time data and status updates",
    analyst:
      "Insights Analyst - Data analysis specialist focused on reporting and trend analysis",
    needs:
      "Needs Reporter - Limited role specifically for reporting people needs only",
  };

  for (const [roleName, permissions] of Object.entries(rolePermissions)) {
    const role = roleName as UserRole;

    try {
      await db
        .insert(roles)
        .values({
          name: role,
          description: roleDescriptions[role],
          permissions: permissions,
          isDefault: true,
          createdBy: null, // System roles have no creator
        })
        .onConflictDoUpdate({
          target: roles.name,
          set: {
            description: roleDescriptions[role],
            permissions: permissions,
            updatedAt: new Date(),
          },
        });

      console.log(
        `  ✅ Seeded role: ${role} (${permissions.length} permissions)`
      );
    } catch (error) {
      console.error(`  ❌ Failed to seed role ${role}:`, error);
    }
  }

  console.log("👥 Default roles seeding completed!");
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}
