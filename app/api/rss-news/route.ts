import { NextResponse } from "next/server";

// RSS feeds for Jamaican news sources
const RSS_FEEDS = [
  'https://jamaica-gleaner.com/rss.xml',
  'https://jamaicaobserver.com/rss.xml', 
  'https://loopjamaica.com/rss.xml',
  'https://jamaica-star.com/rss.xml'
];

// Mock RSS data for now (in production, you'd parse real RSS feeds)
const mockRSSNews = [
  {
    id: "rss_1",
    author: "Jamaica Gleaner",
    handle: "jamaicagleaner",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    text: "🌪️ Hurricane Melissa Update: Storm intensifies as it approaches Jamaica. Meteorological Service issues hurricane warning for all parishes. Residents urged to prepare for heavy rainfall and strong winds.",
    url: "https://jamaica-gleaner.com/article/news/20241024/hurricane-melissa-update"
  },
  {
    id: "rss_2", 
    author: "Jamaica Observer",
    handle: "jamaicaobserver",
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    text: "🚨 Emergency Alert: ODPEM activates emergency response protocols as Hurricane Melissa approaches. All emergency shelters now open. Evacuation orders issued for low-lying areas.",
    url: "https://jamaicaobserver.com/news/hurricane-melissa-emergency-response"
  },
  {
    id: "rss_3",
    author: "Loop Jamaica", 
    handle: "loopjamaica",
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    text: "⚡ Power Outages: JPS reports 20,000 customers without power due to preemptive shutdowns. Emergency generators activated at hospitals and shelters. Restoration after storm passes.",
    url: "https://loopjamaica.com/power-outages-hurricane-melissa"
  }
];

export async function GET() {
  return new NextResponse(JSON.stringify({ tweets: mockRSSNews }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "s-maxage=300, stale-while-revalidate=150"
    }
  });
}
