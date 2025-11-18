/**
 * MultiSelectCheckbox - Multi-select checkbox group component
 * Supports select all/deselect all, search, and custom styling
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Checkbox,
  Group,
  Stack,
  Text,
  TextInput,
  Button,
  ScrollArea,
  Badge,
  Box,
} from '@mantine/core';
import { IconSearch, IconCheck, IconX } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';

export interface CheckboxOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
  disabled?: boolean;
}

interface MultiSelectCheckboxProps {
  label?: string;
  description?: string;
  options: CheckboxOption[];
  value: string[];
  onChange: (values: string[]) => void;
  error?: string;
  required?: boolean;
  searchable?: boolean;
  selectAll?: boolean;
  maxHeight?: number;
  columns?: number;
  className?: string;
}

export default function MultiSelectCheckbox({
  label,
  description,
  options,
  value,
  onChange,
  error,
  required = false,
  searchable = true,
  selectAll = true,
  maxHeight = 300,
  columns = 2,
  className,
}: MultiSelectCheckboxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  // Responsive columns: mobile = 1, tablet = 2, desktop = columns prop
  const responsiveColumns = isMobile ? 1 : isTablet ? 2 : columns;

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (option) => option.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Check if all visible options are selected
  const allSelected = useMemo(() => {
    return filteredOptions.length > 0 && filteredOptions.every((opt) => value.includes(opt.value));
  }, [filteredOptions, value]);

  // Check if some visible options are selected
  const someSelected = useMemo(() => {
    return filteredOptions.some((opt) => value.includes(opt.value));
  }, [filteredOptions, value]);

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all visible options
      const visibleValues = filteredOptions.map((opt) => opt.value);
      onChange(value.filter((v) => !visibleValues.includes(v)));
    } else {
      // Select all visible options
      const visibleValues = filteredOptions
        .filter((opt) => !opt.disabled)
        .map((opt) => opt.value);
      const newValues = Array.from(new Set([...value, ...visibleValues]));
      onChange(newValues);
    }
  };

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

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

      {/* Search Bar */}
      {searchable && options.length > 5 && (
        <TextInput
          placeholder="Search options..."
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IconX size={16} />
              </button>
            ) : null
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          mb="sm"
          size={isMobile ? "md" : "sm"}
          styles={{
            input: {
              fontSize: isMobile ? '16px' : undefined, // Prevent zoom on iOS
            },
          }}
        />
      )}

      {/* Select All / Deselect All */}
      {selectAll && filteredOptions.length > 0 && (
        <Group justify="space-between" mb="xs" wrap="wrap">
          <Button
            variant="subtle"
            size={isMobile ? "sm" : "xs"}
            onClick={handleSelectAll}
            leftSection={allSelected ? <IconX size={isMobile ? 16 : 14} /> : <IconCheck size={isMobile ? 16 : 14} />}
            style={{
              minHeight: isMobile ? '44px' : undefined,
              padding: isMobile ? '8px 16px' : undefined,
            }}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
          {value.length > 0 && (
            <Badge size={isMobile ? "md" : "sm"} variant="light" color="blue">
              {value.length} selected
            </Badge>
          )}
        </Group>
      )}

      {/* Checkbox Grid */}
      <ScrollArea h={maxHeight}>
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
            gap: isMobile ? '16px' : '12px',
          }}
        >
          {filteredOptions.map((option) => (
            <Checkbox
              key={option.value}
              label={
                <Group gap="xs">
                  {option.icon && (
                    <Text size={isMobile ? "md" : "sm"} c={option.color || 'blue'}>
                      {option.icon}
                    </Text>
                  )}
                  <Text size={isMobile ? "md" : "sm"}>{option.label}</Text>
                </Group>
              }
              checked={value.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              disabled={option.disabled}
              size={isMobile ? "md" : "sm"}
              styles={{
                label: {
                  cursor: option.disabled ? 'not-allowed' : 'pointer',
                  padding: isMobile ? '8px' : '4px',
                },
                body: {
                  alignItems: 'center',
                },
                input: {
                  width: isMobile ? '20px' : '18px',
                  height: isMobile ? '20px' : '18px',
                },
              }}
            />
          ))}
        </Box>

        {filteredOptions.length === 0 && (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No options found matching "{searchQuery}"
          </Text>
        )}
      </ScrollArea>

      {/* Error Message */}
      {error && (
        <Text size="xs" c="red" mt="xs">
          {error}
        </Text>
      )}
    </div>
  );
}

