import { createAuthInstance } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

// Create auth instance with request-specific baseURL for dynamic port support
// According to Better Auth docs: https://www.better-auth.com/docs/integrations/next
export async function GET(request: NextRequest) {
  try {
    const auth = createAuthInstance(request);
    if (!auth?.handler) {
      return NextResponse.json(
        { error: 'Auth handler not available' },
        { status: 500 }
      );
    }
    const handler = toNextJsHandler(auth.handler);
    return handler.GET(request);
  } catch (error: any) {
    console.error('Better Auth GET error:', error);
    return NextResponse.json(
      { error: 'Authentication error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Log request details for debugging
    const url = request.url;
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    console.log('[Better Auth] POST request:', {
      url,
      origin,
      referer,
      pathname: request.nextUrl.pathname,
    });

    const auth = createAuthInstance(request);
    if (!auth?.handler) {
      console.error('[Better Auth] Auth handler not available');
      return NextResponse.json(
        { error: 'Auth handler not available' },
        { status: 500 }
      );
    }
    
    const handler = toNextJsHandler(auth.handler);
    
    try {
      const response = await handler.POST(request);
      
      // If response is empty or undefined, return an error
      if (!response) {
        console.error('[Better Auth] Empty response from auth handler');
        return NextResponse.json(
          { error: 'Empty response from auth handler' },
          { status: 500 }
        );
      }
      
      // Log response status for debugging
      console.log('[Better Auth] Response status:', response.status);
      
      return response;
    } catch (handlerError: any) {
      console.error('[Better Auth] Handler.POST error:', handlerError);
      console.error('[Better Auth] Handler error message:', handlerError.message);
      console.error('[Better Auth] Handler error stack:', handlerError.stack);
      throw handlerError;
    }
  } catch (error: any) {
    console.error('[Better Auth] POST error:', error);
    console.error('[Better Auth] Error message:', error.message);
    console.error('[Better Auth] Error stack:', error.stack);
    
    // Return proper error response
    return NextResponse.json(
      { 
        error: 'Authentication error', 
        message: error.message || 'Unknown error',
        code: error.code || 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}

