import * as fs from 'fs';
import * as path from 'path';

// Vehicle and personnel data
const vehicles = [
  { vehicle: 'Ed Vehicle 1', name: 'Henry', description: 'Ed Vehicle 1 (with Ed in it)' },
  { vehicle: 'Ed Vehicle 2', name: 'Lewis', description: 'Ed Vehicle 2 (security from the rear)' },
  { vehicle: 'Ambulance', name: 'Dr. Bright', description: 'Ambulance' },
  { vehicle: 'WDG Van', name: 'Liz', description: 'WDG Van' },
  { vehicle: 'JDF Vehicle', name: 'Lt Col Ranglin Edwards', description: 'JDF Vehicle' },
  { vehicle: 'Food & Water Truck 1', name: 'Nickoy', description: 'Truck 1' },
  { vehicle: 'Food & Water Truck 2', name: 'Maurice', description: 'Truck 2' },
  { vehicle: 'Food & Water Truck 3', name: 'Teondray', description: 'Truck 3' },
  { vehicle: 'Food & Water Truck 4', name: 'Yassan', description: 'Truck 4' },
  { vehicle: 'Food & Water Truck 5', name: 'Mark', description: 'Truck 5' },
  { vehicle: 'Food & Water Truck 6', name: 'Lashen', description: 'Truck 6' },
  { vehicle: 'Food & Water Truck 7', name: 'Nicole', description: 'Truck 7' },
  { vehicle: 'Recon POC', name: 'Joel', description: 'Recon POC' },
];

// Generate simple but unique passwords
function generatePassword(name: string, index: number): string {
  // Create a simple password based on name initials and vehicle number
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  
  // Use vehicle number or index for uniqueness
  const vehicleNum = index + 1;
  
  // Format: Initials + VehicleNum + "2024"
  return `${initials}${vehicleNum}2024`;
}

// Generate credentials
const credentials = vehicles.map((vehicle, index) => {
  const username = vehicle.name.toLowerCase().replace(/\s+/g, '');
  const password = generatePassword(vehicle.name, index);
  
  return {
    username,
    password,
    fullName: `${vehicle.name} - ${vehicle.description}`,
    vehicle: vehicle.vehicle,
  };
});

// Format output
let output = 'VEHICLE CREDENTIALS\n';
output += '='.repeat(80) + '\n\n';
output += `Generated: ${new Date().toLocaleString()}\n`;
output += `Total Users: ${credentials.length}\n\n`;
output += '='.repeat(80) + '\n\n';

credentials.forEach((cred, index) => {
  output += `${index + 1}. ${cred.vehicle}\n`;
  output += `   Name: ${cred.fullName}\n`;
  output += `   Username: ${cred.username}\n`;
  output += `   Password: ${cred.password}\n`;
  output += `   Email: ${cred.username}@system.local\n`;
  output += '\n';
});

output += '='.repeat(80) + '\n\n';
output += 'CSV FORMAT (for easy import):\n';
output += 'Username,Password,FullName,Email\n';
credentials.forEach(cred => {
  output += `${cred.username},${cred.password},"${cred.fullName}",${cred.username}@system.local\n`;
});

output += '\n' + '='.repeat(80) + '\n\n';
output += 'JSON FORMAT (for API calls):\n';
output += JSON.stringify(credentials, null, 2);

// Write to file
const outputPath = path.join(__dirname, '..', 'vehicle-credentials.txt');
fs.writeFileSync(outputPath, output, 'utf-8');

console.log('✅ Credentials generated successfully!');
console.log(`📄 Output file: ${outputPath}`);
console.log(`\nTotal users: ${credentials.length}`);
console.log('\nSample credentials:');
credentials.slice(0, 3).forEach(cred => {
  console.log(`  ${cred.username} / ${cred.password}`);
});

