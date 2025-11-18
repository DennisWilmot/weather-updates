import { db } from './index';
import { 
  parishes, 
  communities, 
  places,
  people,
  assets,
  aidMissions,
  aidWorkerCapabilities,
  missionAssignments,
  assetDistributions, 
  placeStatus, 
  peopleNeeds, 
  aidWorkerSchedules 
} from './schema';
import { jamaicaParishes } from './seed-data/parishes';
import { jamaimaCommunities } from './seed-data/communities';
import { sampleAssetDistributions } from './seed-data/asset-distributions';
import { samplePlaceStatus } from './seed-data/place-status';
import { samplePeopleNeeds } from './seed-data/people-needs';
import { sampleAidWorkerSchedules } from './seed-data/aid-worker-schedules';
import { eq, and } from 'drizzle-orm';

export async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Step 1: Seed parishes
    console.log('📍 Seeding parishes...');
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
    console.log('🏘️  Seeding communities...');
    let communitiesCount = 0;

    for (const community of jamaimaCommunities) {
      const parishId = parishMap.get(community.parishCode);

      if (!parishId) {
        console.warn(`  ⚠️  Parish ${community.parishCode} not found for community ${community.name}`);
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
    console.log('🗺️  Building community map...');
    const communityMap = new Map<string, string>(); // "parishCode:communityName" -> communityId
    
    for (const community of jamaimaCommunities) {
      const parishId = parishMap.get(community.parishCode);
      if (!parishId) continue;
      
      const [found] = await db
        .select()
        .from(communities)
        .where(and(
          eq(communities.parishId, parishId),
          eq(communities.name, community.name)
        ))
        .limit(1);
      
      if (found) {
        communityMap.set(`${community.parishCode}:${community.name}`, found.id);
      }
    }

    // Step 4: Seed asset distributions
    console.log('📦 Seeding asset distributions...');
    let distributionsCount = 0;
    
    for (const distribution of sampleAssetDistributions) {
      const communityKey = `${distribution.parishCode}:${distribution.communityName}`;
      const communityId = communityMap.get(communityKey);
      const parishId = parishMap.get(distribution.parishCode);
      
      if (!parishId || !communityId) {
        console.warn(`  ⚠️  Location not found for distribution: ${distribution.parishCode}:${distribution.communityName}`);
        continue;
      }
      
      await db.insert(assetDistributions).values({
        organizationName: distribution.organizationName,
        distributionDate: distribution.distributionDate,
        organizationEntity: distribution.organizationEntity,
        parishId,
        communityId,
        latitude: distribution.latitude ? distribution.latitude.toString() : undefined,
        longitude: distribution.longitude ? distribution.longitude.toString() : undefined,
        itemsDistributed: distribution.itemsDistributed,
        recipientFirstName: distribution.recipientFirstName,
        recipientMiddleNames: distribution.recipientMiddleNames,
        recipientLastName: distribution.recipientLastName,
        recipientAlias: distribution.recipientAlias,
        recipientDateOfBirth: distribution.recipientDateOfBirth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        recipientSex: distribution.recipientSex,
        recipientTRN: distribution.recipientTRN,
        recipientPhone: distribution.recipientPhone,
        submittedBy: 'system-seed', // Placeholder user ID
      }).onConflictDoNothing();
      
      distributionsCount++;
    }
    
    console.log(`✓ Seeded ${distributionsCount} asset distributions`);

    // Step 5: Seed place status
    console.log('🏢 Seeding place status...');
    let placeStatusCount = 0;
    
    for (const status of samplePlaceStatus) {
      const communityKey = `${status.parishCode}:${status.communityName}`;
      const communityId = communityMap.get(communityKey);
      const parishId = parishMap.get(status.parishCode);
      
      if (!parishId || !communityId) {
        console.warn(`  ⚠️  Location not found for place status: ${status.parishCode}:${status.communityName}`);
        continue;
      }
      
      await db.insert(placeStatus).values({
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
        reportedBy: 'system-seed', // Placeholder user ID
      }).onConflictDoNothing();
      
      placeStatusCount++;
    }
    
    console.log(`✓ Seeded ${placeStatusCount} place status records`);

    // Step 6: Seed people needs
    console.log('👥 Seeding people needs...');
    let peopleNeedsCount = 0;
    
    for (const need of samplePeopleNeeds) {
      const communityKey = `${need.parishCode}:${need.communityName}`;
      const communityId = communityMap.get(communityKey);
      const parishId = parishMap.get(need.parishCode);
      
      if (!parishId || !communityId) {
        console.warn(`  ⚠️  Location not found for people need: ${need.parishCode}:${need.communityName}`);
        continue;
      }
      
      await db.insert(peopleNeeds).values({
        parishId,
        communityId,
        latitude: need.latitude ? need.latitude.toString() : undefined,
        longitude: need.longitude ? need.longitude.toString() : undefined,
        needs: need.needs,
        contactName: need.contactName,
        contactPhone: need.contactPhone,
        contactEmail: need.contactEmail,
        numberOfPeople: need.numberOfPeople,
        urgency: need.urgency,
        description: need.description,
        status: need.status || 'pending',
        reportedBy: 'system-seed', // Placeholder user ID
      }).onConflictDoNothing();
      
      peopleNeedsCount++;
    }
    
    console.log(`✓ Seeded ${peopleNeedsCount} people needs records`);

    // Step 7: Seed aid worker schedules
    console.log('👷 Seeding aid worker schedules...');
    let schedulesCount = 0;
    
    for (const schedule of sampleAidWorkerSchedules) {
      await db.insert(aidWorkerSchedules).values({
        workerName: schedule.workerName,
        workerId: schedule.workerId,
        organization: schedule.organization,
        capabilities: schedule.capabilities,
        missionType: schedule.missionType,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        durationHours: schedule.durationHours,
        currentLatitude: schedule.currentLatitude ? schedule.currentLatitude.toString() : undefined,
        currentLongitude: schedule.currentLongitude ? schedule.currentLongitude.toString() : undefined,
        deploymentArea: schedule.deploymentArea,
        status: schedule.status,
        contactPhone: schedule.contactPhone,
        contactEmail: schedule.contactEmail,
        createdBy: 'system-seed', // Placeholder user ID
      }).onConflictDoNothing();
      
      schedulesCount++;
    }
    
    console.log(`✓ Seeded ${schedulesCount} aid worker schedules`);

    console.log('✅ Database seed completed successfully!');
    return { 
      success: true, 
      parishes: jamaicaParishes.length, 
      communities: communitiesCount,
      distributions: distributionsCount,
      placeStatus: placeStatusCount,
      peopleNeeds: peopleNeedsCount,
      schedules: schedulesCount,
    };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
