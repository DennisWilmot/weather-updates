/**
 * StatisticsPanel - Statistics panel for dashboard
 * Shows summary statistics for active layers
 */

'use client';

import { useState, useEffect } from 'react';
import { Paper, Stack, Group, Text, Badge, Progress, Collapse, ActionIcon } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconChartBar } from '@tabler/icons-react';
import { LayerConfig } from '@/lib/maps/layer-types';

interface StatisticsPanelProps {
  activeLayers: LayerConfig[];
  filters?: any;
  className?: string;
}

interface LayerStats {
  layerId: string;
  count: number;
  breakdown?: Record<string, number>;
}

export default function StatisticsPanel({
  activeLayers,
  filters,
  className,
}: StatisticsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [stats, setStats] = useState<Map<string, LayerStats>>(new Map());
  const [loading, setLoading] = useState(false);

  // Fetch statistics for active layers
  useEffect(() => {
    if (activeLayers.length === 0) {
      setStats(new Map());
      return;
    }

    setLoading(true);

    const fetchStats = async () => {
      const newStats = new Map<string, LayerStats>();

      for (const layer of activeLayers) {
        try {
          // Map layer ID to API endpoint
          const apiMap: Record<string, string> = {
            'assets': '/api/assets',
            'places': '/api/places',
            'people': '/api/people',
            'people-needs': '/api/people/needs',
            'aid-workers': '/api/aid-workers/capabilities',
            'asset-distributions': '/api/asset-distributions',
            'place-status': '/api/places/status',
          };

          const endpoint = apiMap[layer.id] || apiMap[layer.id.split('-')[0]];
          if (!endpoint) continue;

          // Build query params from filters
          const params = new URLSearchParams();
          if (filters?.dateRange) {
            params.set('startDate', filters.dateRange.start.toISOString());
            params.set('endDate', filters.dateRange.end.toISOString());
          }
          if (filters?.locations?.parishIds) {
            params.set('parishId', filters.locations.parishIds[0]);
          }
          if (filters?.categories) {
            if (layer.id.includes('assets') && filters.categories.assets) {
              params.set('type', filters.categories.assets.join(','));
            }
            if (layer.id.includes('places') && filters.categories.places) {
              params.set('type', filters.categories.places.join(','));
            }
          }

          const response = await fetch(`${endpoint}?${params.toString()}`);
          const data = await response.json();

          const count = data.count || data.assets?.length || data.places?.length || 
                        data.people?.length || data.needs?.length || 
                        data.workers?.length || data.distributions?.length || 
                        data.statuses?.length || 0;

          newStats.set(layer.id, {
            layerId: layer.id,
            count,
          });
        } catch (error) {
          console.error(`Error fetching stats for ${layer.id}:`, error);
          newStats.set(layer.id, {
            layerId: layer.id,
            count: 0,
          });
        }
      }

      setStats(newStats);
      setLoading(false);
    };

    fetchStats();
  }, [activeLayers, filters]);

  const totalCount = Array.from(stats.values()).reduce((sum, s) => sum + s.count, 0);

  return (
    <Paper p="md" withBorder className={className}>
      <Stack gap="sm">
        {/* Header */}
        <Group
          justify="space-between"
          style={{ cursor: 'pointer' }}
          onClick={() => setExpanded(!expanded)}
        >
          <Group gap="xs">
            <IconChartBar size={20} />
            <Text size="lg" fw={600}>
              Statistics
            </Text>
            {totalCount > 0 && (
              <Badge size="sm" color="blue">
                {totalCount}
              </Badge>
            )}
          </Group>
          {expanded ? (
            <IconChevronUp size={16} />
          ) : (
            <IconChevronDown size={16} />
          )}
        </Group>

        <Collapse in={expanded}>
          <Stack gap="sm" mt="sm">
            {loading ? (
              <Text size="sm" c="dimmed">
                Loading statistics...
              </Text>
            ) : stats.size === 0 ? (
              <Text size="sm" c="dimmed">
                No active layers
              </Text>
            ) : (
              Array.from(stats.entries()).map(([layerId, stat]) => (
                <Group key={layerId} justify="space-between" gap="xs">
                  <Text size="sm" style={{ flex: 1 }}>
                    {layerId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                  <Badge size="sm" variant="light">
                    {stat.count}
                  </Badge>
                </Group>
              ))
            )}

            {totalCount > 0 && (
              <>
                <Progress
                  value={100}
                  size="sm"
                  color="blue"
                  style={{ marginTop: '8px' }}
                />
                <Text size="xs" c="dimmed" ta="center">
                  Total: {totalCount} features
                </Text>
              </>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}

