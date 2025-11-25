"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  Loader,
  Button,
  ActionIcon,
  Title,
  Alert,
  Progress,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconArrowRight,
  IconBox,
  IconMapPin,
  IconAlertCircle,
  IconRefresh,
  IconCheck,
} from "@tabler/icons-react";
import type { GlobalPlanningResult, Shipment } from "@/lib/types/planning";
import type { MapFilters as MapFiltersType } from "@/lib/maps/filters";
import RouteMetrics from "./RouteMetrics";

interface AIMatchingPanelProps {
  onMatchClick?: (shipment: Shipment) => void;
  filters?: MapFiltersType;
  visibleLayers?: Set<string>;
  subTypeFilters?: Record<string, Set<string>>;
  routeMetadata?: { distance: number; duration: number; coordinates: number[][] } | null;
}

export default function AIMatchingPanel({ 
  onMatchClick, 
  filters, 
  visibleLayers, 
  subTypeFilters,
  routeMetadata
}: AIMatchingPanelProps) {
  const [page, setPage] = useState(0);
  const [warehouseMap, setWarehouseMap] = useState<Map<string, { lat: number; lng: number; name?: string }>>(new Map());
  const [communityMap, setCommunityMap] = useState<Map<string, { lat: number; lng: number; name?: string }>>(new Map());
  const [warehouseNames, setWarehouseNames] = useState<Map<string, string>>(new Map());
  const [communityNames, setCommunityNames] = useState<Map<string, string>>(new Map());

  const pageSize = 5;

  // Create query key based on filters for proper caching
  const queryKey = useMemo(() => {
    const keyParts: any[] = ['allocation-plan'];
    
    // Add filter parts to key
    if (filters?.locations?.parishIds) {
      keyParts.push(['parishIds', filters.locations.parishIds.sort().join(',')]);
    }
    if (filters?.locations?.communityIds) {
      keyParts.push(['communityIds', filters.locations.communityIds.sort().join(',')]);
    }
    if (filters?.dateRange) {
      keyParts.push(['startDate', filters.dateRange.start.toISOString()]);
      keyParts.push(['endDate', filters.dateRange.end.toISOString()]);
    }
    if (visibleLayers && visibleLayers.size > 0) {
      keyParts.push(['layers', Array.from(visibleLayers).sort().join(',')]);
    }
    if (subTypeFilters) {
      const subTypeFiltersSerializable: Record<string, string[]> = {};
      Object.keys(subTypeFilters).forEach(key => {
        if (subTypeFilters[key] && subTypeFilters[key].size > 0) {
          subTypeFiltersSerializable[key] = Array.from(subTypeFilters[key]).sort();
        }
      });
      if (Object.keys(subTypeFiltersSerializable).length > 0) {
        keyParts.push(['subTypeFilters', JSON.stringify(subTypeFiltersSerializable)]);
      }
    }
    
    return keyParts;
  }, [filters, visibleLayers, subTypeFilters]);

  // Query function to fetch allocation plan
  const fetchAllocationPlan = async (): Promise<{
    result: GlobalPlanningResult;
    problem: any;
  }> => {
    // Step 1: Build query params from filters
    const params = new URLSearchParams();
    
    // Location filters
    if (filters?.locations?.parishIds && filters.locations.parishIds.length > 0) {
      params.set('parishIds', filters.locations.parishIds.join(','));
    }
    if (filters?.locations?.communityIds && filters.locations.communityIds.length > 0) {
      params.set('communityIds', filters.locations.communityIds.join(','));
    }
    
    // Date filters
    if (filters?.dateRange) {
      params.set('startDate', filters.dateRange.start.toISOString());
      params.set('endDate', filters.dateRange.end.toISOString());
    }
    
    // Visible layers
    if (visibleLayers && visibleLayers.size > 0) {
      params.set('layers', Array.from(visibleLayers).join(','));
    }
    
    // Subtype filters (convert Sets to JSON)
    if (subTypeFilters) {
      // Convert Sets to arrays for JSON serialization
      const subTypeFiltersSerializable: Record<string, string[]> = {};
      Object.keys(subTypeFilters).forEach(key => {
        if (subTypeFilters[key] && subTypeFilters[key].size > 0) {
          subTypeFiltersSerializable[key] = Array.from(subTypeFilters[key]);
        }
      });
      if (Object.keys(subTypeFiltersSerializable).length > 0) {
        params.set('subTypeFilters', JSON.stringify(subTypeFiltersSerializable));
      }
    }
    
    // Fetch filtered data from database
    const dataResponse = await fetch(`/api/planning/data?${params.toString()}`);
    
    if (!dataResponse.ok) {
      const errorData = await dataResponse.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Failed to fetch planning data: ${dataResponse.status}`);
    }

    const { problem, metadata } = await dataResponse.json();
    console.log('[AIMatchingPanel] Fetched planning data:', metadata);

    // Step 2: Send problem to planning service
    const response = await fetch("/api/planning", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(problem),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
      const suggestion = errorData.suggestion || '';
      
      // Format validation error details if present
      let detailsMessage = '';
      if (errorData.details && Array.isArray(errorData.details)) {
        const validationErrors = errorData.details
          .map((d: any) => `${d.path?.join('.') || 'unknown'}: ${d.message || 'Invalid'}`)
          .slice(0, 5) // Show first 5 errors
          .join('; ');
        if (validationErrors) {
          detailsMessage = ` Validation errors: ${validationErrors}`;
        }
      } else if (errorData.details && typeof errorData.details === 'string') {
        detailsMessage = ` ${errorData.details}`;
      }
      
      const fullMessage = `${errorMessage}${detailsMessage}${suggestion ? `. ${suggestion}` : ''}`;
      throw new Error(fullMessage);
    }

    const result = await response.json() as GlobalPlanningResult;
    
    return { result, problem };
  };

  // React Query with manual control and caching
  const { 
    data: queryData, 
    isLoading: loading, 
    error: queryError, 
    refetch 
  } = useQuery({
    queryKey,
    queryFn: fetchAllocationPlan,
    enabled: false, // Don't auto-fetch on mount or filter changes
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const planResult = queryData?.result || null;
  const error = queryError ? (queryError as Error).message : null;

  // Update warehouse/community maps and names when query data changes
  useEffect(() => {
    if (queryData) {
      const { result, problem } = queryData;
      
      // Store warehouse and community data (coordinates + names) for drawing lines and display
      const wMap = new Map<string, { lat: number; lng: number; name?: string }>();
      const cMap = new Map<string, { lat: number; lng: number; name?: string }>();
      const wNames = new Map<string, string>();
      const cNames = new Map<string, string>();
      
      // Store coordinates first
      for (const warehouse of problem.warehouses) {
        wMap.set(warehouse.id, { lat: warehouse.lat, lng: warehouse.lng });
      }
      
      for (const community of problem.communities) {
        cMap.set(community.id, { lat: community.lat, lng: community.lng });
      }
      
      // Batch fetch warehouse names (only for warehouses used in shipments)
      const warehouseIds = new Set(result.shipments.map(s => s.fromWarehouseId));
      const warehouseNamePromises = Array.from(warehouseIds).map(async (id) => {
        try {
          const wRes = await fetch(`/api/warehouses/${id}`);
          if (wRes.ok) {
            const wData = await wRes.json();
            const name = wData.name || `Warehouse ${id.slice(0, 8)}`;
            wNames.set(id, name);
            const coords = wMap.get(id);
            if (coords) {
              wMap.set(id, { ...coords, name });
            }
          }
        } catch (e) {
          console.warn('Could not fetch warehouse name:', id);
        }
      });
      
      // Batch fetch community names (only for communities used in shipments)
      const communityIds = new Set(result.shipments.map(s => s.toCommunityId));
      const communityNamePromises = Array.from(communityIds).map(async (id) => {
        try {
          const cRes = await fetch(`/api/communities/${id}`);
          if (cRes.ok) {
            const cData = await cRes.json();
            const name = cData.name || `Community ${id.slice(0, 8)}`;
            cNames.set(id, name);
            const coords = cMap.get(id);
            if (coords) {
              cMap.set(id, { ...coords, name });
            }
          }
        } catch (e) {
          console.warn('Could not fetch community name:', id);
        }
      });
      
      // Wait for all name fetches to complete
      Promise.all([...warehouseNamePromises, ...communityNamePromises]).then(() => {
        setWarehouseMap(wMap);
        setCommunityMap(cMap);
        setWarehouseNames(wNames);
        setCommunityNames(cNames);
      });
    }
  }, [queryData]);

  const shipments = planResult?.shipments || [];
  const totalPages = Math.ceil(shipments.length / pageSize);
  const pageShipments = shipments.slice(page * pageSize, page * pageSize + pageSize);

  const handleShipmentClick = (shipment: Shipment) => {
    if (onMatchClick) {
      // Enhance shipment with coordinates if available
      const warehouseCoords = warehouseMap.get(shipment.fromWarehouseId);
      const communityCoords = communityMap.get(shipment.toCommunityId);
      
      if (warehouseCoords && communityCoords) {
        // Create enhanced shipment with coordinates
        const enhancedShipment = {
          ...shipment,
          fromWarehouseCoords: warehouseCoords,
          toCommunityCoords: communityCoords,
        };
        onMatchClick(enhancedShipment as any);
      } else {
        // Fallback to original shipment
        onMatchClick(shipment);
      }
    }
  };

    return (
    <Paper shadow="sm" p="lg" radius="md" withBorder style={{ backgroundColor: "#fff" }}>
            {/* HEADER */}
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Paper
              p="xs"
              radius="xl"
              style={{
                backgroundColor: "#1a1a3c",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconBox size={20} />
            </Paper>
                <div>
              <Title order={4} c="#1a1a3c">
                Allocation Planning System
              </Title>
              <Text size="sm" c="dimmed">
                Global resource allocation plan
              </Text>
            </div>
          </Group>
          <ActionIcon
            variant="subtle"
            onClick={() => refetch()}
            loading={loading}
            title="Refresh plan"
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>

        {/* ROUTE METRICS - Show when route is selected */}
        {routeMetadata && (
          <RouteMetrics
            distance={routeMetadata.distance}
            duration={routeMetadata.duration}
            routePoints={routeMetadata.coordinates.length}
            showFullDetails={true}
          />
        )}

        {/* SUMMARY STATS */}
        {planResult && (
          <Paper p="md" radius="md" style={{ backgroundColor: "#f8f9fa" }}>
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Text size="sm" fw={500} c="dimmed">
                  Summary
                </Text>
                <Group gap="xl">
                  <div>
                    <Text size="lg" fw={700} c="#1a1a3c">
                      {planResult.summary.totalShipments}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Shipments
                    </Text>
                  </div>
                  <div>
                    <Text size="lg" fw={700} c="#1a1a3c">
                      {planResult.summary.totalItemsAllocated.toLocaleString()}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Items Allocated
                    </Text>
                  </div>
                  <div>
                    <Text size="lg" fw={700} c="#1a1a3c">
                      {(planResult.summary.fulfillmentRate * 100).toFixed(1)}%
                    </Text>
                    <Text size="xs" c="dimmed">
                      Fulfillment Rate
                    </Text>
                                        </div>
                  <div>
                    <Text size="lg" fw={700} c="#1a1a3c">
                      ${planResult.summary.totalCost.toFixed(2)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Total Cost
                    </Text>
                                    </div>
                </Group>
                {planResult.summary.fulfillmentRate < 1 && (
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    title="Partial Fulfillment"
                    color="yellow"
                    mt="sm"
                  >
                    {planResult.summary.unmetNeeds.length} needs could not be fully satisfied
                  </Alert>
                )}
              </Stack>
            </Group>
          </Paper>
        )}

        {/* LOADING STATE */}
        {loading && (
          <Group justify="center" py="xl">
            <Loader size="md" />
            <Text c="dimmed">Generating allocation plan...</Text>
          </Group>
        )}

        {/* ERROR STATE */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            withCloseButton
          >
            {error}
          </Alert>
        )}

        {/* SHIPMENTS LIST */}
        {!loading && !error && planResult && (
          <>
            {pageShipments.length === 0 ? (
              <Paper p="xl" radius="md" style={{ backgroundColor: "#f8f9fa" }}>
                <Text ta="center" c="dimmed">
                  No shipments in this allocation plan
                </Text>
              </Paper>
            ) : (
              <Stack gap="sm">
                {pageShipments.map((shipment, index) => (
                  <Paper
                    key={`${shipment.fromWarehouseId}-${shipment.toCommunityId}-${shipment.itemCode}-${index}`}
                    p="md"
                    radius="md"
                    withBorder
                    style={{
                      cursor: onMatchClick ? "pointer" : "default",
                      transition: "all 0.2s",
                    }}
                    onClick={() => handleShipmentClick(shipment)}
                    onMouseEnter={(e) => {
                      if (onMatchClick) {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#fff";
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <Group gap="md">
                        {/* Warehouse */}
                        <Group gap="xs">
                          <IconBox size={18} color="#1478FF" />
                          <div>
                            <Text size="xs" c="dimmed">
                              Warehouse
                            </Text>
                            <Text size="sm" fw={500}>
                              {warehouseNames.get(shipment.fromWarehouseId) || shipment.fromWarehouseId.slice(0, 8)}
                            </Text>
                          </div>
                        </Group>

                        {/* Arrow */}
                        <IconArrowRight size={16} color="#1478FF" />

                        {/* Community */}
                        <Group gap="xs">
                          <IconMapPin size={18} color="#1478FF" />
                          <div>
                            <Text size="xs" c="dimmed">
                              Community
                            </Text>
                            <Text size="sm" fw={500}>
                              {communityNames.get(shipment.toCommunityId) || shipment.toCommunityId.slice(0, 8)}
                            </Text>
                                </div>
                        </Group>
                      </Group>

                      <Group gap="md">
                        {/* Item and Quantity */}
                        <div style={{ textAlign: "right" }}>
                          <Badge color="blue" variant="light" mb={4}>
                            {shipment.itemCode}
                          </Badge>
                          <Text size="sm" fw={600}>
                            {shipment.quantity} units
                          </Text>
                        </div>

                        {/* Cost */}
                        <div style={{ textAlign: "right" }}>
                          <Text size="xs" c="dimmed">
                            Cost
                          </Text>
                          <Text size="sm" fw={600} c="#1a1a3c">
                            ${shipment.cost.toFixed(2)}
                          </Text>
                    </div>
                      </Group>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <ActionIcon
                  variant="subtle"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                >
                  <IconChevronLeft size={18} />
                </ActionIcon>

                <Text size="sm" fw={500} c="dimmed">
                    Page {page + 1} / {totalPages}
                </Text>

                <ActionIcon
                  variant="subtle"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                >
                  <IconChevronRight size={18} />
                </ActionIcon>
              </Group>
            )}
          </>
        )}

        {/* EMPTY STATE - No plan loaded yet */}
        {!loading && !error && !planResult && (
          <Paper p="xl" radius="md" style={{ backgroundColor: "#f8f9fa" }}>
            <Stack gap="sm" align="center">
              <IconBox size={48} color="#1478FF" />
              <Text ta="center" c="dimmed">
                Click refresh to generate an allocation plan
              </Text>
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={() => refetch()}
              >
                Generate Plan
              </Button>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Paper>
    );
}
