import { NextResponse } from "next/server";

// Realistic emergency updates for Hurricane Melissa
const emergencyUpdates = [
  {
    id: "update_1",
    author: "Jamaica Meteorological Service",
    handle: "jamaicametservice", 
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    text: "🌪️ HURRICANE MELISSA ADVISORY #8: Storm has intensified to Category 2. Eye located 120 miles NE of Kingston. Winds 100 mph. Landfall expected in 6-8 hours. All coastal areas under hurricane warning.",
    url: "https://twitter.com/jamaicametservice/status/update_1"
  },
  {
    id: "update_2",
    author: "Office of Disaster Preparedness",
    handle: "odpemjamaica",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    text: "🚨 MANDATORY EVACUATION: All residents in flood-prone areas of St. Thomas, Portland, and St. Mary must evacuate immediately. 47 emergency shelters open. Transportation provided. Call 1-888-ODPEM-911",
    url: "https://twitter.com/odpemjamaica/status/update_2"
  },
  {
    id: "update_3", 
    author: "Jamaica Constabulary Force",
    handle: "jamaicapolice",
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    text: "🚔 TRAFFIC ALERT: Major road closures on A1, A2, and A3 highways due to flooding. Use alternative routes. Emergency vehicles have priority. Curfew in effect 6 PM - 6 AM.",
    url: "https://twitter.com/jamaicapolice/status/update_3"
  },
  {
    id: "update_4",
    author: "Jamaica Public Service",
    handle: "jpsjamaica", 
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
    text: "⚡ POWER OUTAGE UPDATE: 25,000 customers without power. Preemptive shutdowns in high-risk areas. Emergency generators activated at hospitals and shelters. Restoration after storm passes.",
    url: "https://twitter.com/jpsjamaica/status/update_4"
  },
  {
    id: "update_5",
    author: "National Works Agency",
    handle: "nwajamaica",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    text: "🛣️ ROAD CONDITIONS: Multiple landslides on Highway 2000. Crews working to clear debris. Motorists advised to stay off roads. Emergency repairs ongoing. Updates every hour.",
    url: "https://twitter.com/nwajamaica/status/update_5"
  },
  {
    id: "update_6",
    author: "Ministry of Health",
    handle: "mohjamaica",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    text: "🏥 HEALTH ALERT: All hospitals on emergency power. Ambulance services limited to life-threatening emergencies. Stock up on medications. Emergency medical teams deployed to shelters.",
    url: "https://twitter.com/mohjamaica/status/update_6"
  },
  {
    id: "update_7",
    author: "Jamaica Red Cross",
    handle: "jamaicaredcross",
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    text: "🆘 RELIEF EFFORTS: Red Cross volunteers deployed to all parishes. Emergency supplies distributed to shelters. Donations needed: water, food, blankets. Call 1-888-RED-CROSS",
    url: "https://twitter.com/jamaicaredcross/status/update_7"
  },
  {
    id: "update_8",
    author: "Jamaica Fire Brigade",
    handle: "jamaicafire",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    text: "🚒 FIRE SERVICE ALERT: All fire stations on emergency standby. Rescue teams ready for flood emergencies. Call 110 for fire/rescue. Avoid downed power lines. Stay indoors.",
    url: "https://twitter.com/jamaicafire/status/update_8"
  }
];

export async function GET() {
  return new NextResponse(JSON.stringify({ tweets: emergencyUpdates }), {
    headers: {
      "content-type": "application/json", 
      "cache-control": "s-maxage=30, stale-while-revalidate=15"
    }
  });
}
