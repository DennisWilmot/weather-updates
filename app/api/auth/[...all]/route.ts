import { createAuthInstance } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Create auth instance with request-specific baseURL for dynamic port support
// According to Better Auth docs: https://www.better-auth.com/docs/integrations/next
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  try {
    // Await params as it's now a Promise in Next.js 15+
    const resolvedParams = await params;
    // Log request details for debugging
    const pathname = request.nextUrl.pathname;
    const cookies = request.headers.get("cookie");
    const allParams = resolvedParams?.all || [];
    console.log("[Better Auth] GET request:", {
      pathname,
      allParams,
      url: request.url,
      hasCookies: !!cookies,
      cookiePreview: cookies ? cookies.substring(0, 100) + "..." : "none",
      headers: Object.fromEntries(request.headers.entries()),
    });

    // Ensure we have a valid request object
    if (!request || !request.nextUrl) {
      console.error("[Better Auth] Invalid request object");
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const auth = createAuthInstance(request);
    if (!auth?.handler) {
      console.error("[Better Auth] Auth handler not available");
      return NextResponse.json(
        { error: "Auth handler not available" },
        { status: 500 }
      );
    }

    const handler = toNextJsHandler(auth.handler);

    try {
      const response = await handler.GET(request);

      // Better Auth handler should always return a response
      if (!response) {
        console.error("[Better Auth] Empty response from GET handler");
        return NextResponse.json(
          { error: "Empty response from auth handler" },
          { status: 500 }
        );
      }

      console.log("[Better Auth] GET response status:", response.status);
      return response;
    } catch (handlerError: any) {
      console.error("[Better Auth] Handler.GET error:", handlerError);
      console.error(
        "[Better Auth] Handler error message:",
        handlerError.message
      );
      console.error("[Better Auth] Handler error stack:", handlerError.stack);
      console.error("[Better Auth] Handler error name:", handlerError.name);
      console.error("[Better Auth] Handler error code:", handlerError.code);

      // Check if it's a known error type
      if (handlerError.statusCode) {
        return NextResponse.json(
          {
            error: handlerError.message || "Handler error",
            code: handlerError.code,
          },
          { status: handlerError.statusCode }
        );
      }

      throw handlerError;
    }
  } catch (error: any) {
    // Log detailed error information
    console.error("[Better Auth] GET error (outer catch):", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      statusCode: error.statusCode,
    });

    // Return proper error response
    return NextResponse.json(
      {
        error: "Authentication error",
        message: error.message || "Unknown error",
        code: error.code || "SERVER_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  try {
    // Await params as it's now a Promise in Next.js 15+
    const resolvedParams = await params;
    // Log request details for debugging
    const url = request.url;
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const pathname = request.nextUrl.pathname;
    const allParams = resolvedParams?.all || [];
    console.log("[Better Auth] POST request:", {
      url,
      origin,
      referer,
      pathname,
      allParams,
    });

    const auth = createAuthInstance(request);
    if (!auth?.handler) {
      console.error("[Better Auth] Auth handler not available");
      return NextResponse.json(
        { error: "Auth handler not available" },
        { status: 500 }
      );
    }

    const handler = toNextJsHandler(auth.handler);

    try {
      const response = await handler.POST(request);

      // If response is empty or undefined, return an error
      if (!response) {
        console.error("[Better Auth] Empty response from auth handler");
        return NextResponse.json(
          { error: "Empty response from auth handler" },
          { status: 500 }
        );
      }

      // Log response status for debugging
      console.log("[Better Auth] Response status:", response.status);

      return response;
    } catch (handlerError: any) {
      console.error("[Better Auth] Handler.POST error:", handlerError);
      console.error(
        "[Better Auth] Handler error message:",
        handlerError.message
      );
      console.error("[Better Auth] Handler error stack:", handlerError.stack);
      throw handlerError;
    }
  } catch (error: any) {
    console.error("[Better Auth] POST error:", error);
    console.error("[Better Auth] Error message:", error.message);
    console.error("[Better Auth] Error stack:", error.stack);

    // Return proper error response
    return NextResponse.json(
      {
        error: "Authentication error",
        message: error.message || "Unknown error",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
