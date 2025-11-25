"use client";

import { Modal, Stack, Group, Text, Title, Badge, Divider, Paper, Button, Radio, Checkbox, ActionIcon } from "@mantine/core";
import { IconRoute, IconClock, IconMapPin, IconBox, IconCurrencyDollar, IconCheck, IconRefresh, IconPlus, IconX } from "@tabler/icons-react";
import type { Shipment } from "@/lib/types/planning";

interface RouteMetadata {
  distance: number; // meters
  duration: number; // seconds
  coordinates: number[][]; // [[lng, lat], ...]
}

interface RouteOption {
  index: number;
  coordinates: number[][];
  distance: number;
  duration: number;
  isPrimary: boolean;
}

interface RoutePreferences {
  avoidTolls: boolean;
  avoidHighways: boolean;
  avoidBridges: boolean;
  avoidResidential: boolean;
}

interface Waypoint {
  id: string;
  lng: number;
  lat: number;
  name?: string;
}

interface RouteDetailsModalProps {
  opened: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  routeMetadata: RouteMetadata | null;
  allRoutes?: RouteOption[];
  selectedRouteIndex?: number;
  onRouteSelect?: (index: number) => void;
  routePreferences?: RoutePreferences;
  onPreferencesChange?: (preferences: RoutePreferences) => void;
  onRegenerateRoute?: () => void;
  waypoints?: Waypoint[];
  onWaypointsChange?: (waypoints: Waypoint[]) => void;
  onAddWaypointClick?: () => void;
  isAddingWaypoint?: boolean;
}

export default function RouteDetailsModal({
  opened,
  onClose,
  shipment,
  routeMetadata,
  allRoutes = [],
  selectedRouteIndex = 0,
  onRouteSelect,
  routePreferences = { avoidTolls: false, avoidHighways: false, avoidBridges: false, avoidResidential: false },
  onPreferencesChange,
  onRegenerateRoute,
  waypoints = [],
  onWaypointsChange,
  onAddWaypointClick,
  isAddingWaypoint = false,
}: RouteDetailsModalProps) {
  if (!shipment || !routeMetadata) {
    return null;
  }
  
  const hasAlternatives = allRoutes.length > 1;
  const hasPreferences = onPreferencesChange && onRegenerateRoute;
  const hasWaypoints = onWaypointsChange && onAddWaypointClick;

  // Format distance
  const distanceKm = (routeMetadata.distance / 1000).toFixed(2);
  const distanceMiles = (routeMetadata.distance / 1609.34).toFixed(2);

  // Format duration
  const hours = Math.floor(routeMetadata.duration / 3600);
  const minutes = Math.floor((routeMetadata.duration % 3600) / 60);
  const seconds = routeMetadata.duration % 60;
  const durationFormatted =
    hours > 0
      ? `${hours}h ${minutes}m`
      : minutes > 0
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`;

  // Format cost (handle negative costs)
  const costDisplay = shipment.cost
    ? shipment.cost < 0
      ? `$${Math.abs(shipment.cost).toFixed(2)}`
      : `$${shipment.cost.toFixed(2)}`
    : "N/A";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconRoute size={20} />
          <Title order={4}>Route Details</Title>
        </Group>
      }
      size="md"
      centered
    >
      <Stack gap="md">
        {/* Shipment Information */}
        <Paper p="md" radius="md" style={{ backgroundColor: "#f8f9fa" }}>
          <Group justify="space-between" mb="xs">
            <Text fw={600} size="sm" c="dimmed">
              Shipment Information
            </Text>
          </Group>
          <Stack gap="xs">
            <Group justify="space-between">
              <Group gap="xs">
                <IconBox size={16} />
                <Text size="sm">Item:</Text>
              </Group>
              <Badge color="blue" variant="light">
                {shipment.itemCode}
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm">Quantity:</Text>
              <Text fw={600} size="sm">
                {shipment.quantity} units
              </Text>
            </Group>
            <Group justify="space-between">
              <Group gap="xs">
                <IconCurrencyDollar size={16} />
                <Text size="sm">Cost:</Text>
              </Group>
              <Text fw={600} size="sm">
                {costDisplay}
              </Text>
            </Group>
          </Stack>
        </Paper>

        <Divider />

        {/* Route Selection (if alternatives available) */}
        {hasAlternatives && (
          <>
            <Paper p="md" radius="md" style={{ backgroundColor: "#f8f9fa" }}>
              <Text fw={600} size="sm" c="dimmed" mb="md">
                Available Routes ({allRoutes.length})
              </Text>
              <Radio.Group
                value={selectedRouteIndex.toString()}
                onChange={(value) => {
                  const index = parseInt(value);
                  if (onRouteSelect) {
                    onRouteSelect(index);
                  }
                }}
              >
                <Stack gap="sm">
                  {allRoutes.map((route, idx) => {
                    const routeDistanceKm = (route.distance / 1000).toFixed(2);
                    const routeHours = Math.floor(route.duration / 3600);
                    const routeMinutes = Math.floor((route.duration % 3600) / 60);
                    const routeDurationFormatted =
                      routeHours > 0
                        ? `${routeHours}h ${routeMinutes}m`
                        : `${routeMinutes}m`;
                    
                    const routeColors = ["#2563EB", "#F59E0B", "#10B981", "#8B5CF6"];
                    const routeColor = routeColors[idx % routeColors.length];
                    const isSelected = idx === selectedRouteIndex;
                    
                    return (
                      <Paper
                        key={route.index}
                        p="sm"
                        radius="md"
                        style={{
                          backgroundColor: isSelected ? "#e3f2fd" : "#fff",
                          border: isSelected ? `2px solid ${routeColor}` : "1px solid #e0e0e0",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          if (onRouteSelect) {
                            onRouteSelect(idx);
                          }
                        }}
                      >
                        <Radio
                          value={idx.toString()}
                          label={
                            <Group justify="space-between" style={{ flex: 1 }}>
                              <Group gap="xs">
                                <div
                                  style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    backgroundColor: routeColor,
                                  }}
                                />
                                <Text size="sm" fw={isSelected ? 600 : 400}>
                                  {route.isPrimary ? "Primary Route" : `Alternative ${idx}`}
                                </Text>
                                {isSelected && (
                                  <Badge size="xs" color="blue" variant="light">
                                    Selected
                                  </Badge>
                                )}
                              </Group>
                              <Group gap="md">
                                <Text size="xs" c="dimmed">
                                  {routeDistanceKm} km
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {routeDurationFormatted}
                                </Text>
                              </Group>
                            </Group>
                          }
                        />
                      </Paper>
                    );
                  })}
                </Stack>
              </Radio.Group>
            </Paper>
            <Divider />
          </>
        )}

        {/* Waypoints Management (Phase 5) */}
        {hasWaypoints && (
          <>
            <Divider />
            <Paper p="md" radius="md" style={{ backgroundColor: "#f8f9fa" }}>
              <Group justify="space-between" mb="md">
                <Text fw={600} size="sm" c="dimmed">
                  Waypoints ({waypoints.length})
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconPlus size={14} />}
                  onClick={() => {
                    if (onAddWaypointClick) {
                      onAddWaypointClick();
                    }
                  }}
                  disabled={isAddingWaypoint}
                >
                  {isAddingWaypoint ? "Click Map to Add" : "Add Waypoint"}
                </Button>
              </Group>
              {waypoints.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  No waypoints added. Click "Add Waypoint" then click on the map to add stops along the route.
                </Text>
              ) : (
                <Stack gap="xs">
                  {waypoints.map((waypoint, index) => (
                    <Paper
                      key={waypoint.id}
                      p="sm"
                      radius="md"
                      style={{ backgroundColor: "#fff", border: "1px solid #e0e0e0" }}
                    >
                      <Group justify="space-between">
                        <Group gap="xs">
                          <Badge size="sm" color="purple" variant="light">
                            {index + 1}
                          </Badge>
                          <Text size="sm" fw={500}>
                            {waypoint.name || `Waypoint ${index + 1}`}
                          </Text>
                          <Text size="xs" c="dimmed">
                            ({waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)})
                          </Text>
                        </Group>
                        <ActionIcon
                          color="red"
                          variant="light"
                          size="sm"
                          onClick={() => {
                            if (onWaypointsChange) {
                              onWaypointsChange(waypoints.filter(wp => wp.id !== waypoint.id));
                            }
                          }}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
            <Divider />
          </>
        )}

        {/* Route Statistics */}
        <Paper p="md" radius="md" style={{ backgroundColor: "#f8f9fa" }}>
          <Group justify="space-between" mb="xs">
            <Text fw={600} size="sm" c="dimmed">
              {hasAlternatives ? "Selected Route Statistics" : "Route Statistics"}
            </Text>
            {hasAlternatives && selectedRouteIndex === 0 && (
              <Badge color="blue" variant="light" size="sm">
                Primary
              </Badge>
            )}
          </Group>
          <Stack gap="md">
            {/* Distance */}
            <Group justify="space-between" align="flex-start">
              <Group gap="xs">
                <IconRoute size={18} color="#2563EB" />
                <Text size="sm">Distance:</Text>
              </Group>
              <Stack gap={2} align="flex-end">
                <Text fw={600} size="sm">
                  {distanceKm} km
                </Text>
                <Text size="xs" c="dimmed">
                  {distanceMiles} miles
                </Text>
              </Stack>
            </Group>

            {/* Duration */}
            <Group justify="space-between" align="flex-start">
              <Group gap="xs">
                <IconClock size={18} color="#2563EB" />
                <Text size="sm">Estimated Duration:</Text>
              </Group>
              <Text fw={600} size="sm">
                {durationFormatted}
              </Text>
            </Group>

            {/* Route Points */}
            <Group justify="space-between" align="flex-start">
              <Group gap="xs">
                <IconMapPin size={18} color="#2563EB" />
                <Text size="sm">Route Points:</Text>
              </Group>
              <Text fw={600} size="sm">
                {routeMetadata.coordinates.length} points
              </Text>
            </Group>
          </Stack>
        </Paper>

        {/* Route Preferences (Avoid Options) */}
        {hasPreferences && (
          <>
            <Divider />
            <Paper p="md" radius="md" style={{ backgroundColor: "#f8f9fa" }}>
              <Group justify="space-between" mb="md">
                <Text fw={600} size="sm" c="dimmed">
                  Route Preferences
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconRefresh size={14} />}
                  onClick={() => {
                    if (onRegenerateRoute) {
                      onRegenerateRoute();
                    }
                  }}
                >
                  Regenerate Route
                </Button>
              </Group>
              <Stack gap="sm">
                <Checkbox
                  label="Avoid Tolls"
                  checked={routePreferences.avoidTolls}
                  onChange={(e) => {
                    if (onPreferencesChange) {
                      onPreferencesChange({
                        ...routePreferences,
                        avoidTolls: e.currentTarget.checked,
                      });
                    }
                  }}
                />
                <Checkbox
                  label="Avoid Highways"
                  checked={routePreferences.avoidHighways}
                  onChange={(e) => {
                    if (onPreferencesChange) {
                      onPreferencesChange({
                        ...routePreferences,
                        avoidHighways: e.currentTarget.checked,
                      });
                    }
                  }}
                />
                <Checkbox
                  label="Avoid Bridges"
                  checked={routePreferences.avoidBridges}
                  onChange={(e) => {
                    if (onPreferencesChange) {
                      onPreferencesChange({
                        ...routePreferences,
                        avoidBridges: e.currentTarget.checked,
                      });
                    }
                  }}
                />
                <Checkbox
                  label="Avoid Residential Communities"
                  checked={routePreferences.avoidResidential}
                  onChange={(e) => {
                    if (onPreferencesChange) {
                      onPreferencesChange({
                        ...routePreferences,
                        avoidResidential: e.currentTarget.checked,
                      });
                    }
                  }}
                />
              </Stack>
            </Paper>
          </>
        )}

        {/* Warehouse and Community Info */}
        <Divider />
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              From Warehouse:
            </Text>
            <Text size="sm" fw={500}>
              {shipment.fromWarehouseId.slice(0, 8)}...
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              To Community:
            </Text>
            <Text size="sm" fw={500}>
              {shipment.toCommunityId.slice(0, 8)}...
            </Text>
          </Group>
        </Stack>
      </Stack>
    </Modal>
  );
}

