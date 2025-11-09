import { NextResponse } from 'next/server';

// Force dynamic rendering - this route uses request.url and fetches external data
export const dynamic = 'force-dynamic';

// GET /api/link-preview?url=... - Fetch Open Graph data for link previews
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  try {
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Fetch the HTML from the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract Open Graph meta tags
    const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] ||
                 html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)?.[1] ||
                 html.match(/<meta\s+property=["']og:image:url["']\s+content=["']([^"']+)["']/i)?.[1];

    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] ||
                 html.match(/<title>([^<]+)<\/title>/i)?.[1];

    const ogDescription = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1] ||
                      html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1];

    return NextResponse.json({
      success: true,
      data: {
        image: ogImage || null,
        title: ogTitle || null,
        description: ogDescription || null,
        url: url
      }
    });
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch link preview',
        data: {
          image: null,
          title: null,
          description: null,
          url: url || null
        }
      },
      { status: 500 }
    );
  }
}

