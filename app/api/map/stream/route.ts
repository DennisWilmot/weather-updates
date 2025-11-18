import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  assets,
  places,
  people,
  aidWorkerCapabilities,
  assetDistributions,
  peopleNeeds,
  placeStatus,
} from '@/lib/db/schema';
import { eq, gte, and } from 'drizzle-orm';
import {
  assetsToGeoJSON,
  placesToGeoJSON,
  peopleNeedsToGeoJSON,
  aidWorkersToGeoJSON,
  assetDistributionsToGeoJSON,
  placeStatusToGeoJSON,
} from '@/lib/maps/geojson';

export const dynamic = 'force-dynamic';

/**
 * GET /api/map/stream
 * Server-Sent Events endpoint for real-time map updates
 * Query params:
 *   - layers: Comma-separated list of layer types to subscribe to
 *   - parishId: Filter updates by parish
 *   - lastEventId: Resume from specific event (for reconnection)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const layersParam = searchParams.get('layers');
  const parishId = searchParams.get('parishId');
  const lastEventId = searchParams.get('lastEventId');

  // Parse requested layers
  const requestedLayers = layersParam
    ? layersParam.split(',').map((l) => l.trim())
    : ['assets', 'places', 'people', 'aid_workers', 'distributions', 'needs', 'status'];

  // Create SSE stream
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const send = (data: any) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('Error sending SSE message:', error);
        }
      };

      // Send initial state for all requested layers
      try {
        for (const layerType of requestedLayers) {
          let geoJSON: any = null;

          switch (layerType) {
            case 'assets':
              const assetsData = await db
                .select()
                .from(assets)
                .where(parishId ? eq(assets.parishId, parishId) : undefined);
              geoJSON = assetsToGeoJSON(assetsData);
              break;

            case 'places':
              const placesData = await db
                .select()
                .from(places)
                .where(parishId ? eq(places.parishId, parishId) : undefined);
              geoJSON = placesToGeoJSON(placesData);
              break;

            case 'people':
              const peopleData = await db
                .select()
                .from(people)
                .where(parishId ? eq(people.parishId, parishId) : undefined);
              geoJSON = {
                type: 'FeatureCollection',
                features: peopleData
                  .filter((p) => p.latitude && p.longitude)
                  .map((p) => ({
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: [
                        parseFloat(p.longitude!.toString()),
                        parseFloat(p.latitude!.toString()),
                      ],
                    },
                    properties: {
                      id: p.id,
                      name: p.name,
                      type: p.type,
                    },
                  })),
              };
              break;

            case 'aid_workers':
              const workersData = await db
                .select()
                .from(aidWorkerCapabilities)
                .innerJoin(people, eq(aidWorkerCapabilities.personId, people.id))
                .where(parishId ? eq(people.parishId, parishId) : undefined);
              geoJSON = aidWorkersToGeoJSON(
                workersData.map((r) => ({
                  ...r.aid_worker_capabilities,
                  person: r.people,
                }))
              );
              break;

            case 'distributions':
              const distributionsData = await db
                .select()
                .from(assetDistributions)
                .where(parishId ? eq(assetDistributions.parishId, parishId) : undefined);
              geoJSON = assetDistributionsToGeoJSON(distributionsData);
              break;

            case 'needs':
              const needsData = await db
                .select()
                .from(peopleNeeds)
                .where(parishId ? eq(peopleNeeds.parishId, parishId) : undefined);
              geoJSON = peopleNeedsToGeoJSON(needsData);
              break;

            case 'status':
              const statusData = await db
                .select()
                .from(placeStatus)
                .where(parishId ? eq(placeStatus.parishId, parishId) : undefined);
              geoJSON = placeStatusToGeoJSON(statusData);
              break;
          }

          if (geoJSON) {
            send({
              type: 'initial',
              layerType,
              data: geoJSON.features,
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error('Error sending initial state:', error);
        send({
          type: 'error',
          message: 'Failed to load initial state',
          timestamp: new Date().toISOString(),
        });
      }

      // Poll for updates every 5 seconds
      const pollInterval = setInterval(async () => {
        try {
          // Check for new/updated records since last check
          const since = new Date(Date.now() - 10000); // Last 10 seconds

          for (const layerType of requestedLayers) {
            let updates: any[] = [];

            switch (layerType) {
              case 'assets':
                const newAssets = await db
                  .select()
                  .from(assets)
                  .where(
                    parishId
                      ? eq(assets.parishId, parishId)
                      : and(gte(assets.createdAt, since))
                  );
                updates = assetsToGeoJSON(newAssets).features;
                break;

              case 'places':
                const newPlaces = await db
                  .select()
                  .from(places)
                  .where(
                    parishId
                      ? eq(places.parishId, parishId)
                      : and(gte(places.createdAt, since))
                  );
                updates = placesToGeoJSON(newPlaces).features;
                break;

              case 'distributions':
                const newDistributions = await db
                  .select()
                  .from(assetDistributions)
                  .where(
                    parishId
                      ? eq(assetDistributions.parishId, parishId)
                      : and(gte(assetDistributions.createdAt, since))
                  );
                updates = assetDistributionsToGeoJSON(newDistributions).features;
                break;

              case 'needs':
                const newNeeds = await db
                  .select()
                  .from(peopleNeeds)
                  .where(
                    parishId
                      ? eq(peopleNeeds.parishId, parishId)
                      : and(gte(peopleNeeds.createdAt, since))
                  );
                updates = peopleNeedsToGeoJSON(newNeeds).features;
                break;
            }

            if (updates.length > 0) {
              send({
                type: 'updated',
                layerType,
                data: updates,
                timestamp: new Date().toISOString(),
              });
            }
          }

          // Send heartbeat
          send({
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Error polling for updates:', error);
        }
      }, 5000); // Poll every 5 seconds

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for nginx
    },
  });
}

