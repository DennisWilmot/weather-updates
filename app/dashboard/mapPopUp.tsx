/**
 * Map Popup Component - Shows details when clicking on map features
 */

import { Box, Text, Stack, Group, Badge, Divider } from '@mantine/core';
import { IconUser, IconMapPin, IconBox, IconPhone, IconMail, IconBuilding } from '@tabler/icons-react';

export interface PopupProps {
    properties: Record<string, any>;
    layer: 'people' | 'places' | 'assets';
}

export function MapPopup({ properties, layer }: PopupProps) {
    const getIcon = () => {
        switch (layer) {
            case 'people':
                return <IconUser size={20} color="#FF6B6B" />;
            case 'places':
                return <IconMapPin size={20} color="#4ECDC4" />;
            case 'assets':
                return <IconBox size={20} color="#45B7D1" />;
        }
    };

    const getTypeLabel = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <Box style={{ minWidth: 250, maxWidth: 350 }}>
            <Group gap="xs" mb="sm">
                {getIcon()}
                <Text fw={600} size="lg">
                    {properties.name}
                </Text>
            </Group>

            <Stack gap="xs">
                <Badge color={
                    layer === 'people' ? 'red' :
                        layer === 'places' ? 'teal' :
                            'blue'
                } size="sm">
                    {getTypeLabel(properties.type)}
                </Badge>

                {/* People-specific fields */}
                {layer === 'people' && (
                    <>
                        {properties.contactName && (
                            <Group gap="xs">
                                <IconUser size={16} />
                                <Text size="sm">{properties.contactName}</Text>
                            </Group>
                        )}
                        {properties.contactPhone && (
                            <Group gap="xs">
                                <IconPhone size={16} />
                                <Text size="sm">{properties.contactPhone}</Text>
                            </Group>
                        )}
                        {properties.contactEmail && (
                            <Group gap="xs">
                                <IconMail size={16} />
                                <Text size="sm" style={{ wordBreak: 'break-word' }}>
                                    {properties.contactEmail}
                                </Text>
                            </Group>
                        )}
                        {properties.organization && (
                            <Group gap="xs">
                                <IconBuilding size={16} />
                                <Text size="sm">{properties.organization}</Text>
                            </Group>
                        )}
                    </>
                )}

                {/* Places-specific fields */}
                {layer === 'places' && (
                    <>
                        {properties.address && (
                            <Group gap="xs">
                                <IconMapPin size={16} />
                                <Text size="sm">{properties.address}</Text>
                            </Group>
                        )}
                        {properties.maxCapacity && (
                            <Text size="sm">
                                <strong>Capacity:</strong> {properties.maxCapacity}
                            </Text>
                        )}
                        {properties.description && (
                            <Text size="sm" c="dimmed">
                                {properties.description}
                            </Text>
                        )}
                        {properties.verified && (
                            <Badge color="green" size="xs" variant="light">
                                Verified
                            </Badge>
                        )}
                    </>
                )}

                {/* Assets-specific fields */}
                {layer === 'assets' && (
                    <>
                        {properties.serialNumber && (
                            <Text size="sm">
                                <strong>Serial:</strong> {properties.serialNumber}
                            </Text>
                        )}
                        {properties.status && (
                            <Badge
                                color={
                                    properties.status === 'available' ? 'green' :
                                        properties.status === 'in_use' ? 'yellow' :
                                            properties.status === 'maintenance' ? 'orange' :
                                                'red'
                                }
                                size="sm"
                            >
                                {getTypeLabel(properties.status)}
                            </Badge>
                        )}
                        {properties.currentLocation && (
                            <Group gap="xs">
                                <IconMapPin size={16} />
                                <Text size="sm">{properties.currentLocation}</Text>
                            </Group>
                        )}
                        {properties.organization && (
                            <Group gap="xs">
                                <IconBuilding size={16} />
                                <Text size="sm">{properties.organization}</Text>
                            </Group>
                        )}
                    </>
                )}

                {/* Location info (common to all) */}
                {(properties.parishName || properties.communityName) && (
                    <>
                        <Divider my="xs" />
                        {properties.communityName && (
                            <Text size="xs" c="dimmed">
                                {properties.communityName}
                                {properties.parishName && `, ${properties.parishName}`}
                            </Text>
                        )}
                        {!properties.communityName && properties.parishName && (
                            <Text size="xs" c="dimmed">
                                {properties.parishName}
                            </Text>
                        )}
                    </>
                )}
            </Stack>
        </Box>
    );
}

/**
 * Generate HTML string for MapLibre popup
 */
export function generatePopupHTML(properties: Record<string, any>, layer: 'people' | 'places' | 'assets'): string {
    const getTypeLabel = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const color = layer === 'people' ? '#FF6B6B' : layer === 'places' ? '#4ECDC4' : '#45B7D1';

    let html = `
    <div style="padding: 12px; min-width: 250px; max-width: 350px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 20px; height: 20px; background: ${color}; border-radius: 50%;"></div>
        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${properties.name || 'Unknown'}</h3>
      </div>
      
      <div style="margin-bottom: 8px;">
        <span style="background: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          ${getTypeLabel(properties.type || 'unknown')}
        </span>
      </div>
  `;

    // People-specific
    if (layer === 'people') {
        if (properties.contactName) {
            html += `<div style="margin: 6px 0; font-size: 14px;">👤 ${properties.contactName}</div>`;
        }
        if (properties.contactPhone) {
            html += `<div style="margin: 6px 0; font-size: 14px;">📞 ${properties.contactPhone}</div>`;
        }
        if (properties.contactEmail) {
            html += `<div style="margin: 6px 0; font-size: 14px; word-break: break-word;">✉️ ${properties.contactEmail}</div>`;
        }
        if (properties.organization) {
            html += `<div style="margin: 6px 0; font-size: 14px;">🏢 ${properties.organization}</div>`;
        }
    }

    // Places-specific
    if (layer === 'places') {
        if (properties.address) {
            html += `<div style="margin: 6px 0; font-size: 14px;">📍 ${properties.address}</div>`;
        }
        if (properties.maxCapacity) {
            html += `<div style="margin: 6px 0; font-size: 14px;"><strong>Capacity:</strong> ${properties.maxCapacity}</div>`;
        }
        if (properties.description) {
            html += `<div style="margin: 6px 0; font-size: 13px; color: #666;">${properties.description}</div>`;
        }
        if (properties.verified) {
            html += `<div style="margin: 6px 0;"><span style="background: #51cf66; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">✓ Verified</span></div>`;
        }
    }

    // Assets-specific
    if (layer === 'assets') {
        if (properties.serialNumber) {
            html += `<div style="margin: 6px 0; font-size: 14px;"><strong>Serial:</strong> ${properties.serialNumber}</div>`;
        }
        if (properties.status) {
            const statusColors: Record<string, string> = {
                available: '#51cf66',
                in_use: '#ffd43b',
                maintenance: '#ff922b',
                retired: '#868e96',
            };
            const statusColor = statusColors[properties.status] || '#868e96';
            html += `<div style="margin: 6px 0;"><span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${getTypeLabel(properties.status)}</span></div>`;
        }
        if (properties.currentLocation) {
            html += `<div style="margin: 6px 0; font-size: 14px;">📍 ${properties.currentLocation}</div>`;
        }
        if (properties.organization) {
            html += `<div style="margin: 6px 0; font-size: 14px;">🏢 ${properties.organization}</div>`;
        }
    }

    // Location (common)
    if (properties.communityName || properties.parishName) {
        html += `<div style="border-top: 1px solid #e9ecef; margin-top: 12px; padding-top: 8px;">`;
        if (properties.communityName) {
            html += `<div style="font-size: 12px; color: #868e96;">${properties.communityName}${properties.parishName ? `, ${properties.parishName}` : ''}</div>`;
        } else if (properties.parishName) {
            html += `<div style="font-size: 12px; color: #868e96;">${properties.parishName}</div>`;
        }
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}