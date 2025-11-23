import { NextResponse } from 'next/server';
import type { GlobalPlanningProblem, GlobalPlanningResult } from '@/lib/types/planning';

// Force dynamic rendering - this route proxies to external service
export const dynamic = 'force-dynamic';

// Increase timeout for compute-intensive operations (Railway can handle long processes)
// maxDuration is in seconds - 300 = 5 minutes (Railway supports much longer)
export const maxDuration = 300; // 5 minutes for Next.js timeout

// Ensure URL has protocol
const getMatchingServiceUrl = () => {
  const url = process.env.MATCHING_SERVICE_URL || 'https://weather-updates-production.up.railway.app';
  // Add https:// if missing
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

const MATCHING_SERVICE_URL = getMatchingServiceUrl();

/**
 * POST /api/planning
 * 
 * Proxy endpoint to the matching service for global allocation planning.
 * 
 * Accepts a GlobalPlanningProblem and forwards it to the matching service,
 * then returns the GlobalPlanningResult.
 */
export async function POST(request: Request) {
  try {
    console.log('[Planning API] Request received');
    
    // Parse request body
    const body = await request.json() as GlobalPlanningProblem;
    console.log('[Planning API] Request body parsed:', {
      warehouses: body.warehouses?.length || 0,
      communities: body.communities?.length || 0,
      needs: body.communityNeeds?.length || 0,
    });
    
    // Validate and log data quality
    if (body.warehouses) {
      const warehousesWithNoInventory = body.warehouses.filter(w => !w.inventory || w.inventory.length === 0);
      const warehousesWithInvalidCoords = body.warehouses.filter(w => w.lat === 0 || w.lng === 0);
      if (warehousesWithNoInventory.length > 0) {
        console.warn('[Planning API] Warehouses with no inventory:', warehousesWithNoInventory.length);
      }
      if (warehousesWithInvalidCoords.length > 0) {
        console.warn('[Planning API] Warehouses with invalid coordinates:', warehousesWithInvalidCoords.length);
      }
    }
    
    if (body.communities) {
      const communitiesWithInvalidCoords = body.communities.filter(c => c.lat === 0 || c.lng === 0);
      if (communitiesWithInvalidCoords.length > 0) {
        console.warn('[Planning API] Communities with invalid coordinates:', communitiesWithInvalidCoords.length);
      }
    }
    
    if (body.communityNeeds) {
      const needsWithInvalidQty = body.communityNeeds.filter(n => n.quantity <= 0 || n.priority <= 0);
      if (needsWithInvalidQty.length > 0) {
        console.warn('[Planning API] Needs with invalid quantity/priority:', needsWithInvalidQty.length);
      }
    }

    // Validate that we have the required fields
    if (!body.warehouses || !body.communities || !body.communityNeeds || !body.constraints) {
      console.error('[Planning API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: warehouses, communities, communityNeeds, constraints' },
        { status: 400 }
      );
    }

    // Forward request to matching service
    const serviceUrl = `${MATCHING_SERVICE_URL}/plan`;
    console.log('[Planning API] Forwarding to:', serviceUrl);
    console.log('[Planning API] MATCHING_SERVICE_URL:', MATCHING_SERVICE_URL);
    
    // Retry logic for transient failures (Railway cold starts)
    const maxRetries = 2;
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      // Railway can handle long-running processes - set timeout to 4 minutes (240s) to stay under Next.js maxDuration
      let timeoutId: NodeJS.Timeout | null = setTimeout(() => controller.abort(), 240000); // 4 minute timeout
      
      try {
        if (attempt > 0) {
          console.log(`[Planning API] Retry attempt ${attempt}/${maxRetries}...`);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        
        console.log('[Planning API] Sending fetch request...');
        console.log('[Planning API] Request size:', JSON.stringify(body).length, 'bytes');
        
        const response = await fetch(serviceUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
          // Add keepalive for long requests
          keepalive: true,
        });
      
        console.log('[Planning API] Response status:', response.status);

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!response.ok) {
          // Try to parse error response
          let errorData;
          try {
            errorData = await response.json();
            console.error('[Planning API] Service error response:', JSON.stringify(errorData, null, 2));
          } catch {
            const text = await response.text().catch(() => 'Unable to read response');
            errorData = { error: `Service returned ${response.status}`, details: text };
            console.error('[Planning API] Service error (non-JSON):', text);
          }

          // Forward validation errors as 400 (don't retry)
          if (response.status === 400) {
            console.error('[Planning API] Validation error details:', errorData);
            return NextResponse.json(
              {
                error: errorData.error || 'Invalid request data',
                message: errorData.message || 'The planning service rejected the request data',
                details: errorData.details || errorData,
              },
              { status: 400 }
            );
          }

          // Service errors as 503 (retry on 503)
          if (response.status === 503 && attempt < maxRetries) {
            lastError = errorData;
            continue; // Retry
          }

          // Service errors as 503 (no more retries)
          return NextResponse.json(
            {
              error: 'Matching service error',
              message: errorData.message || errorData.error || 'Service unavailable',
              details: errorData,
            },
            { status: 503 }
          );
        }

        // Parse successful response
        const result = await response.json() as GlobalPlanningResult;
        console.log('[Planning API] Success! Shipments:', result.shipments?.length || 0);

        return NextResponse.json(result, { status: 200 });
      } catch (fetchError: any) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // If this is a retryable error and we have retries left, continue
        const isRetryableError = 
          fetchError.name === 'AbortError' ||
          fetchError.code === 'ECONNREFUSED' || 
          fetchError.code === 'ENOTFOUND' || 
          fetchError.code === 'ETIMEDOUT' ||
          fetchError.message?.includes('fetch failed') ||
          fetchError.message?.includes('Failed to fetch') ||
          fetchError.message?.includes('network') ||
          fetchError.message?.includes('ECONNRESET') ||
          fetchError.message?.includes('timeout');
          
        if (isRetryableError && attempt < maxRetries) {
          lastError = fetchError;
          continue; // Retry
        }
        
        // No more retries or non-retryable error
        console.error('[Planning API] Fetch error:', fetchError.name, fetchError.message, fetchError.code);

        // Handle timeout
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
          console.error('[Planning API] Request timeout after 4 minutes');
          return NextResponse.json(
            {
              error: 'Request timeout',
              message: 'The planning request took longer than 4 minutes to process. This may indicate a very large dataset or service issue.',
              suggestion: 'Try reducing the dataset size or check Railway service logs.',
            },
            { status: 504 }
          );
        }

        // Handle network errors
        const isNetworkError = 
          fetchError.code === 'ECONNREFUSED' || 
          fetchError.code === 'ENOTFOUND' || 
          fetchError.code === 'ETIMEDOUT' ||
          fetchError.message?.includes('fetch failed') ||
          fetchError.message?.includes('Failed to fetch') ||
          fetchError.message?.includes('network') ||
          fetchError.message?.includes('ECONNRESET');
          
        if (isNetworkError) {
          console.error('[Planning API] Network error - service unreachable:', fetchError.code, fetchError.message);
          return NextResponse.json(
            {
              error: 'Service unavailable',
              message: `Unable to connect to matching service at ${MATCHING_SERVICE_URL}`,
              details: fetchError.message || fetchError.code || 'Network error',
              suggestion: 'The service may be sleeping. Please try again in a few moments.',
            },
            { status: 503 }
          );
        }

        throw fetchError;
      }
    }
    
    // If we get here, all retries failed
    return NextResponse.json(
      {
        error: 'Service unavailable',
        message: 'Failed to connect after multiple attempts',
        details: lastError?.message || 'Unknown error',
        suggestion: 'The service may be sleeping or experiencing issues. Please try again in a few moments.',
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('[Planning API] Error in planning API route:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request',
      },
      { status: 500 }
    );
  }
}

