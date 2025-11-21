/**
 * Utility functions to transform API responses to GeoJSON format
 */

export interface ApiPerson {
  id: string;
  name: string;
  type: string;
  parishId: string;
  communityId: string;
  latitude: string;
  longitude: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  organization?: string;
  parish?: {
    name: string;
    code: string;
  };
  community?: {
    name: string;
  };
}

export interface ApiAsset {
  id: string;
  name: string;
  type: string;
  serialNumber?: string;
  status: string;
  isOneTime: boolean;
  currentLocation?: string;
  parishId: string;
  communityId: string;
  latitude: string;
  longitude: string;
  organization?: string;
}

export interface ApiPlace {
  id: string;
  name: string;
  type: string;
  parishId: string;
  communityId: string;
  latitude: string;
  longitude: string;
  address?: string;
  maxCapacity?: number;
  description?: string;
  verified: boolean;
  parish?: {
    name: string;
    code: string;
  };
  community?: {
    name: string;
  };
}

/**
 * Transform people API response to GeoJSON
 */
export function peopleToGeoJSON(data: {
  people: ApiPerson[];
}): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: data.people.map((person) => ({
      type: "Feature",
      id: person.id,
      geometry: {
        type: "Point",
        coordinates: [
          parseFloat(person.longitude),
          parseFloat(person.latitude),
        ],
      },
      properties: {
        id: person.id,
        name: person.name,
        type: person.type,
        contactName: person.contactName,
        contactPhone: person.contactPhone,
        contactEmail: person.contactEmail,
        organization: person.organization,
        parishName: person.parish?.name,
        parishCode: person.parish?.code,
        communityName: person.community?.name,
        layer: "people",
      },
    })),
  };
}

/**
 * Transform assets API response to GeoJSON
 */
export function assetsToGeoJSON(data: {
  assets: ApiAsset[];
}): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: data.assets.map((asset) => ({
      type: "Feature",
      id: asset.id,
      geometry: {
        type: "Point",
        coordinates: [parseFloat(asset.longitude), parseFloat(asset.latitude)],
      },
      properties: {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        serialNumber: asset.serialNumber,
        status: asset.status,
        isOneTime: asset.isOneTime,
        currentLocation: asset.currentLocation,
        organization: asset.organization,
        layer: "assets",
      },
    })),
  };
}

/**
 * Transform places API response to GeoJSON
 */
export function placesToGeoJSON(data: {
  places: ApiPlace[];
}): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: data.places.map((place) => ({
      type: "Feature",
      id: place.id,
      geometry: {
        type: "Point",
        coordinates: [parseFloat(place.longitude), parseFloat(place.latitude)],
      },
      properties: {
        id: place.id,
        name: place.name,
        type: place.type,
        address: place.address,
        maxCapacity: place.maxCapacity,
        description: place.description,
        verified: place.verified,
        parishName: place.parish?.name,
        parishCode: place.parish?.code,
        communityName: place.community?.name,
        layer: "places",
      },
    })),
  };
}

/**
 * Transform any API response to GeoJSON based on layer type
 */
export function transformToGeoJSON(
  data: any,
  layerType: "people" | "places" | "assets"
): GeoJSON.FeatureCollection {
  switch (layerType) {
    case "people":
      return peopleToGeoJSON(data);
    case "places":
      return placesToGeoJSON(data);
    case "assets":
      return assetsToGeoJSON(data);
    default:
      return {
        type: "FeatureCollection",
        features: [],
      };
  }
}
