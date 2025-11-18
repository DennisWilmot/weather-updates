/**
 * MapLayerToggle - Individual layer toggle component
 * Supports both parent and child layers with hierarchical relationships
 */

'use client';

import { Checkbox, Badge, Group, Text, Tooltip } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useState } from 'react';
import { findLayerNode } from '@/lib/maps/layer-hierarchy';
import { isHeatmapLayer } from '@/lib/maps/heatmap-layers';

interface MapLayerToggleProps {
  layerId: string;
  layerName: string;
  visible: boolean;
  onToggle: (layerId: string, visible: boolean) => void;
  count?: number;
  loading?: boolean;
  level?: number; // Indentation level (0 = parent, 1+ = child)
  hasChildren?: boolean;
  expanded?: boolean;
  onExpandToggle?: (layerId: string) => void;
  icon?: string;
  color?: string;
  indeterminate?: boolean; // For parent layers when some children are selected
  disabled?: boolean;
}

export default function MapLayerToggle({
  layerId,
  layerName,
  visible,
  onToggle,
  count,
  loading = false,
  level = 0,
  hasChildren = false,
  expanded = false,
  onExpandToggle,
  icon,
  color,
  indeterminate = false,
  disabled = false,
}: MapLayerToggleProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    if (!disabled) {
      onToggle(layerId, !visible);
    }
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren && onExpandToggle) {
      onExpandToggle(layerId);
    }
  };

  const paddingLeft = level * 20; // 20px per level

  return (
    <Group
      gap="xs"
      style={{
        paddingLeft: `${paddingLeft}px`,
        paddingRight: '8px',
        paddingTop: '4px',
        paddingBottom: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleToggle}
    >
      {/* Expand/Collapse Icon */}
      {hasChildren ? (
        <div
          onClick={handleExpandToggle}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          {expanded ? (
            <IconChevronDown size={16} />
          ) : (
            <IconChevronRight size={16} />
          )}
        </div>
      ) : (
        <div style={{ width: 16 }} /> // Spacer for alignment
      )}

      {/* Checkbox */}
      <Checkbox
        checked={visible}
        indeterminate={indeterminate}
        onChange={handleToggle}
        disabled={disabled}
        size="sm"
        style={{ pointerEvents: 'none' }} // Handle click on parent
      />

      {/* Layer Icon (if provided) */}
      {icon && (
        <div
          style={{
            width: 16,
            height: 16,
            backgroundColor: color || '#666',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      )}

      {/* Layer Name */}
      <Text size="sm" style={{ flex: 1 }}>
        {layerName}
      </Text>

      {/* Heatmap Indicator */}
      {isHeatmapLayer(layerId) && (
        <Badge size="xs" variant="filled" color="red" style={{ fontSize: '10px' }}>
          Heat
        </Badge>
      )}

      {/* Count Badge */}
      {count !== undefined && count > 0 && (
        <Badge size="sm" variant="light" color={color || 'gray'}>
          {count}
        </Badge>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Badge size="sm" variant="dot" color="blue">
          Loading...
        </Badge>
      )}
    </Group>
  );
}

