/**
 * MapLegend - Dynamic legend component
 * Generates legend from active layers
 */

'use client';

import { Paper, Stack, Group, Text, Badge } from '@mantine/core';
import { findLayerNode } from '@/lib/maps/layer-hierarchy';
import { LayerConfig } from '@/lib/maps/layer-types';

interface MapLegendProps {
  activeLayers: LayerConfig[];
  className?: string;
}

export default function MapLegend({ activeLayers, className }: MapLegendProps) {
  if (activeLayers.length === 0) {
    return null;
  }

  // Group layers by category
  const layersByCategory = activeLayers.reduce((acc, layer) => {
    const node = findLayerNode(layer.id);
    const category = node?.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(layer);
    return acc;
  }, {} as Record<string, LayerConfig[]>);

  return (
    <Paper p="md" withBorder className={className}>
      <Stack gap="sm">
        <Text size="sm" fw={600}>
          Legend
        </Text>

        {Object.entries(layersByCategory).map(([category, layers]) => (
          <Stack key={category} gap="xs">
            <Text size="xs" fw={500} c="dimmed" tt="uppercase">
              {category.replace('_', ' ')}
            </Text>

            {layers.map((layer) => {
              const node = findLayerNode(layer.id);
              const color = node?.metadata?.color || layer.metadata?.color || '#666';
              const icon = node?.metadata?.icon || layer.metadata?.icon;

              // Determine symbol based on layer type
              let symbol: React.ReactNode;
              if (layer.type === 'heatmap') {
                // Heatmap gradient - use color stops from layer config if available
                const colorStops = layer.style.paint?.['heatmap-color'];
                let gradient = 'linear-gradient(to right, rgba(33,102,172,0), rgb(103,169,207), rgb(209,229,240), rgb(253,219,199), rgb(239,138,98), rgb(178,24,43))';
                
                // Extract colors from MapLibre color expression if it's an interpolate expression
                if (Array.isArray(colorStops) && colorStops[0] === 'interpolate') {
                  const colors: string[] = [];
                  for (let i = 3; i < colorStops.length; i += 2) {
                    if (typeof colorStops[i] === 'string') {
                      colors.push(colorStops[i]);
                    }
                  }
                  if (colors.length > 0) {
                    gradient = `linear-gradient(to right, ${colors.join(', ')})`;
                  }
                }
                
                symbol = (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      background: gradient,
                      borderRadius: '4px',
                    }}
                  />
                );
              } else if (layer.type === 'circle') {
                // Circle symbol
                const radius = (layer.style.paint?.['circle-radius'] as number) || 8;
                symbol = (
                  <div
                    style={{
                      width: radius * 2,
                      height: radius * 2,
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                );
              } else if (layer.type === 'symbol') {
                // Icon symbol
                symbol = (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      backgroundColor: color,
                      borderRadius: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                );
              } else {
                // Default square
                symbol = (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: color,
                      borderRadius: '2px',
                    }}
                  />
                );
              }

              return (
                <Group key={layer.id} gap="xs">
                  {symbol}
                  <Text size="sm" style={{ flex: 1 }}>
                    {layer.name}
                  </Text>
                </Group>
              );
            })}
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

