/**
 * FormField - Wrapper component for consistent form field styling
 * Provides error display, labels, help text, and required indicators
 */

'use client';

import { ReactNode } from 'react';
import { Group, Text, Tooltip, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconInfoCircle } from '@tabler/icons-react';

interface FormFieldProps {
  label?: string;
  description?: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export default function FormField({
  label,
  description,
  helpText,
  error,
  required = false,
  children,
  className,
}: FormFieldProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <div className={className} style={{ marginBottom: isMobile ? '16px' : '12px' }}>
      {/* Label */}
      {label && (
        <Group gap="xs" mb="xs">
          <Text size={isMobile ? "md" : "sm"} fw={500}>
            {label}
          </Text>
          {required && (
            <Text size={isMobile ? "md" : "sm"} c="red">
              *
            </Text>
          )}
          {helpText && (
            <Tooltip label={helpText} withArrow>
              <IconInfoCircle 
                size={isMobile ? 18 : 14} 
                style={{ cursor: 'help', minWidth: isMobile ? '44px' : undefined, minHeight: isMobile ? '44px' : undefined }} 
              />
            </Tooltip>
          )}
        </Group>
      )}

      {/* Description */}
      {description && (
        <Text size="xs" c="dimmed" mb="sm">
          {description}
        </Text>
      )}

      {/* Field Content */}
      <div style={{ position: 'relative' }}>
        {children}
      </div>

      {/* Error Message */}
      {error && (
        <Text size="xs" c="red" mt="xs">
          {error}
        </Text>
      )}
    </div>
  );
}

