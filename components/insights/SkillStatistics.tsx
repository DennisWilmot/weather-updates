'use client';

import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Plot from '@observablehq/plot';
import {
  Card,
  Stack,
  Title,
  Select,
  Group,
  Text,
  Loader,
  Center,
  Alert,
  Box,
  UnstyledButton,
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface SkillStat {
  id: string;
  name: string;
  count: number;
}

interface SkillStatsResponse {
  skills: SkillStat[];
  total: number;
  parishBreakdown: {
    parishId: string;
    parishName: string;
    peopleCount: number;
    skillCount: number;
  }[];
}

export interface ChartModalPayload {
  title: string;
  description?: string;
  content: ReactNode;
}

interface SkillStatisticsProps {
  onOpenChart?: (payload: ChartModalPayload) => void;
}

export default function SkillStatistics({ onOpenChart }: SkillStatisticsProps) {
  const [parishFilter, setParishFilter] = useState<string | null>(null);
  const [topN, setTopN] = useState<number>(20);

  // Fetch parishes for filter
  const { data: parishesData } = useQuery({
    queryKey: ['parishes'],
    queryFn: async () => {
      const response = await fetch('/api/parishes');
      if (!response.ok) throw new Error('Failed to fetch parishes');
      return response.json();
    },
  });

  // Fetch skill statistics
  const { data, isLoading, error } = useQuery<SkillStatsResponse>({
    queryKey: ['skill-stats', parishFilter, topN],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (parishFilter) params.append('parishId', parishFilter);
      params.append('limit', topN.toString());

      const response = await fetch(`/api/skills/stats?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch skill statistics');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleKeyActivate = (event: KeyboardEvent<HTMLElement>, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const openTopSkillsModal = () => {
    if (!data || data.skills.length === 0 || !onOpenChart) return;
    onOpenChart({
      title: 'Top Skills',
      description: 'Expanded view of the most common recorded skills.',
      content: (
        <Box mt="sm">
          <PlotCanvas>
            <SkillsBarChart skills={data.skills} height={480} />
          </PlotCanvas>
        </Box>
      ),
    });
  };

  const openParishModal = () => {
    if (!data || data.parishBreakdown.length === 0 || !onOpenChart) return;
    onOpenChart({
      title: 'Parish Comparison',
      description: 'Detailed comparison of people and skills across parishes.',
      content: (
        <Box mt="sm">
          <PlotCanvas>
            <ParishComparisonChart breakdown={data.parishBreakdown} height={520} />
          </PlotCanvas>
        </Box>
      ),
    });
  };

  return (
    <Card withBorder>
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Title order={3}>Skill Distribution</Title>
          <Group gap="md">
            <Select
              placeholder="Filter by Parish"
              data={
                parishesData?.parishes?.map((p: { id: string; name: string }) => ({
                  value: p.id,
                  label: p.name,
                })) || []
              }
              clearable
              value={parishFilter}
              onChange={setParishFilter}
              style={{ width: 200 }}
            />
            <Select
              placeholder="Top N Skills"
              data={[
                { value: '10', label: 'Top 10' },
                { value: '20', label: 'Top 20' },
                { value: '50', label: 'Top 50' },
                { value: '100', label: 'Top 100' },
              ]}
              value={topN.toString()}
              onChange={(value) => value && setTopN(parseInt(value, 10))}
              style={{ width: 120 }}
            />
          </Group>
        </Group>

        {isLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : error ? (
          <Alert icon={<IconAlertTriangle size={16} />} title="Error" color="red">
            Failed to load skill statistics. Please try again.
          </Alert>
        ) : !data || data.skills.length === 0 ? (
          <Alert icon={<IconAlertTriangle size={16} />} title="No Data" color="blue">
            No skill statistics available.
          </Alert>
        ) : (
          <Stack gap="xl">
            <ChartPreviewShell
              title="Top Skills"
              description={`Showing ${data.skills.length} of ${data.total} unique skills. Click to expand.`}
              onActivate={openTopSkillsModal}
              onKeyActivate={handleKeyActivate}
            >
              <SkillsBarChart skills={data.skills} height={260} />
            </ChartPreviewShell>

            {data.parishBreakdown.length === 0 ? (
              <Alert icon={<IconAlertTriangle size={16} />} title="No Parish Data" color="blue">
                No parish-level statistics available for the selected filters.
              </Alert>
            ) : (
              <ChartPreviewShell
                title="Parish comparison"
                description="People with recorded skills vs. distinct skills observed in each parish. Click to expand."
                onActivate={openParishModal}
                onKeyActivate={handleKeyActivate}
              >
                <ParishComparisonChart breakdown={data.parishBreakdown} height={320} />
              </ChartPreviewShell>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

interface SkillsBarChartProps {
  skills: SkillStat[];
  height: number;
}

function SkillsBarChart({ skills, height }: SkillsBarChartProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || skills.length === 0) return;
    ref.current.innerHTML = '';

    const chartData = skills.map((skill) => ({
      skill: skill.name,
      count: skill.count,
    }));

    const plot = Plot.plot({
      marginLeft: 120,
      marginBottom: 40,
      width: ref.current.clientWidth || ref.current.parentElement?.clientWidth || 800,
      height: Math.max(height, skills.length * 28),
      x: {
        label: 'Number of People',
        grid: true,
      },
      y: {
        domain: chartData.map((d) => d.skill).reverse(),
      },
      marks: [
        Plot.barX(chartData, {
          x: 'count',
          y: 'skill',
          fill: '#228be6',
          tip: true,
        }),
        Plot.ruleX([0]),
      ],
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
      },
    });

    ref.current.appendChild(plot);

    return () => {
      if (ref.current) {
        ref.current.innerHTML = '';
      }
    };
  }, [skills, height]);

  return (
    <Box
      ref={ref}
      style={{
        width: '100%',
        minHeight: height,
        overflowX: 'auto',
      }}
    />
  );
}

interface ParishComparisonChartProps {
  breakdown: SkillStatsResponse['parishBreakdown'];
  height: number;
}

function ParishComparisonChart({ breakdown, height }: ParishComparisonChartProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || breakdown.length === 0) return;
    ref.current.innerHTML = '';

    const breakdownSeries = breakdown.flatMap((row) => [
      {
        parish: row.parishName,
        metric: 'People with skills',
        value: row.peopleCount,
      },
      {
        parish: row.parishName,
        metric: 'Unique skills observed',
        value: row.skillCount,
      },
    ]);

    const plot = Plot.plot({
      marginBottom: 80,
      width: ref.current.clientWidth || ref.current.parentElement?.clientWidth || 800,
      height: Math.max(height, breakdown.length * 34),
      x: {
        tickRotate: -40,
      },
      y: {
        label: 'Count',
        grid: true,
      },
      color: {
        legend: true,
      },
      marks: [
        Plot.barY(breakdownSeries, {
          x: 'parish',
          y: 'value',
          fill: 'metric',
          tip: true,
        }),
        Plot.ruleY([0]),
      ],
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
      },
    });

    ref.current.appendChild(plot);

    return () => {
      if (ref.current) {
        ref.current.innerHTML = '';
      }
    };
  }, [breakdown, height]);

  return (
    <Box
      ref={ref}
      style={{
        width: '100%',
        minHeight: height,
        overflowX: 'auto',
      }}
    />
  );
}

function PlotCanvas({ children }: { children: ReactNode }) {
  return (
    <Box
      style={{
        width: '100%',
        overflowX: 'auto',
      }}
    >
      {children}
    </Box>
  );
}

interface ChartPreviewShellProps {
  title: string;
  description: string;
  children: ReactNode;
  onActivate: () => void;
  onKeyActivate: (event: KeyboardEvent<HTMLElement>, action: () => void) => void;
}

function ChartPreviewShell({
  title,
  description,
  children,
  onActivate,
  onKeyActivate,
}: ChartPreviewShellProps) {
  return (
    <UnstyledButton
      onClick={onActivate}
      onKeyDown={(event) => onKeyActivate(event, onActivate)}
      aria-label={`Expand ${title} chart`}
      style={{ width: '100%' }}
    >
      <Card
        withBorder
        shadow="sm"
        style={{
          cursor: 'zoom-in',
          transition: 'transform 120ms ease',
        }}
        onMouseEnter={(event) => {
          (event.currentTarget.style.transform = 'scale(1.005)');
        }}
        onMouseLeave={(event) => {
          (event.currentTarget.style.transform = 'scale(1)');
        }}
      >
        <Stack gap={4}>
          <Group gap={8} align="baseline">
            <Title order={5}>{title}</Title>
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          </Group>
          {children}
        </Stack>
      </Card>
    </UnstyledButton>
  );
}

