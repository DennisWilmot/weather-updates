import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  console.log("Upload request received:", body);

  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check for BLOB_READ_WRITE_TOKEN
    const token = process.env.BLOBS_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        {
          error:
            "BLOB_READ_WRITE_TOKEN is not configured. Please set up Vercel Blob storage in your Vercel dashboard.",
        },
        { status: 500 }
      );
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname) => {
        console.log("[Upload] Generating token for pathname:", pathname);
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/x-msvideo",
            "video/3gpp",
            "video/*", // Allow all video types
            "audio/webm",
            "audio/webm;codecs=opus",
            "audio/mpeg",
            "audio/mp3",
            "audio/ogg",
            "audio/opus",
            "audio/*", // Allow all audio types
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/*", // Allow all image types
          ],
          maximumSizeInBytes: 5 * 1024 * 1024 * 1024, // 5 TB (Vercel Blob maximum with multipart)
        };
      },
    });

    console.log("[Upload] Response:", JSON.stringify(jsonResponse, null, 2));
    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 400 }
    );
  }
}
