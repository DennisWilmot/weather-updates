/**
 * GeoJSON conversion utilities
 * Convert database records to GeoJSON FeatureCollection format
 */

import { FeatureCollection, Feature, Point, Geometry } from 'geojson';

/**
 * Convert assets to GeoJSON
 */
export function assetsToGeoJSON(assets: any[]): FeatureCollection {
  const features: Feature<Point>[] = assets
    .filter((asset) => asset.latitude && asset.longitude)
    .map((asset) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          parseFloat(asset.longitude.toString()),
          parseFloat(asset.latitude.toString()),
        ],
      },
      properties: {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        status: asset.status,
        isOneTime: asset.is_one_time,
        serialNumber: asset.serial_number,
        organization: asset.organization,
        currentLocation: asset.current_location,
        parishId: asset.parish_id,
        communityId: asset.community_id,
        createdAt: asset.created_at,
      },
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Convert places to GeoJSON
 */
export function placesToGeoJSON(places: any[]): FeatureCollection {
  const features: Feature<Point>[] = places
    .filter((place) => place.latitude && place.longitude)
    .map((place) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          parseFloat(place.longitude.toString()),
          parseFloat(place.latitude.toString()),
        ],
      },
      properties: {
        id: place.id,
        name: place.name,
        type: place.type,
        address: place.address,
        maxCapacity: place.max_capacity,
        description: place.description,
        verified: place.verified,
        parishId: place.parish_id,
        communityId: place.community_id,
        createdAt: place.created_at,
      },
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Convert place status to GeoJSON
 */
export function placeStatusToGeoJSON(placeStatuses: any[]): FeatureCollection {
  const features = placeStatuses
    .map((status) => {
      // Try to get coordinates from place, otherwise use parish/community center
      let coordinates: [number, number] | null = null;

      if (status.place?.latitude && status.place?.longitude) {
        coordinates = [
          parseFloat(status.place.longitude.toString()),
          parseFloat(status.place.latitude.toString()),
        ];
      } else if (status.parish?.coordinates) {
        const coords = status.parish.coordinates;
        if (coords.lng && coords.lat) {
          coordinates = [coords.lng, coords.lat];
        }
      }

      if (!coordinates) {
        return null;
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates,
        },
        properties: {
          id: status.id,
          placeId: status.place_id,
          placeName: status.place?.name,
          town: status.town,
          electricityStatus: status.electricity_status,
          waterStatus: status.water_status,
          wifiStatus: status.wifi_status,
          currentCapacity: status.current_capacity,
          maxCapacity: status.max_capacity,
          atCapacity: status.at_capacity,
          notes: status.notes,
          verified: status.verified,
          parishId: status.parish_id,
          communityId: status.community_id,
          reportedBy: status.reported_by,
          createdAt: status.created_at,
        },
      };
    })
    .filter((f) => f !== null) as Feature<Point>[];

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Convert people needs to GeoJSON
 */
export function peopleNeedsToGeoJSON(peopleNeeds: any[]): FeatureCollection {
  const features: Feature<Point>[] = peopleNeeds
    .filter((need) => need.latitude && need.longitude)
    .map((need) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          parseFloat(need.longitude.toString()),
          parseFloat(need.latitude.toString()),
        ],
      },
      properties: {
        id: need.id,
        personId: need.person_id,
        needs: need.needs,
        contactName: need.contact_name,
        contactPhone: need.contact_phone,
        contactEmail: need.contact_email,
        numberOfPeople: need.number_of_people,
        urgency: need.urgency,
        description: need.description,
        status: need.status,
        parishId: need.parish_id,
        communityId: need.community_id,
        reportedBy: need.reported_by,
        createdAt: need.created_at,
      },
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Convert aid workers to GeoJSON
 */
export function aidWorkersToGeoJSON(aidWorkers: any[]): FeatureCollection {
  const features: Feature<Point>[] = aidWorkers
    .filter((worker) => {
      // Use current location or person location
      return (
        (worker.current_latitude && worker.current_longitude) ||
        (worker.person?.latitude && worker.person?.longitude)
      );
    })
    .map((worker) => {
      let coordinates: [number, number];
      if (worker.current_latitude && worker.current_longitude) {
        coordinates = [
          parseFloat(worker.current_longitude.toString()),
          parseFloat(worker.current_latitude.toString()),
        ];
      } else {
        coordinates = [
          parseFloat(worker.person.longitude.toString()),
          parseFloat(worker.person.latitude.toString()),
        ];
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates,
        },
        properties: {
          id: worker.id,
          personId: worker.person_id,
          capabilities: worker.capabilities,
          availabilityStatus: worker.availability_status,
          personName: worker.person?.name,
          organization: worker.person?.organization,
          parishId: worker.person?.parish_id,
          communityId: worker.person?.community_id,
          createdAt: worker.created_at,
        },
      };
    });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Convert asset distributions to GeoJSON
 */
export function assetDistributionsToGeoJSON(distributions: any[]): FeatureCollection {
  const features: Feature<Point>[] = distributions
    .filter((dist) => dist.latitude && dist.longitude)
    .map((dist) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          parseFloat(dist.longitude.toString()),
          parseFloat(dist.latitude.toString()),
        ],
      },
      properties: {
        id: dist.id,
        assetId: dist.asset_id,
        assetType: dist.asset_type,
        personId: dist.person_id,
        placeId: dist.place_id,
        organizationName: dist.organization_name,
        distributionDate: dist.distribution_date,
        organizationEntity: dist.organization_entity,
        itemsDistributed: dist.items_distributed,
        isOneTime: dist.is_one_time,
        recipientFirstName: dist.recipient_first_name,
        recipientLastName: dist.recipient_last_name,
        parishId: dist.parish_id,
        communityId: dist.community_id,
        submittedBy: dist.submitted_by,
        createdAt: dist.created_at,
        // Weight for heatmap (can be based on quantity, urgency, etc.)
        weight: dist.items_distributed?.length || 1,
      },
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Convert aid missions to GeoJSON
 */
export function aidMissionsToGeoJSON(missions: any[]): FeatureCollection {
  const features = missions
    .filter((mission) => {
      // Use parish/community center if no specific coordinates
      return mission.parish_id || mission.community_id;
    })
    .map((mission) => {
      let coordinates: [number, number] | null = null;

      // Try to get coordinates from parish or community
      if (mission.parish?.coordinates) {
        const coords = mission.parish.coordinates;
        if (coords.lng && coords.lat) {
          coordinates = [coords.lng, coords.lat];
        }
      } else if (mission.community?.coordinates) {
        const coords = mission.community.coordinates;
        if (coords.lng && coords.lat) {
          coordinates = [coords.lng, coords.lat];
        }
      }

      if (!coordinates) {
        return null;
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates,
        },
        properties: {
          id: mission.id,
          name: mission.name,
          type: mission.type,
          status: mission.status,
          startTime: mission.start_time,
          endTime: mission.end_time,
          description: mission.description,
          parishId: mission.parish_id,
          communityId: mission.community_id,
          createdBy: mission.created_by,
          createdAt: mission.created_at,
        },
      };
    })
    .filter((f) => f !== null) as Feature<Point>[];

  return {
    type: 'FeatureCollection',
    features,
  };
}

