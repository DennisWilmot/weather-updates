import Replicate from "replicate";
import { NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Convert uploaded video → compressed audio
function compressVideoToAudio(inputPath: string, outputPath: string) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .audioBitrate("16k")
      .audioCodec("libopus")
      .save(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject);
  });
}

// Route segment config for App Router
export const maxDuration = 300; // 5 minutes max duration

export async function POST(req: Request) {
  let inputPath = "";
  let outputPath = "";

  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // TEMP FILE PATHS
    const tempDir = os.tmpdir();
    inputPath = path.join(tempDir, `upload-${Date.now()}`);
    outputPath = path.join(tempDir, `audio-${Date.now()}.opus`);

    // Save uploaded file → disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buffer);

    // Convert to audio
    await compressVideoToAudio(inputPath, outputPath);

    const audioBuffer = await fs.readFile(outputPath);

    // Run Whisper (Replicate)
    const transcription = await replicate.run(
      "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
      {
        input: {
          audio: audioBuffer,
        },
      }
    );

    console.log();
    // Build prompt for DeepSeek — unchanged as requested
    const prompt = `
You are an AI that analyzes human speech transcriptions and extracts clear, structured information even when the text includes dialect (such as Jamaican patois), slang, or imperfect transcription quality.

Your job is to:
1. Interpret the meaning of the speaker’s words, not just the literal text.
2. Correct transcription issues only when confidently inferable.
3. Identify the speaker’s skills, needs, experiences, and general situation.
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
${(transcription as any).text}
`;

    // Run DeepSeek — left untouched
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
      const { normalizeSkillName } = await import('@/lib/skill-normalization');
      jsonObj.skills = jsonObj.skills.map((skill: string) => {
        // Normalize but keep original for display - we'll use normalized version for matching
        return skill.trim();
      });
    }

    return NextResponse.json(jsonObj);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Transcription error" },
      { status: 500 }
    );
  } finally {
    // ALWAYS CLEAN TEMP FILES
    try {
      if (inputPath) await fs.unlink(inputPath);
    } catch {}

    try {
      if (outputPath) await fs.unlink(outputPath);
    } catch {}
  }
}
