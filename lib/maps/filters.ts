/**
 * Filter utilities for map data filtering
 * Supports date range, category, location, and status filtering
 */

import { FeatureCollection, Feature, Point } from 'geojson';

export interface MapFilters {
  dateRange?: {
    start: Date;
    end: Date;
    preset?: '24h' | '7d' | '30d' | 'custom';
  };
  categories?: {
    assets?: string[]; // ['starlink', 'iphone', ...]
    places?: string[]; // ['shelter', 'jdf_base', ...]
    needs?: string[]; // ['Food', 'Water', ...]
    capabilities?: string[]; // ['Food Delivery', ...]
  };
  locations?: {
    parishIds?: string[];
    communityIds?: string[];
  };
  status?: {
    assetStatus?: string[]; // ['available', 'deployed', ...]
    placeStatus?: {
      electricity?: string[];
      water?: string[];
      wifi?: string[];
    };
    urgency?: string[]; // ['critical', 'high', ...]
    availability?: string[]; // ['available', 'on_mission', ...]
  };
}

/**
 * Create a filter preset (last 24h, 7d, 30d)
 */
export function createFilterPreset(
  preset: '24h' | '7d' | '30d'
): MapFilters['dateRange'] {
  const now = new Date();
  const start = new Date(now);

  switch (preset) {
    case '24h':
      start.setHours(start.getHours() - 24);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
  }

  return {
    start,
    end: now,
    preset,
  };
}

/**
 * Combine multiple filters (AND operation)
 */
export function combineFilters(...filters: MapFilters[]): MapFilters {
  const combined: MapFilters = {};

  filters.forEach((filter) => {
    if (filter.dateRange) {
      combined.dateRange = filter.dateRange;
    }

    if (filter.categories) {
      combined.categories = {
        ...combined.categories,
        ...filter.categories,
      };
    }

    if (filter.locations) {
      combined.locations = {
        parishIds: [
          ...(combined.locations?.parishIds || []),
          ...(filter.locations.parishIds || []),
        ],
        communityIds: [
          ...(combined.locations?.communityIds || []),
          ...(filter.locations.communityIds || []),
        ],
      };
    }

    if (filter.status) {
      combined.status = {
        ...combined.status,
        ...filter.status,
        placeStatus: {
          ...combined.status?.placeStatus,
          ...filter.status.placeStatus,
        },
      };
    }
  });

  return combined;
}

/**
 * Apply filters to GeoJSON FeatureCollection
 */
export function filterGeoJSON(
  geoJSON: FeatureCollection<Point>,
  filters: MapFilters
): FeatureCollection<Point> {
  let filteredFeatures = [...geoJSON.features];

  // Filter by date range
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filteredFeatures = filteredFeatures.filter((feature) => {
      const dateFields = [
        'createdAt',
        'created_at',
        'distributionDate',
        'distribution_date',
        'startTime',
        'start_time',
        'timestamp',
      ];

      for (const field of dateFields) {
        const dateValue = feature.properties?.[field];
        if (dateValue) {
          const date = new Date(dateValue);
          return date >= start && date <= end;
        }
      }

      return true; // Include if no date field found
    });
  }

  // Filter by categories
  if (filters.categories) {
    if (filters.categories.assets) {
      filteredFeatures = filteredFeatures.filter((feature) => {
        const assetType = feature.properties?.type || feature.properties?.assetType;
        return assetType && filters.categories!.assets!.includes(assetType);
      });
    }

    if (filters.categories.places) {
      filteredFeatures = filteredFeatures.filter((feature) => {
        const placeType = feature.properties?.type;
        return placeType && filters.categories!.places!.includes(placeType);
      });
    }

    if (filters.categories.needs) {
      filteredFeatures = filteredFeatures.filter((feature) => {
        const needs = feature.properties?.needs;
        if (Array.isArray(needs)) {
          return filters.categories!.needs!.some((need) => needs.includes(need));
        }
        return false;
      });
    }

    if (filters.categories.capabilities) {
      filteredFeatures = filteredFeatures.filter((feature) => {
        const capabilities = feature.properties?.capabilities;
        if (Array.isArray(capabilities)) {
          return filters.categories!.capabilities!.some((cap) =>
            capabilities.includes(cap)
          );
        }
        return false;
      });
    }
  }

  // Filter by locations
  if (filters.locations) {
    if (filters.locations.parishIds && filters.locations.parishIds.length > 0) {
      filteredFeatures = filteredFeatures.filter((feature) => {
        const parishId = feature.properties?.parishId || feature.properties?.parish_id;
        return parishId && filters.locations!.parishIds!.includes(parishId);
      });
    }

    if (
      filters.locations.communityIds &&
      filters.locations.communityIds.length > 0
    ) {
      filteredFeatures = filteredFeatures.filter((feature) => {
        const communityId =
          feature.properties?.communityId || feature.properties?.community_id;
        return (
          communityId && filters.locations!.communityIds!.includes(communityId)
        );
      });
    }
  }

  // Filter by status
  if (filters.status) {
    if (filters.status.assetStatus && filters.status.assetStatus.length > 0) {
      filteredFeatures = filteredFeatures.filter((feature) => {
        const status =
          feature.properties?.status || feature.properties?.assetStatus;
        return status && filters.status!.assetStatus!.includes(status);
      });
    }

    if (filters.status.urgency && filters.status.urgency.length > 0) {
      filteredFeatures = filteredFeatures.filter((feature) => {
        const urgency = feature.properties?.urgency;
        return urgency && filters.status!.urgency!.includes(urgency);
      });
    }

    if (
      filters.status.availability &&
      filters.status.availability.length > 0
    ) {
      filteredFeatures = filteredFeatures.filter((feature) => {
        const availability =
          feature.properties?.availabilityStatus ||
          feature.properties?.availability_status;
        return (
          availability && filters.status!.availability!.includes(availability)
        );
      });
    }

    if (filters.status.placeStatus) {
      const { electricity, water, wifi } = filters.status.placeStatus;

      if (electricity && electricity.length > 0) {
        filteredFeatures = filteredFeatures.filter((feature) => {
          const status = feature.properties?.electricityStatus;
          return status && electricity.includes(status);
        });
      }

      if (water && water.length > 0) {
        filteredFeatures = filteredFeatures.filter((feature) => {
          const status = feature.properties?.waterStatus;
          return status && water.includes(status);
        });
      }

      if (wifi && wifi.length > 0) {
        filteredFeatures = filteredFeatures.filter((feature) => {
          const status = feature.properties?.wifiStatus;
          return status && wifi.includes(status);
        });
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features: filteredFeatures,
  };
}

/**
 * Serialize filters to URL search params
 */
export function serializeFilters(filters: MapFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.dateRange) {
    params.set('dateStart', filters.dateRange.start.toISOString());
    params.set('dateEnd', filters.dateRange.end.toISOString());
    if (filters.dateRange.preset) {
      params.set('datePreset', filters.dateRange.preset);
    }
  }

  if (filters.categories) {
    if (filters.categories.assets) {
      params.set('assetTypes', filters.categories.assets.join(','));
    }
    if (filters.categories.places) {
      params.set('placeTypes', filters.categories.places.join(','));
    }
    if (filters.categories.needs) {
      params.set('needs', filters.categories.needs.join(','));
    }
    if (filters.categories.capabilities) {
      params.set('capabilities', filters.categories.capabilities.join(','));
    }
  }

  if (filters.locations) {
    if (filters.locations.parishIds) {
      params.set('parishIds', filters.locations.parishIds.join(','));
    }
    if (filters.locations.communityIds) {
      params.set('communityIds', filters.locations.communityIds.join(','));
    }
  }

  if (filters.status) {
    if (filters.status.assetStatus) {
      params.set('assetStatus', filters.status.assetStatus.join(','));
    }
    if (filters.status.urgency) {
      params.set('urgency', filters.status.urgency.join(','));
    }
    if (filters.status.availability) {
      params.set('availability', filters.status.availability.join(','));
    }
    if (filters.status.placeStatus) {
      if (filters.status.placeStatus.electricity) {
        params.set(
          'electricityStatus',
          filters.status.placeStatus.electricity.join(',')
        );
      }
      if (filters.status.placeStatus.water) {
        params.set('waterStatus', filters.status.placeStatus.water.join(','));
      }
      if (filters.status.placeStatus.wifi) {
        params.set('wifiStatus', filters.status.placeStatus.wifi.join(','));
      }
    }
  }

  return params;
}

/**
 * Deserialize URL search params to filters
 */
export function deserializeFilters(searchParams: URLSearchParams): MapFilters {
  const filters: MapFilters = {};

  // Date range
  const dateStart = searchParams.get('dateStart');
  const dateEnd = searchParams.get('dateEnd');
  const datePreset = searchParams.get('datePreset') as
    | '24h'
    | '7d'
    | '30d'
    | 'custom'
    | null;

  if (dateStart && dateEnd) {
    filters.dateRange = {
      start: new Date(dateStart),
      end: new Date(dateEnd),
      preset: datePreset || 'custom',
    };
  }

  // Categories
  const assetTypes = searchParams.get('assetTypes');
  const placeTypes = searchParams.get('placeTypes');
  const needs = searchParams.get('needs');
  const capabilities = searchParams.get('capabilities');

  if (assetTypes || placeTypes || needs || capabilities) {
    filters.categories = {};
    if (assetTypes) {
      filters.categories.assets = assetTypes.split(',');
    }
    if (placeTypes) {
      filters.categories.places = placeTypes.split(',');
    }
    if (needs) {
      filters.categories.needs = needs.split(',');
    }
    if (capabilities) {
      filters.categories.capabilities = capabilities.split(',');
    }
  }

  // Locations
  const parishIds = searchParams.get('parishIds');
  const communityIds = searchParams.get('communityIds');

  if (parishIds || communityIds) {
    filters.locations = {};
    if (parishIds) {
      filters.locations.parishIds = parishIds.split(',');
    }
    if (communityIds) {
      filters.locations.communityIds = communityIds.split(',');
    }
  }

  // Status
  const assetStatus = searchParams.get('assetStatus');
  const urgency = searchParams.get('urgency');
  const availability = searchParams.get('availability');
  const electricityStatus = searchParams.get('electricityStatus');
  const waterStatus = searchParams.get('waterStatus');
  const wifiStatus = searchParams.get('wifiStatus');

  if (
    assetStatus ||
    urgency ||
    availability ||
    electricityStatus ||
    waterStatus ||
    wifiStatus
  ) {
    filters.status = {};
    if (assetStatus) {
      filters.status.assetStatus = assetStatus.split(',');
    }
    if (urgency) {
      filters.status.urgency = urgency.split(',');
    }
    if (availability) {
      filters.status.availability = availability.split(',');
    }
    if (electricityStatus || waterStatus || wifiStatus) {
      filters.status.placeStatus = {};
      if (electricityStatus) {
        filters.status.placeStatus.electricity = electricityStatus.split(',');
      }
      if (waterStatus) {
        filters.status.placeStatus.water = waterStatus.split(',');
      }
      if (wifiStatus) {
        filters.status.placeStatus.wifi = wifiStatus.split(',');
      }
    }
  }

  return filters;
}

/**
 * Validate filter values
 */
export function validateFilters(filters: MapFilters): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (filters.dateRange) {
    if (filters.dateRange.start > filters.dateRange.end) {
      errors.push('Start date must be before end date');
    }
    if (filters.dateRange.start > new Date()) {
      errors.push('Start date cannot be in the future');
    }
  }

  if (filters.categories) {
    const validAssetTypes = [
      'starlink',
      'iphone',
      'powerbank',
      'food',
      'water',
      'box_shelter',
      'generator',
      'hygiene_kit',
    ];
    if (filters.categories.assets) {
      const invalid = filters.categories.assets.filter(
        (t) => !validAssetTypes.includes(t)
      );
      if (invalid.length > 0) {
        errors.push(`Invalid asset types: ${invalid.join(', ')}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: MapFilters): number {
  let count = 0;

  if (filters.dateRange) count++;
  if (filters.categories) {
    if (filters.categories.assets?.length) count++;
    if (filters.categories.places?.length) count++;
    if (filters.categories.needs?.length) count++;
    if (filters.categories.capabilities?.length) count++;
  }
  if (filters.locations) {
    if (filters.locations.parishIds?.length) count++;
    if (filters.locations.communityIds?.length) count++;
  }
  if (filters.status) {
    if (filters.status.assetStatus?.length) count++;
    if (filters.status.urgency?.length) count++;
    if (filters.status.availability?.length) count++;
    if (filters.status.placeStatus) {
      if (filters.status.placeStatus.electricity?.length) count++;
      if (filters.status.placeStatus.water?.length) count++;
      if (filters.status.placeStatus.wifi?.length) count++;
    }
  }

  return count;
}



