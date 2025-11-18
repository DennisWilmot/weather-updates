/**
 * FormSection - Section wrapper for grouping related form fields
 * Supports collapsible sections and progress indicators
 */

'use client';

import { ReactNode, useState } from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  Collapse,
  Badge,
  Progress,
  ActionIcon,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconChevronDown, IconChevronUp, IconCheck } from '@tabler/icons-react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  collapsible?: boolean;
  required?: boolean;
  completed?: boolean;
  progress?: number; // 0-100
  errorCount?: number;
  className?: string;
}

export default function FormSection({
  title,
  description,
  children,
  defaultExpanded = true,
  collapsible = true,
  required = false,
  completed = false,
  progress,
  errorCount = 0,
  className,
}: FormSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <Paper withBorder p="md" className={className}>
      <Stack gap="sm">
        {/* Header */}
        <Group
          justify="space-between"
          style={{ cursor: collapsible ? 'pointer' : 'default' }}
          onClick={() => collapsible && setExpanded(!expanded)}
        >
          <Group gap="xs">
            <Text size="md" fw={600}>
              {title}
            </Text>
            {required && (
              <Badge size="xs" color="red" variant="light">
                Required
              </Badge>
            )}
            {completed && (
              <Badge size="xs" color="green" variant="light" leftSection={<IconCheck size={12} />}>
                Complete
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge size="xs" color="red" variant="light">
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </Group>

          {collapsible && (
            <ActionIcon
              variant="subtle"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              size={isMobile ? "lg" : "md"}
              style={{
                minWidth: isMobile ? '44px' : undefined,
                minHeight: isMobile ? '44px' : undefined,
              }}
            >
              {expanded ? <IconChevronUp size={isMobile ? 20 : 18} /> : <IconChevronDown size={isMobile ? 20 : 18} />}
            </ActionIcon>
          )}
        </Group>

        {/* Description */}
        {description && (
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        )}

        {/* Progress Bar */}
        {progress !== undefined && (
          <Progress value={progress} size="sm" color={progress === 100 ? 'green' : 'blue'} />
        )}

        {/* Content */}
        <Collapse in={expanded}>
          <Stack gap="md" mt="sm">
            {children}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}

