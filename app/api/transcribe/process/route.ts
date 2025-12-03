import Replicate from "replicate";
import { NextResponse } from "next/server";

// Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Route segment config for App Router
export const maxDuration = 300; // 5 minutes max duration

/**
 * Lightweight endpoint that processes transcription text with DeepSeek
 * Accepts transcription text and returns structured JSON
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transcription } = body;

    if (!transcription || typeof transcription !== "string") {
      return NextResponse.json(
        { error: "Transcription text is required" },
        { status: 400 }
      );
    }

    // Build prompt for DeepSeek
    const prompt = `
You are an AI that analyzes human speech transcriptions and extracts clear, structured information even when the text includes dialect (such as Jamaican patois), slang, or imperfect transcription quality.

Your job is to:
1. Interpret the meaning of the speaker's words, not just the literal text.
2. Correct transcription issues only when confidently inferable.
3. Identify the speaker's skills, needs, experiences, and general situation.
4. Condense the conversation into a short and clear summary.
5. Output everything as valid JSON.

IMPORTANT:
- Do NOT invent skills or needs that are not implied.
- If something is ambiguous, state it clearly.
- If a phrase appears to be Jamaican patois or mis-transcribed, interpret the intended meaning when possible.
- Your output MUST be valid JSON.

Your JSON output must use this structure:

{
  "summary": "string",
  "skills": ["string", ...],
  "needs": {
    "immediate": ["string", ...],
    "secondary": ["string", ...]
  },
  "contact":{
    "name": "string",
    "email":"string",
    "phone":"string",
  }
  "tone": "string",
  "contextual_notes": "string",
  "confidence": "low | medium | high"
}

Now analyze the following transcription:

TRANSCRIPTION:
${transcription}
`;

    console.log("[Process] Running DeepSeek analysis...");

    // Run DeepSeek
    const output = await replicate.run("deepseek-ai/deepseek-v3.1", {
      input: {
        prompt,
        response_format: "json",
      },
    });

    // DeepSeek returns array chunks — merge them into a single string
    const text = Array.isArray(output) ? output.join("") : String(output);

    // Extract only JSON
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    const jsonStr = text.substring(start, end);

    const jsonObj = JSON.parse(jsonStr);

    // Normalize skills if present
    if (jsonObj.skills && Array.isArray(jsonObj.skills)) {
      // Import normalization function
      const { normalizeSkillName } = await import("@/lib/skill-normalization");
      jsonObj.skills = jsonObj.skills.map((skill: string) => {
        // Normalize but keep original for display - we'll use normalized version for matching
        return skill.trim();
      });
    }

    return NextResponse.json(jsonObj);
  } catch (err: any) {
    console.error("[Process] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Processing error" },
      { status: 500 }
    );
  }
}

