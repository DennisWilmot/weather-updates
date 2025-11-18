/**
 * Layer hierarchy configuration for hierarchical toggling
 * Defines parent-child relationships for map layers
 */

import { LayerConfig } from './layer-types';

export interface LayerHierarchyNode {
  id: string;
  name: string;
  parentId?: string;
  category: 'assets' | 'places' | 'people' | 'aid_workers';
  children?: LayerHierarchyNode[];
  metadata?: {
    icon?: string;
    color?: string;
    description?: string;
  };
}

/**
 * Define the layer hierarchy structure
 */
export const layerHierarchy: LayerHierarchyNode[] = [
  {
    id: 'assets',
    name: 'Assets',
    category: 'assets',
    metadata: {
      icon: 'package',
      color: '#3b82f6',
      description: 'Relief assets and distributions',
    },
    children: [
      {
        id: 'assets-starlink',
        name: 'Starlink',
        parentId: 'assets',
        category: 'assets',
        metadata: { icon: 'satellite', color: '#3b82f6' },
      },
      {
        id: 'assets-iphone',
        name: 'iPhone',
        parentId: 'assets',
        category: 'assets',
        metadata: { icon: 'device-mobile', color: '#10b981' },
      },
      {
        id: 'assets-powerbank',
        name: 'Powerbank',
        parentId: 'assets',
        category: 'assets',
        metadata: { icon: 'battery', color: '#f59e0b' },
      },
      {
        id: 'assets-food',
        name: 'Food',
        parentId: 'assets',
        category: 'assets',
        metadata: { icon: 'food', color: '#ef4444' },
      },
      {
        id: 'assets-water',
        name: 'Water',
        parentId: 'assets',
        category: 'assets',
        metadata: { icon: 'droplet', color: '#06b6d4' },
      },
      {
        id: 'assets-box_shelter',
        name: 'Box Shelter',
        parentId: 'assets',
        category: 'assets',
        metadata: { icon: 'home', color: '#8b5cf6' },
      },
      {
        id: 'assets-generator',
        name: 'Generator',
        parentId: 'assets',
        category: 'assets',
        metadata: { icon: 'bolt', color: '#f97316' },
      },
      {
        id: 'assets-hygiene_kit',
        name: 'Hygiene Kit',
        parentId: 'assets',
        category: 'assets',
        metadata: { icon: 'medical-kit', color: '#ec4899' },
      },
      {
        id: 'assets-heatmap',
        name: 'Distribution Heatmap',
        parentId: 'assets',
        category: 'assets',
        metadata: { icon: 'heatmap', color: '#ef4444' },
      },
    ],
  },
  {
    id: 'places',
    name: 'Places',
    category: 'places',
    metadata: {
      icon: 'map-pin',
      color: '#1e50ff',
      description: 'Shelters, bases, and facilities',
    },
    children: [
      {
        id: 'places-shelter',
        name: 'Shelters',
        parentId: 'places',
        category: 'places',
        metadata: { icon: 'home', color: '#1e50ff' },
      },
      {
        id: 'places-jdf_base',
        name: 'JDF Bases',
        parentId: 'places',
        category: 'places',
        metadata: { icon: 'shield', color: '#22c55e' },
      },
      {
        id: 'places-hospital',
        name: 'Hospitals',
        parentId: 'places',
        category: 'places',
        metadata: { icon: 'medical-cross', color: '#ef4444' },
      },
      {
        id: 'places-school',
        name: 'Schools',
        parentId: 'places',
        category: 'places',
        metadata: { icon: 'school', color: '#8b5cf6' },
      },
      {
        id: 'places-community_center',
        name: 'Community Centers',
        parentId: 'places',
        category: 'places',
        metadata: { icon: 'users', color: '#06b6d4' },
      },
      {
        id: 'places-status-heatmap',
        name: 'Status Heatmap',
        parentId: 'places',
        category: 'places',
        metadata: { icon: 'heatmap', color: '#f59e0b' },
      },
    ],
  },
  {
    id: 'people',
    name: 'People',
    category: 'people',
    metadata: {
      icon: 'users',
      color: '#f59e0b',
      description: 'People in need and aid workers',
    },
    children: [
      {
        id: 'people-in_need',
        name: 'People in Need',
        parentId: 'people',
        category: 'people',
        metadata: { icon: 'alert-circle', color: '#f59e0b' },
        children: [
          {
            id: 'people-needs-food',
            name: 'Food',
            parentId: 'people-in_need',
            category: 'people',
            metadata: { icon: 'food', color: '#ef4444' },
          },
          {
            id: 'people-needs-water',
            name: 'Water',
            parentId: 'people-in_need',
            category: 'people',
            metadata: { icon: 'droplet', color: '#06b6d4' },
          },
          {
            id: 'people-needs-shelter',
            name: 'Shelter',
            parentId: 'people-in_need',
            category: 'people',
            metadata: { icon: 'home', color: '#8b5cf6' },
          },
          {
            id: 'people-needs-electricity',
            name: 'Electricity',
            parentId: 'people-in_need',
            category: 'people',
            metadata: { icon: 'bolt', color: '#f59e0b' },
          },
          {
            id: 'people-needs-hygiene',
            name: 'Hygiene Kits',
            parentId: 'people-in_need',
            category: 'people',
            metadata: { icon: 'medical-kit', color: '#ec4899' },
          },
          {
            id: 'people-needs-internet',
            name: 'Internet',
            parentId: 'people-in_need',
            category: 'people',
            metadata: { icon: 'wifi', color: '#3b82f6' },
          },
          {
            id: 'people-needs-phone',
            name: 'Cell Phone Connectivity',
            parentId: 'people-in_need',
            category: 'people',
            metadata: { icon: 'phone', color: '#10b981' },
          },
        ],
      },
      {
        id: 'people-aid_worker',
        name: 'Aid Workers',
        parentId: 'people',
        category: 'people',
        metadata: { icon: 'user-check', color: '#9333ea' },
        children: [
          {
            id: 'people-aid_worker-available',
            name: 'Available',
            parentId: 'people-aid_worker',
            category: 'people',
            metadata: { icon: 'check-circle', color: '#22c55e' },
          },
          {
            id: 'people-aid_worker-on_mission',
            name: 'On Mission',
            parentId: 'people-aid_worker',
            category: 'people',
            metadata: { icon: 'activity', color: '#f59e0b' },
          },
        ],
      },
      {
        id: 'people-needs-heatmap',
        name: 'Needs Heatmap',
        parentId: 'people',
        category: 'people',
        metadata: { icon: 'heatmap', color: '#f59e0b' },
      },
    ],
  },
  {
    id: 'aid_workers',
    name: 'Aid Workers',
    category: 'aid_workers',
    metadata: {
      icon: 'user-check',
      color: '#9333ea',
      description: 'Mission schedules and deployments',
    },
    children: [
      {
        id: 'aid_workers-rapid_deployment',
        name: 'Rapid Deployment',
        parentId: 'aid_workers',
        category: 'aid_workers',
        metadata: { icon: 'zap', color: '#ef4444' },
      },
      {
        id: 'aid_workers-planned_mission',
        name: 'Planned Missions',
        parentId: 'aid_workers',
        category: 'aid_workers',
        metadata: { icon: 'calendar', color: '#3b82f6' },
      },
      {
        id: 'aid_workers-standby',
        name: 'Standby',
        parentId: 'aid_workers',
        category: 'aid_workers',
        metadata: { icon: 'clock', color: '#6b7280' },
      },
    ],
  },
];

/**
 * Flatten hierarchy to get all layer IDs
 */
export function getAllLayerIds(hierarchy: LayerHierarchyNode[]): string[] {
  const ids: string[] = [];
  
  function traverse(node: LayerHierarchyNode) {
    ids.push(node.id);
    if (node.children) {
      node.children.forEach(traverse);
    }
  }
  
  hierarchy.forEach(traverse);
  return ids;
}

/**
 * Get all child layer IDs for a parent
 */
export function getChildLayerIds(
  parentId: string,
  hierarchy: LayerHierarchyNode[] = layerHierarchy
): string[] {
  const children: string[] = [];
  
  function findParent(node: LayerHierarchyNode): LayerHierarchyNode | null {
    if (node.id === parentId) {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = findParent(child);
        if (found) return found;
      }
    }
    return null;
  }
  
  function collectChildren(node: LayerHierarchyNode) {
    if (node.id !== parentId) {
      children.push(node.id);
    }
    if (node.children) {
      node.children.forEach(collectChildren);
    }
  }
  
  for (const node of hierarchy) {
    const parent = findParent(node);
    if (parent) {
      collectChildren(parent);
      break;
    }
  }
  
  return children;
}

/**
 * Get parent layer ID for a child
 */
export function getParentLayerId(
  layerId: string,
  hierarchy: LayerHierarchyNode[] = layerHierarchy
): string | null {
  function findParent(
    node: LayerHierarchyNode,
    parentId: string | null = null
  ): string | null {
    if (node.id === layerId) {
      return parentId || null;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = findParent(child, node.id);
        if (found !== null) return found;
      }
    }
    return null;
  }
  
  for (const node of hierarchy) {
    const parent = findParent(node);
    if (parent !== null) return parent;
  }
  
  return null;
}

/**
 * Find layer node by ID
 */
export function findLayerNode(
  layerId: string,
  hierarchy: LayerHierarchyNode[] = layerHierarchy
): LayerHierarchyNode | null {
  function search(node: LayerHierarchyNode): LayerHierarchyNode | null {
    if (node.id === layerId) {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
    }
    return null;
  }
  
  for (const node of hierarchy) {
    const found = search(node);
    if (found) return found;
  }
  
  return null;
}

