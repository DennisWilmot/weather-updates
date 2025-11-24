import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses searchParams
export const dynamic = 'force-dynamic';

/**
 * Mapbox Routing API Endpoint
 * 
 * Fetches a driving route between two coordinates using Mapbox Directions API.
 * 
 * Required Environment Variable:
 * - MAPBOX_ACCESS_TOKEN: Your Mapbox API access token (get from mapbox.com)
 * 
 * Domain Configuration:
 * - Development: http://localhost:3000
 * - Production: [Your Vercel domain - to be configured]
 * 
 * When setting up your Mapbox token, add URL restrictions:
 * - http://localhost:3000/* (for development)
 * - https://[your-production-domain]/* (for production)
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromLng = searchParams.get('fromLng');
    const fromLat = searchParams.get('fromLat');
    const toLng = searchParams.get('toLng');
    const toLat = searchParams.get('toLat');
    
    // Get waypoints (optional, semicolon-separated: waypoints=lng1,lat1;lng2,lat2)
    const waypointsParam = searchParams.get('waypoints');

    // Validate required parameters
    if (!fromLng || !fromLat || !toLng || !toLat) {
      return NextResponse.json(
        { error: 'Missing required parameters: fromLng, fromLat, toLng, toLat' },
        { status: 400 }
      );
    }
    
    // Parse waypoints if provided
    const waypointCoords: Array<{ lng: number; lat: number }> = [];
    if (waypointsParam) {
      const waypointPairs = waypointsParam.split(';');
      for (const pair of waypointPairs) {
        const [lng, lat] = pair.split(',');
        const lngNum = parseFloat(lng);
        const latNum = parseFloat(lat);
        if (!isNaN(lngNum) && !isNaN(latNum) && 
            lngNum >= -180 && lngNum <= 180 && 
            latNum >= -90 && latNum <= 90) {
          waypointCoords.push({ lng: lngNum, lat: latNum });
        }
      }
    }

    // Validate coordinates are valid numbers
    const fromLngNum = parseFloat(fromLng);
    const fromLatNum = parseFloat(fromLat);
    const toLngNum = parseFloat(toLng);
    const toLatNum = parseFloat(toLat);

    if (
      isNaN(fromLngNum) || isNaN(fromLatNum) || isNaN(toLngNum) || isNaN(toLatNum) ||
      fromLngNum < -180 || fromLngNum > 180 ||
      fromLatNum < -90 || fromLatNum > 90 ||
      toLngNum < -180 || toLngNum > 180 ||
      toLatNum < -90 || toLatNum > 90
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90' },
        { status: 400 }
      );
    }

    // Get Mapbox token from environment
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      console.error('MAPBOX_ACCESS_TOKEN is not set');
      return NextResponse.json(
        { error: 'Mapbox service is not configured' },
        { status: 500 }
      );
    }

    // Format coordinates for Mapbox API: {lng},{lat};{waypoint1};{waypoint2};{end}
    // If waypoints exist, insert them between start and end
    const coordParts = [`${fromLngNum},${fromLatNum}`];
    waypointCoords.forEach(wp => {
      coordParts.push(`${wp.lng},${wp.lat}`);
    });
    coordParts.push(`${toLngNum},${toLatNum}`);
    const coordinates = coordParts.join(';');
    
    // Check if alternatives are requested
    const alternatives = searchParams.get('alternatives') === 'true';
    
    // Get avoid options
    const avoidTolls = searchParams.get('avoidTolls') === 'true';
    const avoidHighways = searchParams.get('avoidHighways') === 'true';
    const avoidBridges = searchParams.get('avoidBridges') === 'true';
    const avoidResidential = searchParams.get('avoidResidential') === 'true';
    
    // Build exclude parameter for Mapbox (comma-separated list)
    // Note: Mapbox supports: toll, motorway, ferry, tunnel
    // Bridge and residential may need custom handling or may not be directly supported
    const excludeList: string[] = [];
    if (avoidTolls) excludeList.push('toll');
    if (avoidHighways) excludeList.push('motorway');
    if (avoidBridges) excludeList.push('bridge'); // May not be directly supported by Mapbox
    // Note: avoidResidential is not directly supported by Mapbox exclude parameter
    // This would require custom filtering or post-processing of route results
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      access_token: mapboxToken,
      geometries: 'geojson',
    });
    
    if (alternatives) {
      queryParams.append('alternatives', 'true');
    }
    
    if (excludeList.length > 0) {
      queryParams.append('exclude', excludeList.join(','));
    }
    
    // Mapbox Directions API v5 endpoint with alternatives and avoid support
    const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?${queryParams.toString()}`;

    // Fetch route from Mapbox with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(mapboxUrl, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Mapbox API error (${response.status}):`, errorText);
        
        if (response.status === 401) {
          return NextResponse.json(
            { error: 'Invalid Mapbox token' },
            { status: 500 }
          );
        }
        
        if (response.status === 422) {
          return NextResponse.json(
            { error: 'Unable to find route between these coordinates' },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: 'Mapbox service error' },
          { status: 503 }
        );
      }

      const data = await response.json();

      // Validate response structure
      if (!data.routes || !Array.isArray(data.routes) || data.routes.length === 0) {
        console.error('Invalid Mapbox response:', data);
        return NextResponse.json(
          { error: 'No route found' },
          { status: 404 }
        );
      }

      // Extract all routes (primary + alternatives)
      const routes = data.routes.map((route: any, index: number) => {
        if (!route.geometry || !route.geometry.coordinates) {
          console.error(`Invalid route geometry for route ${index}:`, route);
          return null;
        }
        return {
          index,
          coordinates: route.geometry.coordinates, // [[lng, lat], [lng, lat], ...]
          distance: route.distance, // Distance in meters
          duration: route.duration, // Duration in seconds
          isPrimary: index === 0,
        };
      }).filter((route: any) => route !== null);

      if (routes.length === 0) {
        return NextResponse.json(
          { error: 'No valid routes found' },
          { status: 500 }
        );
      }

      // Return routes array (primary route first, then alternatives)
      return NextResponse.json({
        routes: routes,
        primaryRoute: routes[0], // For backward compatibility
        coordinates: routes[0].coordinates, // Primary route coordinates (backward compatibility)
        distance: routes[0].distance, // Primary route distance (backward compatibility)
        duration: routes[0].duration, // Primary route duration (backward compatibility)
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Mapbox API request timed out');
        return NextResponse.json(
          { error: 'Request timeout' },
          { status: 504 }
        );
      }

      console.error('Error fetching route from Mapbox:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch route' },
        { status: 503 }
      );
    }

  } catch (error: any) {
    console.error('Unexpected error in routing endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

