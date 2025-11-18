/**
 * MapLayerPanel - Hierarchical layer control panel
 * Main component for managing all map layers with hierarchical toggling
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Stack,
  TextInput,
  Group,
  Text,
  Button,
  ScrollArea,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import MapLayerGroup from './MapLayerGroup';
import { layerHierarchy, LayerHierarchyNode } from '@/lib/maps/layer-hierarchy';

interface MapLayerPanelProps {
  visibleLayers: Set<string>;
  layerCounts: Map<string, number>;
  loadingLayers: Set<string>;
  onLayerToggle: (layerId: string, visible: boolean) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  className?: string;
}

export default function MapLayerPanel({
  visibleLayers,
  layerCounts,
  loadingLayers,
  onLayerToggle,
  onExpandAll,
  onCollapseAll,
  className,
}: MapLayerPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(layerHierarchy.map((node) => node.id)) // Expand top-level groups by default
  );

  // Filter hierarchy based on search query
  const filteredHierarchy = useMemo(() => {
    if (!searchQuery.trim()) {
      return layerHierarchy;
    }

    const query = searchQuery.toLowerCase();
    const filtered: LayerHierarchyNode[] = [];

    function matchesQuery(node: LayerHierarchyNode): boolean {
      if (node.name.toLowerCase().includes(query)) {
        return true;
      }
      if (node.children) {
        return node.children.some(matchesQuery);
      }
      return false;
    }

    function filterNode(node: LayerHierarchyNode): LayerHierarchyNode | null {
      if (matchesQuery(node)) {
        const filteredNode: LayerHierarchyNode = {
          ...node,
          children: node.children
            ? node.children.map(filterNode).filter((n): n is LayerHierarchyNode => n !== null)
            : undefined,
        };
        return filteredNode;
      }
      return null;
    }

    layerHierarchy.forEach((node) => {
      const filtered = filterNode(node);
      if (filtered) {
        filteredHierarchy.push(filtered);
      }
    });

    return filtered;
  }, [searchQuery]);

  const handleExpandToggle = (layerId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    const allIds = new Set<string>();
    function collectIds(node: LayerHierarchyNode) {
      if (node.children) {
        allIds.add(node.id);
        node.children.forEach(collectIds);
      }
    }
    layerHierarchy.forEach(collectIds);
    setExpandedGroups(allIds);
    onExpandAll?.();
  };

  const handleCollapseAll = () => {
    setExpandedGroups(new Set());
    onCollapseAll?.();
  };

  // Calculate active layer count
  const activeLayerCount = visibleLayers.size;
  const totalLayerCount = useMemo(() => {
    let count = 0;
    function countNodes(node: LayerHierarchyNode) {
      count++;
      if (node.children) {
        node.children.forEach(countNodes);
      }
    }
    layerHierarchy.forEach(countNodes);
    return count;
  }, []);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {/* Header Controls */}
      <Stack gap="sm" style={{ flexShrink: 0 }}>
        {/* Search */}
        <TextInput
          placeholder="Search layers..."
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchQuery ? (
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={() => setSearchQuery('')}
              >
                <IconX size={16} />
              </ActionIcon>
            ) : null
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />

        {/* Active Count */}
        <Text size="xs" c="dimmed">
          {activeLayerCount} of {totalLayerCount} layers active
        </Text>
      </Stack>

      {/* Layer Groups */}
      <div style={{ flex: 1, minHeight: 0, marginTop: '16px' }}>
        <Stack gap="xs">
          {filteredHierarchy.map((node) => (
            <MapLayerGroup
              key={node.id}
              node={node}
              visibleLayers={visibleLayers}
              layerCounts={layerCounts}
              loadingLayers={loadingLayers}
              onLayerToggle={onLayerToggle}
              onExpandToggle={handleExpandToggle}
              expanded={expandedGroups.has(node.id)}
            />
          ))}
        </Stack>

        {filteredHierarchy.length === 0 && (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No layers found matching "{searchQuery}"
          </Text>
        )}
      </div>
    </div>
  );
}

