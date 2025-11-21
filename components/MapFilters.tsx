/**
 * MapFilters - Filter panel component for map data filtering
 * Supports date range, category, location, and status filtering
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  Button,
  Badge,
  MultiSelect,
  Select,
  Collapse,
  ActionIcon,
  Chip,
  ScrollArea,
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconFilter,
} from '@tabler/icons-react';
// Using native HTML date inputs for date picking
import { MapFilters as MapFiltersType, createFilterPreset, countActiveFilters } from '@/lib/maps/filters';
import { ASSET_TYPES } from '@/lib/schemas/assets-schema';
import { PLACE_TYPES } from '@/lib/schemas/places-schema';
import { NEEDS_OPTIONS, URGENCY_LEVELS } from '@/lib/schemas/people-needs-schema';

interface MapFiltersProps {
  filters: MapFiltersType;
  onFiltersChange: (filters: MapFiltersType) => void;
  onApply?: () => void;
  onReset?: () => void;
  className?: string;
  hideHeader?: boolean;
}

const ASSET_STATUS_OPTIONS = ['available', 'deployed', 'maintenance', 'retired'];
const AVAILABILITY_OPTIONS = ['available', 'on_mission', 'unavailable'];
const OPERATIONAL_STATUS_OPTIONS = ['operational', 'outage', 'partial', 'unknown'];

export default function MapFilters({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  className,
  hideHeader = false,
}: MapFiltersProps) {
  const [dateRangeExpanded, setDateRangeExpanded] = useState(true);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [locationsExpanded, setLocationsExpanded] = useState(false);
  const [statusExpanded, setStatusExpanded] = useState(false);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  // Load parishes and communities for location filter
  const [parishes, setParishes] = useState<Array<{ value: string; label: string }>>([]);
  const [communities, setCommunities] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    // Load parishes
    fetch('/api/parishes')
      .then((res) => res.json())
      .then((data) => {
        if (data.parishes) {
          setParishes(
            data.parishes.map((p: any) => ({
              value: p.id,
              label: p.name,
            }))
          );
        }
      })
      .catch(console.error);
  }, []);

  // Load communities when parishes are selected
  useEffect(() => {
    if (filters.locations?.parishIds && filters.locations.parishIds.length > 0) {
      Promise.all(
        filters.locations.parishIds.map((parishId) =>
          fetch(`/api/parishes/${parishId}/communities`).then((res) => res.json())
        )
      )
        .then((results) => {
          const allCommunities: Array<{ value: string; label: string }> = [];
          results.forEach((data) => {
            if (data.communities) {
              data.communities.forEach((c: any) => {
                allCommunities.push({
                  value: c.id,
                  label: c.name,
                });
              });
            }
          });
          setCommunities(allCommunities);
        })
        .catch(console.error);
    } else {
      setCommunities([]);
    }
  }, [filters.locations?.parishIds]);

  const handleDatePreset = (preset: '24h' | '7d' | '30d') => {
    const dateRange = createFilterPreset(preset);
    onFiltersChange({
      ...filters,
      dateRange,
    });
  };

  const handleCustomDateRange = (start: Date | null, end: Date | null) => {
    if (start && end) {
      onFiltersChange({
        ...filters,
        dateRange: {
          start,
          end,
          preset: 'custom',
        },
      });
    }
  };

  const handleCategoryChange = (
    category: 'assets' | 'places' | 'needs' | 'capabilities',
    values: string[]
  ) => {
    onFiltersChange({
      ...filters,
      categories: {
        ...filters.categories,
        [category]: values.length > 0 ? values : undefined,
      },
    });
  };

  const handleLocationChange = (
    type: 'parishIds' | 'communityIds',
    values: string[]
  ) => {
    onFiltersChange({
      ...filters,
      locations: {
        ...filters.locations,
        [type]: values.length > 0 ? values : undefined,
      },
    });
  };

  const handleStatusChange = (
    type: 'assetStatus' | 'urgency' | 'availability',
    values: string[]
  ) => {
    onFiltersChange({
      ...filters,
      status: {
        ...filters.status,
        [type]: values.length > 0 ? values : undefined,
      },
    });
  };

  const handlePlaceStatusChange = (
    type: 'electricity' | 'water' | 'wifi',
    values: string[]
  ) => {
    onFiltersChange({
      ...filters,
      status: {
        ...filters.status,
        placeStatus: {
          ...filters.status?.placeStatus,
          [type]: values.length > 0 ? values : undefined,
        },
      },
    });
  };

  const handleReset = () => {
    onFiltersChange({});
    onReset?.();
  };

  const handleApply = () => {
    onApply?.();
  };

  return (
    <div className={className} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {!hideHeader && (
        <Stack gap="sm" style={{ flexShrink: 0 }}>
          {/* Header */}
          <Group justify="space-between">
            <Group gap="xs">
              <IconFilter size={20} />
              <Text size="lg" fw={600}>
                Filters
              </Text>
              {activeFilterCount > 0 && (
                <Badge size="sm" color="blue">
                  {activeFilterCount}
                </Badge>
              )}
            </Group>
            {activeFilterCount > 0 && (
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={handleReset}
              >
                <IconX size={16} />
              </ActionIcon>
            )}
          </Group>
        </Stack>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <Stack gap="sm" style={{ paddingTop: '8px' }}>
          <Stack gap="md">
            {/* Date Range */}
            <Paper p="sm" withBorder>
              <Group
                justify="space-between"
                style={{ cursor: 'pointer' }}
                onClick={() => setDateRangeExpanded(!dateRangeExpanded)}
              >
                <Text size="sm" fw={500}>
                  Date Range
                </Text>
                {dateRangeExpanded ? (
                  <IconChevronUp size={16} />
                ) : (
                  <IconChevronDown size={16} />
                )}
              </Group>
              <Collapse in={dateRangeExpanded}>
                <Stack gap="sm" mt="sm">
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant={
                        filters.dateRange?.preset === '24h'
                          ? 'filled'
                          : 'outline'
                      }
                      onClick={() => handleDatePreset('24h')}
                    >
                      Last 24h
                    </Button>
                    <Button
                      size="xs"
                      variant={
                        filters.dateRange?.preset === '7d'
                          ? 'filled'
                          : 'outline'
                      }
                      onClick={() => handleDatePreset('7d')}
                    >
                      Last 7d
                    </Button>
                    <Button
                      size="xs"
                      variant={
                        filters.dateRange?.preset === '30d'
                          ? 'filled'
                          : 'outline'
                      }
                      onClick={() => handleDatePreset('30d')}
                    >
                      Last 30d
                    </Button>
                  </Group>
                  <Stack gap="xs">
                    <div>
                      <Text size="xs" mb={4}>
                        Start Date
                      </Text>
                      <input
                        type="datetime-local"
                        value={
                          filters.dateRange?.start
                            ? new Date(filters.dateRange.start)
                              .toISOString()
                              .slice(0, 16)
                            : ''
                        }
                        onChange={(e) => {
                          const date = e.target.value
                            ? new Date(e.target.value)
                            : null;
                          handleCustomDateRange(
                            date,
                            filters.dateRange?.end || null
                          );
                        }}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                    <div>
                      <Text size="xs" mb={4}>
                        End Date
                      </Text>
                      <input
                        type="datetime-local"
                        value={
                          filters.dateRange?.end
                            ? new Date(filters.dateRange.end)
                              .toISOString()
                              .slice(0, 16)
                            : ''
                        }
                        onChange={(e) => {
                          const date = e.target.value
                            ? new Date(e.target.value)
                            : null;
                          handleCustomDateRange(
                            filters.dateRange?.start || null,
                            date
                          );
                        }}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </Stack>
                </Stack>
              </Collapse>
            </Paper>

            {/* Categories */}
            {/* <Paper p="sm" withBorder>
              <Group
                justify="space-between"
                style={{ cursor: 'pointer' }}
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              >
                <Text size="sm" fw={500}>
                  Categories
                </Text>
                {categoriesExpanded ? (
                  <IconChevronUp size={16} />
                ) : (
                  <IconChevronDown size={16} />
                )}
              </Group>
              <Collapse in={categoriesExpanded}>
                <Stack gap="sm" mt="sm">
                  <MultiSelect
                    label="Asset Types"
                    placeholder="Select asset types"
                    data={ASSET_TYPES.map((t) => ({
                      value: t,
                      label: t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' '),
                    }))}
                    value={filters.categories?.assets || []}
                    onChange={(values) =>
                      handleCategoryChange('assets', values)
                    }
                    size="xs"
                  />
                  <MultiSelect
                    label="Place Types"
                    placeholder="Select place types"
                    data={PLACE_TYPES.map((t) => ({
                      value: t,
                      label: t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' '),
                    }))}
                    value={filters.categories?.places || []}
                    onChange={(values) =>
                      handleCategoryChange('places', values)
                    }
                    size="xs"
                  />
                  <MultiSelect
                    label="Needs"
                    placeholder="Select needs"
                    data={NEEDS_OPTIONS.map((n) => ({
                      value: n,
                      label: n,
                    }))}
                    value={filters.categories?.needs || []}
                    onChange={(values) => handleCategoryChange('needs', values)}
                    size="xs"
                  />
                  <MultiSelect
                    label="Capabilities"
                    placeholder="Select capabilities"
                    data={NEEDS_OPTIONS.map((n) => ({
                      value: n,
                      label: n,
                    }))}
                    value={filters.categories?.capabilities || []}
                    onChange={(values) =>
                      handleCategoryChange('capabilities', values)
                    }
                    size="xs"
                  />
                </Stack>
              </Collapse>
            </Paper> */}

            {/* Locations */}
            {/* <Paper p="sm" withBorder>
              <Group
                justify="space-between"
                style={{ cursor: 'pointer' }}
                onClick={() => setLocationsExpanded(!locationsExpanded)}
              >
                <Text size="sm" fw={500}>
                  Locations
                </Text>
                {locationsExpanded ? (
                  <IconChevronUp size={16} />
                ) : (
                  <IconChevronDown size={16} />
                )}
              </Group>
              <Collapse in={locationsExpanded}>
                <Stack gap="sm" mt="sm">
                  <MultiSelect
                    label="Parishes"
                    placeholder="Select parishes"
                    data={parishes}
                    value={filters.locations?.parishIds || []}
                    onChange={(values) =>
                      handleLocationChange('parishIds', values)
                    }
                    size="xs"
                    searchable
                  />
                  <MultiSelect
                    label="Communities"
                    placeholder="Select communities"
                    data={communities}
                    value={filters.locations?.communityIds || []}
                    onChange={(values) =>
                      handleLocationChange('communityIds', values)
                    }
                    size="xs"
                    searchable
                    disabled={!filters.locations?.parishIds?.length}
                  />
                </Stack>
              </Collapse>
            </Paper> */}

            {/* Status */}
            <Paper p="sm" withBorder>
              <Group
                justify="space-between"
                style={{ cursor: 'pointer' }}
                onClick={() => setStatusExpanded(!statusExpanded)}
              >
                <Text size="sm" fw={500}>
                  Status
                </Text>
                {statusExpanded ? (
                  <IconChevronUp size={16} />
                ) : (
                  <IconChevronDown size={16} />
                )}
              </Group>
              <Collapse in={statusExpanded}>
                <Stack gap="sm" mt="sm">
                  <MultiSelect
                    label="Asset Status"
                    placeholder="Select status"
                    data={ASSET_STATUS_OPTIONS.map((s) => ({
                      value: s,
                      label: s.charAt(0).toUpperCase() + s.slice(1),
                    }))}
                    value={filters.status?.assetStatus || []}
                    onChange={(values) =>
                      handleStatusChange('assetStatus', values)
                    }
                    size="xs"
                  />
                  <MultiSelect
                    label="Urgency"
                    placeholder="Select urgency levels"
                    data={URGENCY_LEVELS.map((u) => ({
                      value: u,
                      label: u.charAt(0).toUpperCase() + u.slice(1),
                    }))}
                    value={filters.status?.urgency || []}
                    onChange={(values) => handleStatusChange('urgency', values)}
                    size="xs"
                  />
                  <MultiSelect
                    label="Availability"
                    placeholder="Select availability"
                    data={AVAILABILITY_OPTIONS.map((a) => ({
                      value: a,
                      label: a.charAt(0).toUpperCase() + a.slice(1).replace('_', ' '),
                    }))}
                    value={filters.status?.availability || []}
                    onChange={(values) =>
                      handleStatusChange('availability', values)
                    }
                    size="xs"
                  />
                  <Text size="xs" fw={500} mt="xs">
                    Place Status
                  </Text>
                  <MultiSelect
                    label="Electricity"
                    placeholder="Select status"
                    data={OPERATIONAL_STATUS_OPTIONS.map((s) => ({
                      value: s,
                      label: s.charAt(0).toUpperCase() + s.slice(1),
                    }))}
                    value={filters.status?.placeStatus?.electricity || []}
                    onChange={(values) =>
                      handlePlaceStatusChange('electricity', values)
                    }
                    size="xs"
                  />
                  <MultiSelect
                    label="Water"
                    placeholder="Select status"
                    data={OPERATIONAL_STATUS_OPTIONS.map((s) => ({
                      value: s,
                      label: s.charAt(0).toUpperCase() + s.slice(1),
                    }))}
                    value={filters.status?.placeStatus?.water || []}
                    onChange={(values) =>
                      handlePlaceStatusChange('water', values)
                    }
                    size="xs"
                  />
                  <MultiSelect
                    label="WiFi"
                    placeholder="Select status"
                    data={OPERATIONAL_STATUS_OPTIONS.map((s) => ({
                      value: s,
                      label: s.charAt(0).toUpperCase() + s.slice(1),
                    }))}
                    value={filters.status?.placeStatus?.wifi || []}
                    onChange={(values) =>
                      handlePlaceStatusChange('wifi', values)
                    }
                    size="xs"
                  />
                </Stack>
              </Collapse>
            </Paper>
          </Stack>
        </Stack>
      </div>

      <Stack gap="xs" style={{ flexShrink: 0, marginTop: '8px' }}>
        {/* Actions */}
        <Group gap="xs" mt="md">
          <Button
            size="xs"
            variant="filled"
            onClick={handleApply}
            style={{ flex: 1 }}
          >
            Apply Filters
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={handleReset}
            disabled={activeFilterCount === 0}
          >
            Reset
          </Button>
        </Group>
      </Stack>
    </div>
  );
}

