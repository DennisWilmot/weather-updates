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

/**
 * Lightweight endpoint that handles Whisper transcription via Replicate
 * Accepts video or audio file as FormData
 * Handles video-to-audio conversion server-side
 */
export async function POST(req: Request) {
  let inputPath = "";
  let outputPath = "";

  try {
    const formData = await req.formData();
    const file = (formData.get("video") || formData.get("audio")) as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "Video or audio file is required" },
        { status: 400 }
      );
    }

    // Check if it's already an audio file
    const fileType = file.type || "";
    const fileName = file.name || "";
    const isAudio =
      fileType.includes("audio/") ||
      fileName.includes(".opus") ||
      fileName.includes(".webm") ||
      fileName.includes(".mp3") ||
      fileName.includes(".ogg") ||
      fileName.includes(".wav");

    // Save uploaded file to temp directory
    const tempDir = os.tmpdir();
    inputPath = path.join(tempDir, `upload-${Date.now()}-${file.name}`);
    outputPath = path.join(tempDir, `audio-${Date.now()}.opus`);

    console.log("[Whisper] Saving file to:", inputPath);
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(inputPath, Buffer.from(arrayBuffer));
    console.log("[Whisper] File saved, size:", (arrayBuffer.byteLength / 1024).toFixed(2), "KB");

    // Convert to audio (only if not already audio)
    let audioFile: string;
    if (isAudio) {
      console.log("[Whisper] File is already audio, using directly");
      audioFile = inputPath;
    } else {
      console.log("[Whisper] Converting video to audio...");
      await compressVideoToAudio(inputPath, outputPath);
      audioFile = outputPath;
    }

    // Read audio file
    const audioBuffer = await fs.readFile(audioFile);
    console.log(
      "[Whisper] Audio buffer ready, size:",
      (audioBuffer.length / 1024).toFixed(2),
      "KB"
    );

    // Run Whisper (Replicate)
    console.log("[Whisper] Transcribing with Whisper...");
    const transcription = await replicate.run(
      "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
      {
        input: {
          audio: audioBuffer,
        },
      }
    );

    const text = (transcription as any).text || "";

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[Whisper] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Transcription error" },
      { status: 500 }
    );
  } finally {
    // Clean up temp files
    try {
      if (inputPath) await fs.unlink(inputPath);
    } catch {}

    try {
      if (outputPath && outputPath !== inputPath) await fs.unlink(outputPath);
    } catch {}
  }
}

