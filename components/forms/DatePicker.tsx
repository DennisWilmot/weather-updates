/**
 * DatePicker - Date and DateTime picker wrapper component
 * Provides consistent styling and validation integration
 */

'use client';

import { useState } from 'react';
import { TextInput, Group, Text, Popover, Button } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconCalendar } from '@tabler/icons-react';

interface DatePickerProps {
  label?: string;
  description?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  includeTime?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function DatePicker({
  label,
  description,
  value,
  onChange,
  error,
  required = false,
  minDate,
  maxDate,
  includeTime = false,
  placeholder,
  disabled = false,
  className,
}: DatePickerProps) {
  const [opened, { close, open }] = useDisclosure(false);
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const dateStr = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    if (includeTime) {
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${dateStr}, ${timeStr}`;
    }
    return dateStr;
  };

  // Handle date input change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDateInput(inputValue);

    if (inputValue) {
      const [datePart, timePart] = inputValue.split('T');
      const [year, month, day] = datePart.split('-').map(Number);

      if (year && month && day) {
        let newDate = new Date(year, month - 1, day);

        if (includeTime && timePart) {
          const [hours, minutes] = timePart.split(':').map(Number);
          if (hours !== undefined && minutes !== undefined) {
            newDate.setHours(hours, minutes, 0, 0);
          }
        } else if (includeTime) {
          // Default to current time if time not provided
          const now = new Date();
          newDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
        }

        // Validate min/max dates
        if (minDate && newDate < minDate) {
          return;
        }
        if (maxDate && newDate > maxDate) {
          return;
        }

        onChange(newDate);
      }
    } else {
      onChange(null);
    }
  };

  // Get input type based on includeTime
  const inputType = includeTime ? 'datetime-local' : 'date';

  // Format value for input
  const inputValue = value
    ? includeTime
      ? value.toISOString().slice(0, 16)
      : value.toISOString().slice(0, 10)
    : '';

  return (
    <div className={className}>
      {label && (
        <Group gap="xs" mb="xs">
          <Text size="sm" fw={500}>
            {label}
          </Text>
          {required && (
            <Text size="sm" c="red">
              *
            </Text>
          )}
        </Group>
      )}

      {description && (
        <Text size="xs" c="dimmed" mb="sm">
          {description}
        </Text>
      )}

      <TextInput
        type={inputType}
        value={inputValue}
        onChange={handleDateChange}
        placeholder={placeholder || (includeTime ? 'MM/DD/YYYY, --:-- --' : 'MM/DD/YYYY')}
        error={error}
        disabled={disabled}
        size={isMobile ? "md" : "sm"}
        rightSection={<IconCalendar size={isMobile ? 18 : 16} />}
        styles={{
          input: {
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: isMobile ? '16px' : undefined, // Prevent zoom on iOS
            minHeight: isMobile ? '44px' : undefined, // Touch target size
          },
        }}
      />

      {/* Display formatted date */}
      {value && (
        <Text size="xs" c="dimmed" mt="xs">
          Selected: {formatDate(value)}
        </Text>
      )}
    </div>
  );
}

