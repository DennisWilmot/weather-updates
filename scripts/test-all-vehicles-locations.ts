#!/usr/bin/env tsx
/**
 * Test script to login with all vehicle credentials and add test location data
 * 
 * Usage:
 *   tsx scripts/test-all-vehicles-locations.ts
 * 
 * This script will:
 * 1. Login with each vehicle credential
 * 2. Add a test location within Jamaica for each vehicle
 * 3. Report success/failure for each
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const baseURL = process.env.BASE_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3001';

// Vehicle credentials (updated passwords to meet Better Auth requirements)
const vehicles = [
  { vehicle: 'Ed Vehicle 1', name: 'Henry', username: 'henry', password: 'Henry2024!' },
  { vehicle: 'Ed Vehicle 2', name: 'Lewis', username: 'lewis', password: 'Lewis2024!' },
  { vehicle: 'Ambulance', name: 'Dr. Bright', username: 'dr.bright', password: 'Bright2024!' },
  { vehicle: 'WDG Van', name: 'Liz', username: 'liz', password: 'Liz2024!' },
  { vehicle: 'JDF Vehicle', name: 'Lt Col Ranglin Edwards', username: 'ltcolranglinedwards', password: 'Ranglin2024!' },
  { vehicle: 'Food & Water Truck 1', name: 'Nickoy', username: 'nickoy', password: 'Nickoy2024!' },
  { vehicle: 'Food & Water Truck 2', name: 'Maurice', username: 'maurice', password: 'Maurice2024!' },
  { vehicle: 'Food & Water Truck 3', name: 'Teondray', username: 'teondray', password: 'Teondray2024!' },
  { vehicle: 'Food & Water Truck 4', name: 'Yassan', username: 'yassan', password: 'Yassan2024!' },
  { vehicle: 'Food & Water Truck 5', name: 'Mark', username: 'mark', password: 'Mark2024!' },
  { vehicle: 'Food & Water Truck 6', name: 'Lashen', username: 'lashen', password: 'Lashen2024!' },
  { vehicle: 'Food & Water Truck 7', name: 'Nicole', username: 'nicole', password: 'Nicole2024!' },
  { vehicle: 'Recon POC', name: 'Joel', username: 'joel', password: 'Joel2024!' },
];

// Jamaica test locations (spread across the island)
// Format: [longitude, latitude] - Jamaica coordinates range approximately:
// Latitude: 17.7 to 18.5, Longitude: -78.4 to -76.2
const jamaicaLocations = [
  { name: 'Kingston', lng: -76.7936, lat: 18.0179 }, // Capital
  { name: 'Montego Bay', lng: -77.9214, lat: 18.4712 }, // Tourist area
  { name: 'Spanish Town', lng: -76.9564, lat: 17.9911 }, // Historic town
  { name: 'Portmore', lng: -76.8722, lat: 17.9702 }, // Near Kingston
  { name: 'Mandeville', lng: -77.5011, lat: 18.0417 }, // Central Jamaica
  { name: 'Ocho Rios', lng: -77.1033, lat: 18.4025 }, // North coast
  { name: 'Negril', lng: -78.3481, lat: 18.2684 }, // West coast
  { name: 'Falmouth', lng: -77.6558, lat: 18.4936 }, // North coast
  { name: 'May Pen', lng: -77.2456, lat: 18.0314 }, // Clarendon
  { name: 'Savanna-la-Mar', lng: -78.1331, lat: 18.2190 }, // Westmoreland
  { name: 'St. Ann\'s Bay', lng: -77.2000, lat: 18.4333 }, // St. Ann
  { name: 'Port Antonio', lng: -76.4500, lat: 18.1767 }, // Portland
  { name: 'Morant Bay', lng: -76.4094, lat: 17.8814 }, // St. Thomas
];

interface TestResult {
  vehicle: string;
  username: string;
  loginSuccess: boolean;
  locationUpdateSuccess: boolean;
  error?: string;
  location?: { lat: number; lng: number; name: string };
}

async function loginUser(username: string, password: string): Promise<{ cookieHeader: string; success: boolean; error?: string }> {
  const email = `${username}@system.local`;
  const url = `${baseURL}/api/auth/sign-in/email`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    // Extract cookies from response
    const setCookieHeaders = response.headers.getSetCookie();
    const cookieHeader = setCookieHeaders.map(cookie => {
      // Extract just the key=value part before the first semicolon
      return cookie.split(';')[0];
    }).join('; ');

    const success = response.ok;

    if (!success) {
      // Try to get error message
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error?.message || errorData.message || errorMsg;
      } catch (e) {
        // Couldn't parse error, use status
      }
      return { cookieHeader, success: false, error: errorMsg };
    }

    return { cookieHeader, success };
  } catch (error: any) {
    console.error(`    Error: ${error.message}`);
    return { cookieHeader: '', success: false, error: error.message };
  }
}

async function updateLocation(
  cookieHeader: string,
  latitude: number,
  longitude: number,
  accuracy: number = 50
): Promise<boolean> {
  const url = `${baseURL}/api/user-locations`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        latitude,
        longitude,
        accuracy,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`    Response error: ${response.status} - ${errorText}`);
    }

    return response.ok;
  } catch (error: any) {
    console.error(`    Error: ${error.message}`);
    return false;
  }
}

async function testAllVehicles(): Promise<void> {
  console.log('🚗 Testing All Vehicle Credentials & Location Tracking');
  console.log('='.repeat(80));
  console.log(`Base URL: ${baseURL}`);
  console.log(`Total Vehicles: ${vehicles.length}`);
  console.log('='.repeat(80));
  console.log('');

  const results: TestResult[] = [];

  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    const location = jamaicaLocations[i % jamaicaLocations.length];

    console.log(`[${i + 1}/${vehicles.length}] Testing ${vehicle.vehicle} (${vehicle.name})...`);

    // Step 1: Login
    console.log(`  🔐 Logging in as ${vehicle.username}...`);
    const { cookieHeader, success: loginSuccess, error: loginError } = await loginUser(vehicle.username, vehicle.password);

    if (!loginSuccess || !cookieHeader) {
      const errorMsg = loginError || 'Login failed - no session cookie';
      console.log(`  ❌ Login failed for ${vehicle.username}: ${errorMsg}`);
      results.push({
        vehicle: vehicle.vehicle,
        username: vehicle.username,
        loginSuccess: false,
        locationUpdateSuccess: false,
        error: errorMsg,
      });
      console.log('');
      continue;
    }

    console.log(`  ✅ Login successful`);

    // Step 2: Update location
    console.log(`  📍 Adding location: ${location.name} (${location.lat}, ${location.lng})...`);
    const locationSuccess = await updateLocation(cookieHeader, location.lat, location.lng, 50);

    if (locationSuccess) {
      console.log(`  ✅ Location updated successfully`);
      results.push({
        vehicle: vehicle.vehicle,
        username: vehicle.username,
        loginSuccess: true,
        locationUpdateSuccess: true,
        location: {
          lat: location.lat,
          lng: location.lng,
          name: location.name,
        },
      });
    } else {
      console.log(`  ❌ Location update failed`);
      results.push({
        vehicle: vehicle.vehicle,
        username: vehicle.username,
        loginSuccess: true,
        locationUpdateSuccess: false,
        error: 'Location update failed',
      });
    }

    console.log('');
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log('');

  const successfulLogins = results.filter(r => r.loginSuccess).length;
  const successfulLocations = results.filter(r => r.locationUpdateSuccess).length;

  console.log(`Total Vehicles: ${results.length}`);
  console.log(`✅ Successful Logins: ${successfulLogins}/${results.length}`);
  console.log(`✅ Successful Location Updates: ${successfulLocations}/${results.length}`);
  console.log('');

  // Detailed results
  console.log('Detailed Results:');
  console.log('-'.repeat(80));
  results.forEach((result, index) => {
    const status = result.locationUpdateSuccess ? '✅' : result.loginSuccess ? '⚠️' : '❌';
    console.log(`${status} ${index + 1}. ${result.vehicle} (${result.username})`);
    if (result.loginSuccess && result.locationUpdateSuccess && result.location) {
      console.log(`   Location: ${result.location.name} (${result.location.lat}, ${result.location.lng})`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('');
  console.log('='.repeat(80));
  console.log('');

  // Check if all succeeded
  if (successfulLogins === results.length && successfulLocations === results.length) {
    console.log('🎉 All tests passed! All vehicles are logged in and have locations on the map.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the details above.');
    process.exit(1);
  }
}

// Run tests
testAllVehicles().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

