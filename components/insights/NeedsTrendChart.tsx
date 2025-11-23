'use client';

import { ReactNode, useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import { Card, Stack, Title, Text, Box, Alert, UnstyledButton } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface NeedsTrendChartProps {
  data: Array<{ label: string; count: number }>;
  title?: string;
  subtitle?: string;
  onOpenChart?: (payload: { title: string; description?: string; content: ReactNode }) => void;
  compactHeight?: number;
}

export default function NeedsTrendChart({
  data,
  title = 'Requests by Parish',
  subtitle = 'How many records originate from each parish.',
  onOpenChart,
  compactHeight = 260,
}: NeedsTrendChartProps) {
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
      width:
        chartRef.current.clientWidth ||
        chartRef.current.parentElement?.clientWidth ||
        600,
      height: Math.max(compactHeight, data.length * 24),
      x: {
        label: 'Records',
        grid: true,
      },
      y: {
        domain: data.map((item) => item.label).reverse(),
      },
      color: {
        scheme: 'blues',
      },
      marks: [
        Plot.barX(data, {
          x: 'count',
          y: 'label',
          fill: '#4dabf7',
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
      title,
      description: 'Expanded comparison of submissions per parish.',
      content: (
        <Box mt="sm">
          <ExpandedParishChart data={data} />
        </Box>
      ),
    });
  };

  return (
    <Card withBorder>
      <Stack gap="sm">
        <Title order={4}>{title}</Title>
        <Text size="sm" c="dimmed">
          {subtitle}
        </Text>
        {data.length === 0 ? (
          <Alert icon={<IconAlertTriangle size={16} />} title="No parish data" color="blue">
            There are no submissions in the current result set.
          </Alert>
        ) : (
          <UnstyledButton
            aria-label="Expand parish comparison chart"
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

function ExpandedParishChart({ data }: { data: { label: string; count: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    ref.current.innerHTML = '';

    const chart = Plot.plot({
      marginBottom: 60,
      marginLeft: 160,
      width: ref.current.clientWidth || ref.current.parentElement?.clientWidth || 700,
      height: Math.max(480, data.length * 28),
      x: {
        label: 'Records',
        grid: true,
      },
      y: {
        domain: data.map((item) => item.label).reverse(),
      },
      color: {
        scheme: 'blues',
      },
      marks: [
        Plot.barX(data, {
          x: 'count',
          y: 'label',
          fill: '#1c7ed6',
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

