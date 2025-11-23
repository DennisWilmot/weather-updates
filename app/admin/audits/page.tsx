'use client'
import {
  Box,
  Stack,
  Group,
  Paper,
  Button,
  Text,
  Title,
  TextInput,
  Select,
  Table,
  Modal,
  Pagination as MantinePagination,
  SimpleGrid,
} from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import React, { useState } from 'react'

interface AuditLog {
    id: string;
    action: string;
    user: string;
    timestamp: string;
    details: string;
    ipAddress: string;
    device: string;
    beforeValue?: string;
    afterValue?: string;
}

const mockAuditLogs: AuditLog[] = [
    { id: '1', action: 'User Login', user: 'John Doe', timestamp: '2025-11-19 10:30:15', details: 'Successful login', ipAddress: '192.168.1.1', device: 'Chrome on Windows' },
    { id: '2', action: 'User Updated', user: 'Admin', timestamp: '2025-11-19 09:15:22', details: 'Updated user role', ipAddress: '192.168.1.5', device: 'Firefox on Mac', beforeValue: 'Editor', afterValue: 'Admin' },
    { id: '3', action: 'User Suspended', user: 'Admin', timestamp: '2025-11-18 16:45:10', details: 'Suspended user account', ipAddress: '192.168.1.5', device: 'Chrome on Windows' },
];

export default function Audits() {
    const [auditLogs] = useState<AuditLog[]>(mockAuditLogs);
    const [auditSearch, setAuditSearch] = useState('');
    const [auditActionFilter, setAuditActionFilter] = useState('all');
    const [auditPage, setAuditPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showLogModalOpened, { open: openLogModal, close: closeLogModal }] = useDisclosure(false);

    // Audit log handlers
    const handleExportLogs = () => {
        const csv = 'Action,User,Timestamp,IP Address,Device\n' +
            filteredAuditLogs.map(log =>
                `${log.action},${log.user},${log.timestamp},${log.ipAddress},${log.device}`
            ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_logs.csv';
        a.click();
    };

    const filteredAuditLogs = auditLogs.filter(log => {
        const matchesSearch = log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
            log.user.toLowerCase().includes(auditSearch.toLowerCase());
        const matchesAction = auditActionFilter === 'all' || log.action === auditActionFilter;
        return matchesSearch && matchesAction;
    });

    // Pagination
    const logsPerPage = 5;
    const paginatedLogs = filteredAuditLogs.slice((auditPage - 1) * logsPerPage, auditPage * logsPerPage);
    const pageCount = Math.ceil(filteredAuditLogs.length / logsPerPage);

    return (
        <Stack gap="md">
            <Group justify="space-between" align="center" wrap="wrap">
                <Title order={1} fw={700} c="gray.9" style={{ letterSpacing: '-0.02em' }}>
                    Audit Logs
                </Title>
                <Button
                    onClick={handleExportLogs}
                    leftSection={<IconDownload size={20} />}
                    style={{ backgroundColor: '#1a1a3c' }}
                    radius="md"
                >
                    Export CSV
                </Button>
            </Group>

            {/* Search and filters */}
            <Paper withBorder shadow="sm" radius="md" p="md">
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    <TextInput
                        placeholder="Search logs..."
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.currentTarget.value)}
                        leftSection={<IconSearch size={20} />}
                        radius="md"
                    />
                    <Select
                        value={auditActionFilter}
                        onChange={(value) => value && setAuditActionFilter(value)}
                        data={[
                            { value: 'all', label: 'All Actions' },
                            { value: 'User Login', label: 'User Login' },
                            { value: 'User Updated', label: 'User Updated' },
                            { value: 'User Suspended', label: 'User Suspended' },
                        ]}
                        radius="md"
                    />
                </SimpleGrid>
            </Paper>

            {/* Audit logs - Desktop Table */}
            <Paper withBorder shadow="sm" radius="md" visibleFrom="lg">
                <Table.ScrollContainer minWidth={800}>
                    <Table highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Timestamp</Table.Th>
                                <Table.Th>Action</Table.Th>
                                <Table.Th>User</Table.Th>
                                <Table.Th>Details</Table.Th>
                                <Table.Th>IP Address</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {paginatedLogs.map(log => (
                                <Table.Tr
                                    key={log.id}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setSelectedLog(log);
                                        openLogModal();
                                    }}
                                >
                                    <Table.Td>
                                        <Text size="sm" c="gray.5">{log.timestamp}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" fw={500} c="gray.9">{log.action}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="gray.5">{log.user}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="gray.5">{log.details}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="gray.5">{log.ipAddress}</Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>

                {/* Desktop Pagination */}
                <Box p="md" style={{ borderTop: '1px solid #e9ecef', backgroundColor: '#f9fafb' }}>
                    <Group justify="space-between" align="center">
                        <Text size="sm" c="gray.7">
                            Showing {((auditPage - 1) * logsPerPage) + 1} to {Math.min(auditPage * logsPerPage, filteredAuditLogs.length)} of {filteredAuditLogs.length} logs
                        </Text>
                        <MantinePagination
                            value={auditPage}
                            total={pageCount}
                            onChange={setAuditPage}
                        />
                    </Group>
                </Box>
            </Paper>

            {/* Audit logs - Mobile Cards */}
            <Stack gap="md" hiddenFrom="lg">
                {paginatedLogs.map(log => (
                    <Paper
                        key={log.id}
                        withBorder
                        shadow="sm"
                        radius="md"
                        p="md"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setSelectedLog(log);
                            openLogModal();
                        }}
                    >
                        <Group justify="space-between" align="flex-start" mb="sm">
                            <Text fw={600} c="gray.9">{log.action}</Text>
                            <Text size="xs" c="gray.5">{log.timestamp}</Text>
                        </Group>
                        <Stack gap="xs">
                            <Group justify="space-between">
                                <Text size="sm" c="gray.5">User:</Text>
                                <Text size="sm" fw={500} c="gray.9">{log.user}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm" c="gray.5">IP:</Text>
                                <Text size="sm" c="gray.9">{log.ipAddress}</Text>
                            </Group>
                            <Box pt="xs" style={{ borderTop: '1px solid #e9ecef' }}>
                                <Text size="sm" c="gray.7">{log.details}</Text>
                            </Box>
                        </Stack>
                    </Paper>
                ))}

                {/* Mobile Pagination */}
                <Paper withBorder shadow="sm" radius="md" p="md">
                    <Group justify="space-between" align="center" wrap="wrap">
                        <Text size="sm" c="gray.7" ta="center" style={{ flex: 1 }}>
                            Showing {((auditPage - 1) * logsPerPage) + 1} to {Math.min(auditPage * logsPerPage, filteredAuditLogs.length)} of {filteredAuditLogs.length}
                        </Text>
                        <Group gap="xs">
                            <Button
                                variant="outline"
                                size="sm"
                                leftSection={<IconChevronLeft size={16} />}
                                onClick={() => setAuditPage(Math.max(1, auditPage - 1))}
                                disabled={auditPage === 1}
                                radius="md"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                rightSection={<IconChevronRight size={16} />}
                                onClick={() => setAuditPage(Math.min(pageCount, auditPage + 1))}
                                disabled={auditPage >= pageCount}
                                radius="md"
                            >
                                Next
                            </Button>
                        </Group>
                    </Group>
                </Paper>
            </Stack>

            {/* Modal */}
            <Modal
                opened={showLogModalOpened}
                onClose={() => {
                    closeLogModal();
                    setSelectedLog(null);
                }}
                title={
                    <Box>
                        <Title order={2} fw={700} c="white" mb="xs">
                            Audit Log Details
                        </Title>
                        <Text size="sm" c="blue.1">Complete activity information</Text>
                    </Box>
                }
                size="xl"
                centered
                styles={{
                    header: { backgroundColor: '#1e40af' },
                    title: { color: 'white' },
                }}
            >
                {selectedLog && (
                    <Stack gap="md">
                        {/* Primary Info Cards */}
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <Paper withBorder radius="md" p="md" bg="blue.0">
                                <Group gap="xs" mb="xs">
                                    <Box
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: '#3b82f6',
                                        }}
                                    />
                                    <Text size="xs" fw={600} c="blue.9" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Action
                                    </Text>
                                </Group>
                                <Text size="lg" fw={700} c="gray.9">{selectedLog.action}</Text>
                            </Paper>
                            <Paper withBorder radius="md" p="md" bg="purple.0">
                                <Group gap="xs" mb="xs">
                                    <Box
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: '#a855f7',
                                        }}
                                    />
                                    <Text size="xs" fw={600} c="purple.9" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        User
                                    </Text>
                                </Group>
                                <Text size="lg" fw={700} c="gray.9">{selectedLog.user}</Text>
                            </Paper>
                        </SimpleGrid>

                        {/* Secondary Info */}
                        <Paper withBorder radius="md" p="md" bg="gray.0">
                            <Stack gap="md">
                                <Box>
                                    <Text size="xs" fw={600} c="gray.5" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} mb="xs">
                                        Timestamp
                                    </Text>
                                    <Paper withBorder radius="md" p="sm" bg="white">
                                        <Text size="sm" c="gray.9" ff="monospace">{selectedLog.timestamp}</Text>
                                    </Paper>
                                </Box>
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                    <Box>
                                        <Text size="xs" fw={600} c="gray.5" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} mb="xs">
                                            IP Address
                                        </Text>
                                        <Paper withBorder radius="md" p="sm" bg="white">
                                            <Text size="sm" c="gray.9" ff="monospace">{selectedLog.ipAddress}</Text>
                                        </Paper>
                                    </Box>
                                    <Box>
                                        <Text size="xs" fw={600} c="gray.5" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} mb="xs">
                                            Device
                                        </Text>
                                        <Paper withBorder radius="md" p="sm" bg="white">
                                            <Text size="sm" c="gray.9">{selectedLog.device}</Text>
                                        </Paper>
                                    </Box>
                                </SimpleGrid>
                            </Stack>
                        </Paper>

                        {/* Details */}
                        <Paper withBorder radius="md" p="md" bg="orange.0">
                            <Group gap="xs" mb="sm">
                                <Box
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: '#f59e0b',
                                    }}
                                />
                                <Text size="xs" fw={600} c="orange.9" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Details
                                </Text>
                            </Group>
                            <Text c="gray.9">{selectedLog.details}</Text>
                        </Paper>

                        {/* Before/After Values */}
                        {selectedLog.beforeValue && selectedLog.afterValue && (
                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                <Paper withBorder radius="md" p="md" bg="red.0" style={{ borderWidth: 2, borderColor: '#fca5a5' }}>
                                    <Group gap="xs" mb="sm">
                                        <IconX size={16} color="#dc2626" />
                                        <Text size="xs" fw={600} c="red.7" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Before Value
                                        </Text>
                                    </Group>
                                    <Paper bg="white" p="md" radius="md" style={{ opacity: 0.6 }}>
                                        <Text fw={500} c="gray.9">{selectedLog.beforeValue}</Text>
                                    </Paper>
                                </Paper>
                                <Paper withBorder radius="md" p="md" bg="green.0" style={{ borderWidth: 2, borderColor: '#86efac' }}>
                                    <Group gap="xs" mb="sm">
                                        <IconX size={16} color="#16a34a" style={{ transform: 'rotate(45deg)' }} />
                                        <Text size="xs" fw={600} c="green.7" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            After Value
                                        </Text>
                                    </Group>
                                    <Paper bg="white" p="md" radius="md" style={{ opacity: 0.6 }}>
                                        <Text fw={500} c="gray.9">{selectedLog.afterValue}</Text>
                                    </Paper>
                                </Paper>
                            </SimpleGrid>
                        )}
                    </Stack>
                )}
            </Modal>
        </Stack>
    )
}
