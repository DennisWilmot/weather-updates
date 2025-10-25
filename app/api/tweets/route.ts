import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function GET() {
  try {
    // Optional: Filter tweets from last 72 hours for emergency relevance
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from("tweets")
      .select("id, author, handle, created_at, text, url")
      .gte("created_at", threeDaysAgo) // Only recent tweets for emergency
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Supabase error:", error);
      
      // If table doesn't exist, return empty array instead of error
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.log("Tweets table doesn't exist yet, returning empty array");
        return new NextResponse(JSON.stringify({ tweets: [] }), {
          headers: {
            "content-type": "application/json",
            "cache-control": "s-maxage=120, stale-while-revalidate=60"
          }
        });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(JSON.stringify({ tweets: data ?? [] }), {
      headers: {
        "content-type": "application/json",
        "cache-control": "s-maxage=120, stale-while-revalidate=60"
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
