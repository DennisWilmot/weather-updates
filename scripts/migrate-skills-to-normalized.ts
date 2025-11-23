import 'dotenv/config';
import { db } from '../lib/db';
import { people, skills, peopleSkills } from '../lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { normalizeSkillName, findOrCreateSkill } from '../lib/skill-normalization';

/**
 * Migration script to move skills from people.skills array to normalized tables
 * 
 * This script:
 * 1. Reads all people records with skills arrays
 * 2. Normalizes each skill name
 * 3. Creates skills records (deduplicated by normalized name)
 * 4. Creates people_skills junction records
 * 5. Logs progress and statistics
 * 
 * Run with: tsx scripts/migrate-skills-to-normalized.ts
 */

async function migrateSkills() {
  console.log('🚀 Starting skills migration...\n');

  try {
    // Step 1: Get all people with skills
    console.log('📊 Fetching people records with skills...');
    const allPeople = await db.select().from(people);
    
    const peopleWithSkills = allPeople.filter(
      (p) => p.skills && Array.isArray(p.skills) && p.skills.length > 0
    );

    console.log(`   Found ${peopleWithSkills.length} people with skills out of ${allPeople.length} total people\n`);

    if (peopleWithSkills.length === 0) {
      console.log('✅ No people with skills found. Migration complete.');
      return;
    }

    // Step 2: Process each person's skills
    let totalSkillsProcessed = 0;
    let totalAssociationsCreated = 0;
    let skillsCreated = 0;
    let skillsReused = 0;
    const skillMap = new Map<string, { id: string; name: string }>(); // normalizedName -> skill

    console.log('🔄 Processing skills...\n');

    for (let i = 0; i < peopleWithSkills.length; i++) {
      const person = peopleWithSkills[i];
      const personSkills = person.skills as string[];

      if (!personSkills || personSkills.length === 0) continue;

      console.log(`   [${i + 1}/${peopleWithSkills.length}] Processing ${person.contactName || person.name}...`);

      for (const skillName of personSkills) {
        if (!skillName || typeof skillName !== 'string' || skillName.trim().length === 0) {
          continue;
        }

        totalSkillsProcessed++;

        try {
          const normalizedName = normalizeSkillName(skillName);

          // Check if we've already processed this skill in this migration
          let skill = skillMap.get(normalizedName);

          if (!skill) {
            // Find or create skill in database
            skill = await findOrCreateSkill(skillName);
            skillMap.set(normalizedName, skill);

            // Check if it was newly created by checking if it exists in our map
            // (This is a simple heuristic - in practice, findOrCreateSkill handles this)
            const existingInDb = await db
              .select()
              .from(skills)
              .where(eq(skills.normalizedName, normalizedName))
              .limit(1);

            if (existingInDb.length > 0 && existingInDb[0].createdAt.getTime() > Date.now() - 5000) {
              // Likely just created (within 5 seconds)
              skillsCreated++;
            } else {
              skillsReused++;
            }
          } else {
            skillsReused++;
          }

          // Check if association already exists
          const existingAssociation = await db
            .select()
            .from(peopleSkills)
            .where(
              and(
                eq(peopleSkills.personId, person.id),
                eq(peopleSkills.skillId, skill.id)
              )
            )
            .limit(1);

          if (existingAssociation.length === 0) {
            // Create association
            await db.insert(peopleSkills).values({
              personId: person.id,
              skillId: skill.id,
            });
            totalAssociationsCreated++;
          }
        } catch (error) {
          console.error(`     ⚠️  Error processing skill "${skillName}":`, error);
        }
      }
    }

    // Step 3: Print statistics
    console.log('\n📈 Migration Statistics:');
    console.log(`   People processed: ${peopleWithSkills.length}`);
    console.log(`   Total skills processed: ${totalSkillsProcessed}`);
    console.log(`   Unique skills found/created: ${skillMap.size}`);
    console.log(`   Skills created: ${skillsCreated}`);
    console.log(`   Skills reused: ${skillsReused}`);
    console.log(`   People-skill associations created: ${totalAssociationsCreated}`);

    // Step 4: Verify migration
    console.log('\n🔍 Verifying migration...');
    const totalSkillsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(skills);
    const totalAssociationsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(peopleSkills);

    console.log(`   Total skills in database: ${Number(totalSkillsResult[0]?.count || 0)}`);
    console.log(`   Total associations in database: ${Number(totalAssociationsResult[0]?.count || 0)}`);

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run migration
migrateSkills()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

