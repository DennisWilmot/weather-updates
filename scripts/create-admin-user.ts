import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function createAdminUser() {
  try {
    const username = 'admin';
    const password = 'Intellibus@123!';
    const fullName = 'Admin User';
    
    // Get admin key from environment or prompt
    const adminKey = process.env.ADMIN_SECRET_KEY;
    
    if (!adminKey) {
      console.error('❌ ADMIN_SECRET_KEY not found in environment variables.');
      console.error('Please set ADMIN_SECRET_KEY in .env.local or provide it as an argument.');
      process.exit(1);
    }

    console.log('Creating admin user via API...');
    console.log(`Username: ${username}`);

    // Use the API endpoint to create the user
    const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseURL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`,
      },
      body: JSON.stringify({
        username,
        password,
        fullName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create admin user');
    }

    console.log('✅ Admin user created successfully!');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`User ID: ${data.user?.id}`);
    console.log('\nYou can now log in at /login');
    console.log('\nNote: After creation, you may want to update the user role to "admin" in the database.');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.error('User already exists. If you need to reset, delete the user first.');
    }
    
    process.exit(1);
  }
}

createAdminUser();

