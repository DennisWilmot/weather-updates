/**
 * MapLayerGroup - Hierarchical group component for layer categories
 * Handles parent-child relationships and expand/collapse functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { Stack, Group, Text, Badge, Button, Collapse } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import MapLayerToggle from './MapLayerToggle';
import { LayerHierarchyNode, findLayerNode, getChildLayerIds } from '@/lib/maps/layer-hierarchy';

interface MapLayerGroupProps {
  node: LayerHierarchyNode;
  visibleLayers: Set<string>;
  layerCounts: Map<string, number>;
  loadingLayers: Set<string>;
  onLayerToggle: (layerId: string, visible: boolean) => void;
  onExpandToggle?: (layerId: string) => void;
  expanded?: boolean;
  level?: number;
}

export default function MapLayerGroup({
  node,
  visibleLayers,
  layerCounts,
  loadingLayers,
  onLayerToggle,
  onExpandToggle,
  expanded: controlledExpanded,
  level = 0,
}: MapLayerGroupProps) {
  const [internalExpanded, setInternalExpanded] = useState(level === 0); // Top level expanded by default
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const hasChildren = node.children && node.children.length > 0;
  const isVisible = visibleLayers.has(node.id);
  const count = layerCounts.get(node.id) || 0;
  const isLoading = loadingLayers.has(node.id);

  // Calculate child visibility states
  const childIds = hasChildren ? getChildLayerIds(node.id) : [];
  const visibleChildren = childIds.filter((id) => visibleLayers.has(id));
  const allChildrenVisible = hasChildren && childIds.length > 0 && visibleChildren.length === childIds.length;
  const someChildrenVisible = hasChildren && childIds.length > 0 && visibleChildren.length > 0 && !allChildrenVisible;
  const indeterminate = someChildrenVisible;

  const handleToggle = () => {
    onLayerToggle(node.id, !isVisible);
  };

  const handleExpandToggle = () => {
    if (onExpandToggle) {
      onExpandToggle(node.id);
    } else {
      setInternalExpanded(!expanded);
    }
  };

  const handleSelectAll = () => {
    if (hasChildren && node.children) {
      node.children.forEach((child) => {
        if (!visibleLayers.has(child.id)) {
          onLayerToggle(child.id, true);
        }
      });
    }
  };

  const handleDeselectAll = () => {
    if (hasChildren && node.children) {
      node.children.forEach((child) => {
        if (visibleLayers.has(child.id)) {
          onLayerToggle(child.id, false);
        }
      });
    }
    // Also hide parent
    if (isVisible) {
      onLayerToggle(node.id, false);
    }
  };

  return (
    <Stack gap={0}>
      {/* Group Header */}
      <Group
        gap="xs"
        style={{
          padding: '8px',
          backgroundColor: level === 0 ? 'var(--mantine-color-gray-0)' : 'transparent',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        onClick={handleToggle}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleExpandToggle();
            }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {expanded ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )}
          </div>
        ) : (
          <div style={{ width: 16 }} />
        )}

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isVisible || allChildrenVisible}
          onChange={handleToggle}
          ref={(input) => {
            if (input) {
              input.indeterminate = indeterminate ?? false;
            }
          }}
          style={{ cursor: 'pointer' }}
        />

        {/* Group Icon */}
        {node.metadata?.icon && (
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: node.metadata.color || '#666',
              borderRadius: '2px',
            }}
          />
        )}

        {/* Group Name */}
        <Text size="sm" fw={level === 0 ? 600 : 500} style={{ flex: 1 }}>
          {node.name}
        </Text>

        {/* Count Badge */}
        {count > 0 && (
          <Badge size="sm" variant="light" color={node.metadata?.color || 'gray'}>
            {hasChildren && visibleChildren.length > 0
              ? `${visibleChildren.length}/${childIds.length}`
              : count}
          </Badge>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <Badge size="sm" variant="dot" color="blue">
            Loading...
          </Badge>
        )}
      </Group>

      {/* Children */}
      {hasChildren && node.children && (
        <Collapse in={expanded}>
          <Stack gap={0} style={{ paddingLeft: '16px' }}>
            {/* Select All / Deselect All buttons for top-level groups */}
            {level === 0 && (
              <Group gap="xs" style={{ padding: '4px 8px' }}>
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAll();
                  }}
                >
                  Select All
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeselectAll();
                  }}
                >
                  Deselect All
                </Button>
              </Group>
            )}

            {/* Render children */}
            {node.children.map((child) => {
              if (child.children && child.children.length > 0) {
                // Recursive group
                return (
                  <MapLayerGroup
                    key={child.id}
                    node={child}
                    visibleLayers={visibleLayers}
                    layerCounts={layerCounts}
                    loadingLayers={loadingLayers}
                    onLayerToggle={onLayerToggle}
                    onExpandToggle={onExpandToggle}
                    level={level + 1}
                  />
                );
              } else {
                // Leaf node - use toggle component
                return (
                  <MapLayerToggle
                    key={child.id}
                    layerId={child.id}
                    layerName={child.name}
                    visible={visibleLayers.has(child.id)}
                    onToggle={onLayerToggle}
                    count={layerCounts.get(child.id)}
                    loading={loadingLayers.has(child.id)}
                    level={level + 1}
                    icon={child.metadata?.icon}
                    color={child.metadata?.color}
                    disabled={!isVisible && level > 0} // Disable children if parent is off
                  />
                );
              }
            })}
          </Stack>
        </Collapse>
      )}
    </Stack>
  );
}

