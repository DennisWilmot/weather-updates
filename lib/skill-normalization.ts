import { db } from '@/lib/db';
import { skills, peopleSkills } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Normalize a skill name for consistent matching
 * - Convert to lowercase
 * - Trim whitespace
 * - Normalize "&" to "and"
 * - Remove extra spaces
 */
export function normalizeSkillName(skill: string): string {
  return skill
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and') // "Search & Rescue" -> "search and rescue"
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
    .trim();
}

/**
 * Find an existing skill by normalized name, or create it if it doesn't exist
 * Returns the skill ID and display name
 */
export async function findOrCreateSkill(skillName: string): Promise<{ id: string; name: string }> {
  const normalizedName = normalizeSkillName(skillName);
  
  // Try to find existing skill by normalized name
  const existing = await db
    .select()
    .from(skills)
    .where(eq(skills.normalizedName, normalizedName))
    .limit(1);

  if (existing.length > 0) {
    return { id: existing[0].id, name: existing[0].name };
  }

  // Create new skill - use original name as display name, normalized as normalizedName
  const [newSkill] = await db
    .insert(skills)
    .values({
      name: skillName.trim(), // Keep original capitalization for display
      normalizedName: normalizedName,
    })
    .returning();

  return { id: newSkill.id, name: newSkill.name };
}

/**
 * Associate a person with multiple skills
 * Creates people_skills junction records, skipping duplicates
 */
export async function associatePersonWithSkills(
  personId: string,
  skillNames: string[]
): Promise<void> {
  if (!skillNames || skillNames.length === 0) {
    return;
  }

  // Process each skill
  for (const skillName of skillNames) {
    if (!skillName || typeof skillName !== 'string' || skillName.trim().length === 0) {
      continue; // Skip empty/invalid skills
    }

    try {
      // Find or create the skill
      const skill = await findOrCreateSkill(skillName);

      // Check if association already exists
      const existing = await db
        .select()
        .from(peopleSkills)
        .where(
          and(
            eq(peopleSkills.personId, personId),
            eq(peopleSkills.skillId, skill.id)
          )
        )
        .limit(1);

      // Create association if it doesn't exist
      if (existing.length === 0) {
        await db.insert(peopleSkills).values({
          personId,
          skillId: skill.id,
        });
      }
    } catch (error) {
      console.error(`Error associating skill "${skillName}" with person ${personId}:`, error);
      // Continue with next skill even if one fails
    }
  }
}

/**
 * Get all skills for a person
 */
export async function getPersonSkills(personId: string): Promise<Array<{ id: string; name: string }>> {
  const result = await db
    .select({
      id: skills.id,
      name: skills.name,
    })
    .from(peopleSkills)
    .innerJoin(skills, eq(peopleSkills.skillId, skills.id))
    .where(eq(peopleSkills.personId, personId));

  return result;
}


