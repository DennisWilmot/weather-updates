import Replicate from "replicate";
import { NextResponse } from "next/server";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Convert file -> Blob because Replicate accepts blobs
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });

  // Run your chosen Whisper model
  //   const transcription = await replicate.run(
  //     "openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e",
  //     {
  //       input: {
  //         audio: blob, // works for video too
  //       },
  //     }
  //   );

  let trans = `Alright, how are you holding up?
  Boy, my day… I’ve been down by the light, down by the water. It’s been rough — a rough start.
  I’m sorry to hear. Have you ever worked before?
  Yeah, I was a farmer. Had a few crops under acres, you know what I mean? But I’m gone from that now.
  And what would you say you’re good at?
  Well, I know how to plow the ground. I know how to make pesticide from scratch. I even know how to cook up ingredients from scratch.
  Do you have any other non-farming skills?
  No… well, wait. Actually, I used to be a fisherman. I can fish, tie up nets.
  What’s your biggest immediate need right now?
  Right now, I need a house. Need some water. Electricity. I can’t be out here in the daytime.
  And is there any other secondary need that you have?
  Well, I’d love if I could get some food too. I’m hungry.
  Okay, alright. Thank you for your time, sir.`;

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
  "tone": "string",
  "contextual_notes": "string",
  "confidence": "low | medium | high"
}

Now analyze the following transcription:

TRANSCRIPTION:
${trans}
`;

  //   const output = await replicate.run("deepseek-ai/deepseek-v3.1", {
  //     input: {
  //       prompt,
  //       response_format: "json", // forces JSON output
  //     },
  //   });

  // Raw is an array of chunks — join them:
  //   const text = (output as string[]).join("");
  let text = `'''json
{
  "summary": "A man who was previously a farmer and fisherman is currently experiencing homelessness and hardship. He is struggling with basic needs like shelter, water, electricity, and food after having to leave his previous agricultural work.",
  "skills": ["farming", "crop cultivation", "plowing", "making pesticide from scratch", "cooking ingredients from scratch", "fishing", "net tying"],
  "needs": {
    "immediate": ["housing", "water", "electricity"],
    "secondary": ["food"]
  },
  "tone": "resigned, weary, cooperative",
  "contextual_notes": "The phrase 'I can’t be out here in the daytime' strongly implies he is currently without shelter and exposed to the elements. His departure from farming ('I’m gone from that now') suggests a significant life change or loss.",
  "confidence": "high"
}'''
`;

  // Parse
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}") + 1;
  const jsonStr = text.substring(start, end);
  const jsonObj = JSON.parse(jsonStr);
  //   console.log(jsonObj);
  //   const result = JSON.parse(text);

  return NextResponse.json(jsonObj);
}
