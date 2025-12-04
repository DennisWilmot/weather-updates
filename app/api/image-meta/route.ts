import { NextRequest, NextResponse } from "next/server";
import exifr from "exifr";

export const maxDuration = 30; // Allow up to 30 seconds for processing

export async function POST(req: NextRequest) {
  try {
    // Parse the FormData
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer, then to Buffer for exifr
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract GPS data using exifr
    const data = await exifr.parse(buffer, { gps: true });

    if (!data || !data.latitude || !data.longitude) {
      return NextResponse.json(
        {
          error: "No GPS data found in image",
          latitude: null,
          longitude: null,
          altitude: null,
          timestamp: null,
        },
        { status: 200 } // Return 200 with null values instead of error
      );
    }

    // Format the response
    const response = {
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude ?? null,
      timestamp: data.DateTimeOriginal
        ? new Date(data.DateTimeOriginal).toISOString()
        : null,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error extracting GPS data:", error);
    return NextResponse.json(
      {
        error: "Failed to extract GPS data from image",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
