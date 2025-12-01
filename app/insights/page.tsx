'use client';

import { ReactNode, useMemo, useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Stack,
  Title,
  Card,
  Group,
  Text,
  Badge,
  Select,
  TextInput,
  Button,
  Table,
  ScrollArea,
  Pagination,
  Loader,
  Center,
  Alert,
  Box,
  Modal,
  SimpleGrid,
  Skeleton,
} from '@mantine/core';
import {
  IconSearch,
  IconDownload,
  IconAlertTriangle,
  IconPlus,
} from '@tabler/icons-react';
import DashboardNavigation from '@/components/DashboardNavigation';
import SkillStatistics from '@/components/insights/SkillStatistics';
import NeedsOverviewChart from '@/components/insights/NeedsOverviewChart';
import NeedsTrendChart from '@/components/insights/NeedsTrendChart';

interface PeopleNeed {
  id: string;
  name: string;
  type: string;
  parishId: string;
  communityId: string | null;
  latitude: string | null;
  longitude: string | null;
  needs: string[];
  skills: string[] | null;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  organization: string | null;
  numberOfPeople: number | null;
  urgency: 'low' | 'medium' | 'high' | 'critical' | null;
  description: string | null;
  status: 'pending' | 'in_progress' | 'fulfilled' | 'cancelled' | null;
  createdAt: string;
  parish: {
    id: string;
    name: string;
    code: string;
  } | null;
  community: {
    id: string;
    name: string;
  } | null;
}

type SortColumn = 'contactName' | 'parish' | 'community' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface ChartDatum {
  label: string;
  count: number;
}

const reportOptions = [
  { value: 'people-needs', label: 'PNS People, Needs, Skills Assessment' },
  { value: 'skill-distribution', label: 'Skill Distribution' },
];

const buildNeedsSummary = (items: PeopleNeed[], limit = 10): ChartDatum[] => {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    (item.needs || []).forEach((rawNeed) => {
      const need = rawNeed?.trim();
      if (!need) return;
      counts.set(need, (counts.get(need) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

const buildParishSummary = (items: PeopleNeed[], limit = 10): ChartDatum[] => {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const label = item.parish?.name || 'Unspecified Parish';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

export default function InsightsPage() {
  const [selectedReport, setSelectedReport] = useState<string>('people-needs');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [parishFilter, setParishFilter] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('contactName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [chartModal, setChartModal] = useState<{
    title: string;
    description?: string;
    content: React.ReactNode;
  } | null>(null);
  const itemsPerPage = 20;

  // Debounce search query to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch parishes for filter (cached for 15 minutes)
  const { data: parishesData } = useQuery({
    queryKey: ['parishes'],
    queryFn: async () => {
      const response = await fetch('/api/parishes');
      if (!response.ok) throw new Error('Failed to fetch parishes');
      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch people needs data with server-side pagination
  const { data, isLoading, error } = useQuery<{ data: PeopleNeed[]; total: number; page: number; totalPages: number }>({
    queryKey: [
      'people-needs',
      debouncedSearchQuery,
      parishFilter,
      sortColumn,
      sortOrder,
      currentPage,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (parishFilter) params.append('parishId', parishFilter);
      params.append('sortBy', sortColumn);
      params.append('sortOrder', sortOrder);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await fetch(`/api/people-needs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch people needs');
      return response.json();
    },
    staleTime: 3 * 60 * 1000, // 3 minutes (data is cached on server)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes instead of 30 seconds
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
  });

  // Handle column sorting (memoized to prevent unnecessary re-renders)
  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  }, [sortColumn, sortOrder]);




  // Export to CSV - fetches all data (memoized to prevent recreation)
  const exportToCSV = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (parishFilter) params.append('parishId', parishFilter);
      params.append('sortBy', sortColumn);
      params.append('sortOrder', sortOrder);
      // Fetch all data for export (no pagination)
      params.append('limit', '10000'); // Large limit to get all data
      params.append('page', '1');

      const response = await fetch(`/api/people-needs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch data for export');
      const exportData = await response.json();

      if (!exportData.data || exportData.data.length === 0) return;

      const headers = [
        'Contact Name',
        'Contact Phone',
        'Contact Email',
        'Needs',
        'Skills',
        'Parish',
        'Community',
        'Location (Lat, Lng)',
        'Created At',
      ];

      const rows = exportData.data.map((item: PeopleNeed) => [
        item.contactName,
        item.contactPhone || '',
        item.contactEmail || '',
        Array.isArray(item.needs) ? item.needs.join('; ') : '',
        item.skills && Array.isArray(item.skills) && item.skills.length > 0 ? item.skills.join('; ') : '',
        item.parish?.name || 'N/A',
        item.community?.name || 'N/A',
        formatLocation(item),
        formatDate(item.createdAt),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: (string | number)[]) => row.map((cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `people-needs-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  }, [debouncedSearchQuery, parishFilter, sortColumn, sortOrder]);

  // Memoize expensive computations with proper dependencies
  const currentRecords = useMemo(() => data?.data ?? [], [data?.data]);
  const needsSummary = useMemo(() => buildNeedsSummary(currentRecords), [currentRecords]);
  const parishSummary = useMemo(() => buildParishSummary(currentRecords), [currentRecords]);

  // Memoize parish options to prevent unnecessary re-renders
  const parishOptions = useMemo(() =>
    parishesData?.parishes?.map((p: { id: string; name: string }) => ({
      value: p.id,
      label: p.name,
    })) || []
    , [parishesData?.parishes]);

  // Memoize format functions to prevent recreation
  const formatNeeds = useCallback((needs: string[]) => {
    if (!needs || needs.length === 0) return <Text size="sm" c="dimmed">None</Text>;
    return (
      <Group gap={4}>
        {needs.slice(0, 3).map((need, idx) => (
          <Badge key={idx} size="sm" variant="light">
            {need}
          </Badge>
        ))}
        {needs.length > 3 && (
          <Badge size="sm" variant="light" color="gray">
            +{needs.length - 3}
          </Badge>
        )}
      </Group>
    );
  }, []);

  const formatLocation = useCallback((item: PeopleNeed) => {
    if (item.latitude && item.longitude) {
      return `${parseFloat(item.latitude).toFixed(4)}, ${parseFloat(item.longitude).toFixed(4)}`;
    }
    return 'N/A';
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  return (
    <div>
      <DashboardNavigation />
      <Container size="xl" py="xl">
        <Modal
          opened={!!chartModal}
          onClose={() => setChartModal(null)}
          title={chartModal?.title}
          size="xl"
          centered
        >
          {chartModal?.description && (
            <Text size="sm" c="dimmed" mb="md">
              {chartModal.description}
            </Text>
          )}
          {chartModal?.content}
        </Modal>

        <Stack gap="lg">
          <Group justify="space-between" align="center" gap="md" wrap="wrap">
            <Stack gap={4}>
              <Title order={1}>Insights & Reports</Title>
              <Group gap={6} align="center">
                <Text size="sm" c="dimmed">
                  Report type:
                </Text>
                <Text size="sm" fw={600}>
                  {reportOptions.find((option) => option.value === selectedReport)?.label || ''}
                </Text>
              </Group>
            </Stack>

            <Group gap="sm" wrap="wrap">
              <Select
                aria-label="Select report type"
                placeholder="Choose report"
                value={selectedReport}
                onChange={(value) => value && setSelectedReport(value)}
                data={reportOptions}
                maw={260}
              />
              {selectedReport === 'people-needs' && data && data.total > 0 && (
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={exportToCSV}
                  variant="light"
                >
                  Export CSV
                </Button>
              )}
              <Button
                variant="outline"
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  /* Placeholder for future custom report builder */
                }}
              >
                Build Custom Report
              </Button>
            </Group>
          </Group>

          {selectedReport === 'people-needs' && (
            <Box pt="lg">
              <Stack gap="lg">
                {isLoading ? (
                  <InsightsChartsSkeleton />
                ) : data && data.data.length > 0 ? (
                  <SimpleGrid cols={{ base: 1, md: 2 }}>
                    <NeedsOverviewChart
                      data={needsSummary}
                      totalRecords={data.data.length}
                      onOpenChart={(payload) => setChartModal(payload)}
                    />
                    <NeedsTrendChart
                      data={parishSummary}
                      onOpenChart={(payload) => setChartModal(payload)}
                    />
                  </SimpleGrid>
                ) : null}
                <Card withBorder>
                  <Stack gap="md">
                    {/* Filters */}
                    <Group grow>
                      <TextInput
                        placeholder="Search by name or description..."
                        leftSection={<IconSearch size={16} />}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          // Page reset is handled by debounce effect
                        }}
                      />
                      <Select
                        placeholder="Filter by Parish"
                        data={parishOptions}
                        clearable
                        value={parishFilter}
                        onChange={setParishFilter}
                      />
                    </Group>

                    {/* Results count */}
                    {data && (
                      <Text size="sm" c="dimmed">
                        Showing {data.data.length} of {data.total} results
                        {data.totalPages > 1 && ` (Page ${data.page} of ${data.totalPages})`}
                      </Text>
                    )}

                    {/* Table */}
                    {isLoading ? (
                      <InsightsTableSkeleton />
                    ) : error ? (
                      <Alert icon={<IconAlertTriangle size={16} />} title="Error" color="red">
                        Failed to load data. Please try again.
                      </Alert>
                    ) : !data || data.data.length === 0 ? (
                      <Alert icon={<IconAlertTriangle size={16} />} title="No Data" color="blue">
                        No people needs records found matching your filters.
                      </Alert>
                    ) : (
                      <>
                        <ScrollArea>
                          <Table striped highlightOnHover>
                            <Table.Thead>
                              <Table.Tr>
                                <Table.Th style={{ cursor: 'pointer' }} onClick={() => handleSort('contactName')}>
                                  Contact
                                </Table.Th>
                                <Table.Th>Needs</Table.Th>
                                <Table.Th>Skills</Table.Th>
                                <Table.Th style={{ cursor: 'pointer' }} onClick={() => handleSort('parish')}>
                                  Parish
                                </Table.Th>
                                <Table.Th style={{ cursor: 'pointer' }} onClick={() => handleSort('community')}>
                                  Community
                                </Table.Th>
                                <Table.Th>Location</Table.Th>
                                <Table.Th style={{ cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>
                                  Created At
                                </Table.Th>
                              </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                              {data.data.map((item) => (
                                <Table.Tr key={item.id}>
                                  <Table.Td>
                                    <Stack gap={2}>
                                      <Text size="sm">
                                        {item.contactName}
                                      </Text>
                                      {item.contactPhone && (
                                        <Text size="xs" c="dimmed">
                                          {item.contactPhone}
                                        </Text>
                                      )}
                                      {item.contactEmail && (
                                        <Text size="xs" c="dimmed">
                                          {item.contactEmail}
                                        </Text>
                                      )}
                                    </Stack>
                                  </Table.Td>
                                  <Table.Td>{formatNeeds(item.needs)}</Table.Td>
                                  <Table.Td>{item.skills && item.skills.length > 0 ? formatNeeds(item.skills) : <Text size="sm" c="dimmed">None</Text>}</Table.Td>
                                  <Table.Td>
                                    <Text size="sm">{item.parish?.name || 'N/A'}</Text>
                                  </Table.Td>
                                  <Table.Td>
                                    <Text size="sm">{item.community?.name || 'N/A'}</Text>
                                  </Table.Td>
                                  <Table.Td>
                                    <Text size="sm" c="dimmed">
                                      {formatLocation(item)}
                                    </Text>
                                  </Table.Td>
                                  <Table.Td>
                                    <Text size="sm" c="dimmed">
                                      {formatDate(item.createdAt)}
                                    </Text>
                                  </Table.Td>
                                </Table.Tr>
                              ))}
                            </Table.Tbody>
                          </Table>
                        </ScrollArea>

                        {/* Pagination */}
                        {data.totalPages > 1 && (
                          <Group justify="center" mt="md">
                            <Pagination
                              value={currentPage}
                              onChange={setCurrentPage}
                              total={data.totalPages}
                              size="sm"
                            />
                          </Group>
                        )}
                      </>
                    )}
                  </Stack>
                </Card>
              </Stack>
            </Box>
          )}

          {selectedReport === 'skill-distribution' && (
            <Box pt="lg">
              <SkillStatistics onOpenChart={(payload) => setChartModal(payload)} />
            </Box>
          )}
        </Stack>
      </Container>
    </div>
  );
}

function InsightsChartsSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }}>
      <Card withBorder p="md">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Skeleton height={20} width={150} mb="xs" />
              <Skeleton height={14} width={200} />
            </Box>
            <Skeleton height={24} width={24} />
          </Group>
          <Box style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton height={180} width="100%" radius="md" />
          </Box>
          <Group gap="xs">
            <Skeleton height={12} width={100} />
            <Skeleton height={12} width={80} />
          </Group>
        </Stack>
      </Card>

      <Card withBorder p="md">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Skeleton height={20} width={140} mb="xs" />
              <Skeleton height={14} width={180} />
            </Box>
            <Skeleton height={24} width={24} />
          </Group>
          <Box style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton height={180} width="100%" radius="md" />
          </Box>
          <Group gap="xs">
            <Skeleton height={12} width={90} />
            <Skeleton height={12} width={110} />
          </Group>
        </Stack>
      </Card>
    </SimpleGrid>
  );
}

function InsightsTableSkeleton() {
  return (
    <Stack gap="md">
      {/* Results count skeleton */}
      <Skeleton height={14} width={200} />

      {/* Table skeleton */}
      <ScrollArea>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th><Skeleton height={16} width={60} /></Table.Th>
              <Table.Th><Skeleton height={16} width={50} /></Table.Th>
              <Table.Th><Skeleton height={16} width={45} /></Table.Th>
              <Table.Th><Skeleton height={16} width={55} /></Table.Th>
              <Table.Th><Skeleton height={16} width={70} /></Table.Th>
              <Table.Th><Skeleton height={16} width={60} /></Table.Th>
              <Table.Th><Skeleton height={16} width={80} /></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Array.from({ length: 10 }).map((_, index) => (
              <InsightsTableRowSkeleton key={index} />
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {/* Pagination skeleton */}
      <Group justify="center" mt="md">
        <Skeleton height={32} width={200} />
      </Group>
    </Stack>
  );
}

function InsightsTableRowSkeleton() {
  return (
    <Table.Tr>
      <Table.Td>
        <Stack gap={2}>
          <Skeleton height={14} width={120} />
          <Skeleton height={12} width={100} />
          <Skeleton height={12} width={140} />
        </Stack>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          <Skeleton height={20} width={60} radius="md" />
          <Skeleton height={20} width={50} radius="md" />
          <Skeleton height={20} width={70} radius="md" />
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          <Skeleton height={20} width={55} radius="md" />
          <Skeleton height={20} width={65} radius="md" />
        </Group>
      </Table.Td>
      <Table.Td>
        <Skeleton height={14} width={80} />
      </Table.Td>
      <Table.Td>
        <Skeleton height={14} width={90} />
      </Table.Td>
      <Table.Td>
        <Skeleton height={14} width={100} />
      </Table.Td>
      <Table.Td>
        <Skeleton height={14} width={110} />
      </Table.Td>
    </Table.Tr>
  );
}

