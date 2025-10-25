import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const INGEST_TOKEN = process.env.INGEST_TOKEN;

// Only create Supabase client if environment variables are available
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
      auth: { persistSession: false }
    })
  : null;

export async function POST(req: NextRequest) {
  // Check if Supabase is configured
  if (!supabase) {
    return NextResponse.json({ 
      error: "Ingest service not configured - missing Supabase credentials" 
    }, { status: 503 });
  }

  // Check for authorization token
  if (req.headers.get("x-ingest-token") !== INGEST_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tweets = Array.isArray(body?.tweets) ? body.tweets : [];
  if (!tweets.length) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  // Transform tweets for database insertion
  const rows = tweets.map((t: any) => ({
    id: String(t.id),
    author: t.authorName ?? "",
    handle: t.authorHandle ?? "",
    created_at: new Date(t.date).toISOString(),
    text: t.content ?? "",
    url: t.url ?? "",
    raw: t
  }));

  try {
    const { error, count } = await supabase
      .from("tweets")
      .upsert(rows, { 
        onConflict: "id", 
        ignoreDuplicates: false,
        count: "exact" 
      });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      inserted: count ?? rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
