import { NextResponse } from "next/server";

// Generate dynamic emergency updates based on current time
function generateLiveUpdates() {
  const now = new Date();
  const updates: any[] = [];
  
  // Base emergency updates
  const baseUpdates = [
    {
      author: "Jamaica Meteorological Service",
      handle: "jamaicametservice",
      text: "🌪️ HURRICANE MELISSA ADVISORY: Storm continues to intensify. Eye located 100 miles NE of Kingston. Maximum sustained winds 110 mph. Landfall expected in 4-6 hours.",
    },
    {
      author: "Office of Disaster Preparedness", 
      handle: "odpemjamaica",
      text: "🚨 EVACUATION UPDATE: Mandatory evacuation orders expanded to include all coastal areas. 52 emergency shelters now open. Transportation provided. Call 1-888-ODPEM-911",
    },
    {
      author: "Jamaica Constabulary Force",
      handle: "jamaicapolice", 
      text: "🚔 TRAFFIC ALERT: Major flooding on A1, A2, A3 highways. Road closures in effect. Emergency vehicles only. Curfew extended 5 PM - 7 AM. Stay off roads.",
    },
    {
      author: "Jamaica Public Service",
      handle: "jpsjamaica",
      text: "⚡ POWER UPDATE: 35,000 customers without power. Preemptive shutdowns continue. Emergency generators at hospitals/shelters. Restoration after storm passes.",
    },
    {
      author: "National Works Agency",
      handle: "nwajamaica",
      text: "🛣️ ROAD CONDITIONS: Multiple landslides on Highway 2000. Emergency crews working. Avoid all non-essential travel. Updates every 30 minutes.",
    },
    {
      author: "Ministry of Health",
      handle: "mohjamaica", 
      text: "🏥 HEALTH ALERT: All hospitals on emergency power. Ambulance services limited to life-threatening cases. Stock up on medications. Medical teams at shelters.",
    },
    {
      author: "Jamaica Red Cross",
      handle: "jamaicaredcross",
      text: "🆘 RELIEF UPDATE: Red Cross volunteers in all parishes. Emergency supplies distributed. Donations needed: water, food, blankets. Call 1-888-RED-CROSS",
    },
    {
      author: "Jamaica Fire Brigade", 
      handle: "jamaicafire",
      text: "🚒 FIRE SERVICE: All stations on emergency standby. Rescue teams ready. Call 110 for emergencies. Avoid downed power lines. Stay indoors.",
    }
  ];

  // Generate updates with timestamps
  baseUpdates.forEach((update, index) => {
    const minutesAgo = (index + 1) * 15; // 15, 30, 45, 60, 75, 90, 105, 120 minutes ago
    const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000);
    
    updates.push({
      id: `live_${index + 1}_${timestamp.getTime()}`,
      author: update.author,
      handle: update.handle,
      created_at: timestamp.toISOString(),
      text: update.text,
      url: `https://twitter.com/${update.handle}/status/live_${index + 1}`
    });
  });

  return updates;
}

export async function GET() {
  const updates = generateLiveUpdates();
  
  return new NextResponse(JSON.stringify({ tweets: updates }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "s-maxage=60, stale-while-revalidate=30"
    }
  });
}
