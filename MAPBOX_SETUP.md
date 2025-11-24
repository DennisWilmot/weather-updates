# Mapbox Routing Setup Guide

This guide explains how to set up Mapbox Directions API for displaying street routes on the map instead of straight lines.

## Prerequisites

- A Mapbox account (free tier available)
- Access to your project's `.env` file

## Step 1: Create Mapbox Account & Get Token

1. Go to [mapbox.com](https://www.mapbox.com) and sign up (or log in)
2. Navigate to your [Account page](https://account.mapbox.com/)
3. Scroll to "Access tokens" section
4. Copy your **Default public token** (or create a new token)

## Step 2: Configure Token Restrictions (Recommended)

For security, restrict your token to specific domains:

1. Click on your token (or create a new one)
2. Under "URL restrictions", add:
   - **Development:** `http://localhost:3000/*`
   - **Production:** `https://[your-production-domain]/*` (e.g., `https://your-app.vercel.app/*`)

**Note:** If you don't know your production domain yet, you can add it later or leave restrictions open for development.

## Step 3: Add Token to Environment Variables

Add the following to your `.env` file:

```env
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

**Important:** 
- Never commit your `.env` file to git
- Add `MAPBOX_ACCESS_TOKEN` to your production environment variables (Vercel dashboard, etc.)

## Step 4: Verify Setup

1. Start your development server: `npm run dev`
2. Navigate to the dashboard and click on an allocation plan shipment
3. The map should display a street route instead of a straight line

## Domain Configuration

### Development
- **Domain:** `http://localhost:3000`
- **Token Restriction:** `http://localhost:3000/*`

### Production
- **Domain:** Your Vercel deployment URL (check Vercel dashboard)
- **Token Restriction:** `https://[your-domain]/*`

To find your production domain:
1. Go to your Vercel dashboard
2. Select your project
3. Check the "Domains" section or look at your deployment URL

## Troubleshooting

### Routes Not Showing / Falling Back to Straight Lines

1. **Check token:** Verify `MAPBOX_ACCESS_TOKEN` is set in `.env`
2. **Check token restrictions:** Ensure your domain is allowed in Mapbox token settings
3. **Check browser console:** Look for routing API errors
4. **Check API logs:** Verify `/api/routing` endpoint is working

### Common Errors

- **"Mapbox service is not configured"**: `MAPBOX_ACCESS_TOKEN` is missing from `.env`
- **"Invalid Mapbox token"**: Token is incorrect or expired
- **"Unable to find route"**: Coordinates may be invalid or route doesn't exist (e.g., over water)
- **CORS errors**: Token URL restrictions don't match your domain

## API Endpoint

The routing functionality uses:
- **Endpoint:** `GET /api/routing`
- **Query Parameters:**
  - `fromLng`: Starting longitude
  - `fromLat`: Starting latitude
  - `toLng`: Destination longitude
  - `toLat`: Destination latitude

## Free Tier Limits

Mapbox free tier includes:
- **100,000 requests/month** for Directions API
- Sufficient for development and moderate production use

For higher usage, consider upgrading to a paid plan.

## Fallback Behavior

If routing fails for any reason (network error, invalid token, timeout), the system automatically falls back to displaying a straight line between the warehouse and community. This ensures shipments are always visible on the map.

