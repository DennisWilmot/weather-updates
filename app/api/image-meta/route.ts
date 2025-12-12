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

    // Extract GPS data using exifr with comprehensive options
    // Include all GPS-related tags and try multiple extraction methods
    const data = await exifr.parse(buffer, {
      gps: true,
      exif: true,
      translateKeys: false,
      reviveValues: true,
      sanitize: true,
      mergeOutput: true,
    });

    // Log for debugging (can be removed in production)
    console.log('EXIF data extracted:', {
      hasLatitude: !!data?.latitude,
      hasLongitude: !!data?.longitude,
      latitude: data?.latitude,
      longitude: data?.longitude,
      gps: data?.GPS,
      exif: data?.Exif,
    });

    // Try to extract GPS from different possible locations
    let latitude = data?.latitude;
    let longitude = data?.longitude;
    let altitude = data?.altitude ?? data?.GPSAltitude ?? null;

    // If not found in main data, try GPS object
    if (!latitude && data?.GPS?.GPSLatitude) {
      latitude = data.GPS.GPSLatitude;
    }
    if (!longitude && data?.GPS?.GPSLongitude) {
      longitude = data.GPS.GPSLongitude;
    }

    // Also check if GPS coordinates are in decimal format in GPS object
    if (!latitude && data?.GPS?.Latitude) {
      latitude = data.GPS.Latitude;
    }
    if (!longitude && data?.GPS?.Longitude) {
      longitude = data.GPS.Longitude;
    }

    if (!latitude || !longitude) {
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
      latitude: latitude,
      longitude: longitude,
      altitude: altitude,
      timestamp: data.DateTimeOriginal || data.CreateDate || data.ModifyDate
        ? new Date(data.DateTimeOriginal || data.CreateDate || data.ModifyDate).toISOString()
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
