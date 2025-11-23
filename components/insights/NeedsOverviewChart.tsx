'use client';

import { ReactNode, useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import { Card, Stack, Title, Text, Box, Alert, UnstyledButton } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface NeedsOverviewChartProps {
  data: Array<{
    label: string;
    count: number;
  }>;
  totalRecords: number;
  onOpenChart?: (payload: { title: string; description?: string; content: ReactNode }) => void;
  compactHeight?: number;
}

export default function NeedsOverviewChart({
  data,
  totalRecords,
  onOpenChart,
  compactHeight = 260,
}: NeedsOverviewChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (data.length === 0) {
      chartRef.current.innerHTML = '';
      return;
    }

    chartRef.current.innerHTML = '';

    const chart = Plot.plot({
      marginLeft: 140,
      marginBottom: 40,
      height: Math.max(compactHeight, data.length * 24),
      width:
        chartRef.current.clientWidth ||
        chartRef.current.parentElement?.clientWidth ||
        600,
      x: {
        label: 'Mentions',
        grid: true,
      },
      y: {
        domain: data.map((item) => item.label).reverse(),
      },
      marks: [
        Plot.barX(data, {
          x: 'count',
          y: 'label',
          fill: '#12b886',
          tip: true,
        }),
        Plot.ruleX([0]),
      ],
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
      },
    });

    chartRef.current.appendChild(chart);

    return () => {
      if (chartRef.current) {
        chartRef.current.innerHTML = '';
      }
    };
  }, [data, compactHeight]);

  const openModal = () => {
    if (!data.length || !onOpenChart) return;
    onOpenChart({
      title: 'Top Needs',
      description: 'Expanded view of the most common needs in the selected dataset.',
      content: (
        <Box mt="sm">
          <ExpandedNeedsChart data={data} />
        </Box>
      ),
    });
  };

  if (totalRecords === 0) {
    return null;
  }

  return (
    <Card withBorder>
      <Stack gap="sm">
        <Title order={4}>Top Needs (current page)</Title>
        <Text size="sm" c="dimmed">
          Snapshot of the most common needs across the records currently loaded.
        </Text>
        {data.length === 0 ? (
          <Alert icon={<IconAlertTriangle size={16} />} title="No needs found" color="blue">
            The current result set does not include any categorized needs.
          </Alert>
        ) : (
          <UnstyledButton
            aria-label="Expand needs chart"
            onClick={openModal}
            style={{ width: '100%', cursor: 'zoom-in' }}
          >
            <Box
              ref={chartRef}
              style={{
                width: '100%',
                overflowX: 'auto',
              }}
            />
          </UnstyledButton>
        )}
      </Stack>
    </Card>
  );
}

function ExpandedNeedsChart({ data }: { data: { label: string; count: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    ref.current.innerHTML = '';

    const chart = Plot.plot({
      marginLeft: 150,
      marginBottom: 50,
      height: Math.max(480, data.length * 32),
      width: ref.current.clientWidth || ref.current.parentElement?.clientWidth || 700,
      x: {
        label: 'Mentions',
        grid: true,
      },
      y: {
        domain: data.map((item) => item.label).reverse(),
      },
      marks: [
        Plot.barX(data, {
          x: 'count',
          y: 'label',
          fill: '#12b886',
          tip: true,
        }),
        Plot.ruleX([0]),
      ],
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
      },
    });

    ref.current.appendChild(chart);

    return () => {
      if (ref.current) {
        ref.current.innerHTML = '';
      }
    };
  }, [data]);

  return (
    <Box
      ref={ref}
      style={{
        width: '100%',
        overflowX: 'auto',
      }}
    />
  );
}

