import { NextResponse } from "next/server";

// Mock emergency tweets for testing
const mockTweets = [
  {
    id: "mock_1",
    author: "Jamaica Meteorological Service",
    handle: "jamaicametservice",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    text: "🚨 HURRICANE MELISSA UPDATE: The storm is currently 150 miles northeast of Kingston. Maximum sustained winds of 75 mph. Residents in coastal areas should prepare for heavy rainfall and strong winds.",
    url: "https://twitter.com/jamaicametservice/status/mock_1"
  },
  {
    id: "mock_2", 
    author: "Office of Disaster Preparedness",
    handle: "odpemjamaica",
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    text: "⚠️ EMERGENCY ALERT: Hurricane Melissa is approaching Jamaica. All emergency shelters are now open. Evacuation orders issued for low-lying areas in St. Thomas and Portland.",
    url: "https://twitter.com/odpemjamaica/status/mock_2"
  },
  {
    id: "mock_3",
    author: "Jamaica Constabulary Force",
    handle: "jamaicapolice",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    text: "🚔 POLICE UPDATE: Road closures in effect on A1 highway due to flooding. Alternative routes available. Emergency services remain operational. Call 119 for emergencies.",
    url: "https://twitter.com/jamaicapolice/status/mock_3"
  },
  {
    id: "mock_4",
    author: "Jamaica Public Service",
    handle: "jpsjamaica",
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    text: "⚡ POWER UPDATE: Preemptive power outages in effect for safety. 15,000 customers affected. Restoration will begin once conditions are safe. Report outages: 1-888-CALL-JPS",
    url: "https://twitter.com/jpsjamaica/status/mock_4"
  },
  {
    id: "mock_5",
    author: "National Works Agency",
    handle: "nwajamaica",
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    text: "🛣️ ROAD CONDITIONS: Major flooding reported on Highway 2000. Crews deployed for emergency repairs. Motorists advised to avoid flooded areas and use alternative routes.",
    url: "https://twitter.com/nwajamaica/status/mock_5"
  }
];

export async function GET() {
  return new NextResponse(JSON.stringify({ tweets: mockTweets }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "s-maxage=60, stale-while-revalidate=30"
    }
  });
}
