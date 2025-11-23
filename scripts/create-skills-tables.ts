import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function createTables() {
  try {
    const sqlContent = fs.readFileSync('/tmp/create-skills-tables.sql', 'utf8');
    await sql.unsafe(sqlContent);
    
    // Add foreign key constraints separately (they might already exist)
    try {
      await sql`ALTER TABLE "people_skills" ADD CONSTRAINT "people_skills_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;`;
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
    }
    
    try {
      await sql`ALTER TABLE "people_skills" ADD CONSTRAINT "people_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;`;
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
    }
    
    console.log('✅ Tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

createTables()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

