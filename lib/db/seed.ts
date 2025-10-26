import { db } from './index';
import { parishes, communities } from './schema';
import { jamaicaParishes } from './seed-data/parishes';
import { jamaimaCommunities } from './seed-data/communities';
import { eq } from 'drizzle-orm';

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

    console.log('✅ Database seed completed successfully!');
    return { success: true, parishes: jamaicaParishes.length, communities: communitiesCount };
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
