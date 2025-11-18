/**
 * Script to run database seed with environment variables loaded
 */

// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
config({ path: '.env' });

// Now import after env is loaded
const { seedDatabase } = require('../lib/db/seed');

seedDatabase()
  .then((result: any) => {
    console.log('\n✅ Seed completed successfully!');
    console.log('Summary:', result);
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

