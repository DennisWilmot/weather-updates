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
    Loader,
    Center,
} from '@mantine/core';
import {
    IconChevronLeft,
    IconChevronRight,
    IconDownload,
    IconSearch,
    IconX,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import React, { useState, useEffect } from 'react'

interface AuditLog {
    id: string;
    action: string;
    user: string;
    timestamp: string;
    details: string;
    ipAddress: string;
    device: string;
    beforeValue?: any;
    afterValue?: any;
    resourceType?: string;
    resourceId?: string;
    metadata?: any;
}

export default function Audits() {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [auditSearch, setAuditSearch] = useState('');
    const [auditActionFilter, setAuditActionFilter] = useState('all');
    const [auditPage, setAuditPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showLogModalOpened, { open: openLogModal, close: closeLogModal }] = useDisclosure(false);

    // Fetch audit logs from API
    useEffect(() => {
        fetchAuditLogs();
    }, [auditPage, auditSearch, auditActionFilter]);

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: auditPage.toString(),
                limit: '10',
            });

            if (auditSearch) {
                params.append('search', auditSearch);
            }

            if (auditActionFilter !== 'all') {
                params.append('action', auditActionFilter);
            }

            const response = await fetch(`/api/audit-logs?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch audit logs');
            }

            const data = await response.json();
            setAuditLogs(data.logs || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalCount(data.pagination?.total || 0);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Audit log handlers
    const handleExportLogs = async () => {
        try {
            // Fetch all logs for export (without pagination)
            const params = new URLSearchParams({
                page: '1',
                limit: '10000', // Large limit to get all logs
            });

            if (auditSearch) {
                params.append('search', auditSearch);
            }

            if (auditActionFilter !== 'all') {
                params.append('action', auditActionFilter);
            }

            const response = await fetch(`/api/audit-logs?${params.toString()}`);
            const data = await response.json();
            const logs = data.logs || [];

            const csv = 'Action,User,Timestamp,Details,IP Address,Device\n' +
                logs.map((log: AuditLog) =>
                    `"${log.action}","${log.user}","${log.timestamp}","${log.details}","${log.ipAddress}","${log.device}"`
                ).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting logs:', error);
        }
    };

    // Get unique actions for filter dropdown
    const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action))).sort();
    const actionFilterOptions = [
        { value: 'all', label: 'All Actions' },
        ...uniqueActions.map(action => ({ value: action, label: action }))
    ];

    const logsPerPage = 10;

    // Format timestamp for display
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    if (loading && auditLogs.length === 0) {
        return (
            <Center h={400}>
                <Loader size="lg" />
            </Center>
        );
    }

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
                    disabled={loading}
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
                        onChange={(e) => {
                            setAuditSearch(e.currentTarget.value);
                            setAuditPage(1); // Reset to first page on search
                        }}
                        leftSection={<IconSearch size={20} />}
                        radius="md"
                    />
                    <Select
                        value={auditActionFilter}
                        onChange={(value) => {
                            if (value) {
                                setAuditActionFilter(value);
                                setAuditPage(1); // Reset to first page on filter change
                            }
                        }}
                        data={actionFilterOptions}
                        radius="md"
                    />
                </SimpleGrid>
            </Paper>

            {/* Audit logs - Desktop Table */}
            <Paper withBorder shadow="sm" radius="md" visibleFrom="lg">
                {loading ? (
                    <Center p="xl">
                        <Loader />
                    </Center>
                ) : auditLogs.length === 0 ? (
                    <Center p="xl">
                        <Text c="gray.5">No audit logs found</Text>
                    </Center>
                ) : (
                    <>
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
                                    {auditLogs.map(log => (
                                        <Table.Tr
                                            key={log.id}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => {
                                                setSelectedLog(log);
                                                openLogModal();
                                            }}
                                        >
                                            <Table.Td>
                                                <Text size="sm" c="gray.5">{formatTimestamp(log.timestamp)}</Text>
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
                                    Showing {((auditPage - 1) * logsPerPage) + 1} to {Math.min(auditPage * logsPerPage, totalCount)} of {totalCount} logs
                                </Text>
                                <MantinePagination
                                    value={auditPage}
                                    total={totalPages}
                                    onChange={setAuditPage}
                                />
                            </Group>
                        </Box>
                    </>
                )}
            </Paper>

            {/* Audit logs - Mobile Cards */}
            <Stack gap="md" hiddenFrom="lg">
                {loading ? (
                    <Center p="xl">
                        <Loader />
                    </Center>
                ) : auditLogs.length === 0 ? (
                    <Center p="xl">
                        <Text c="gray.5">No audit logs found</Text>
                    </Center>
                ) : (
                    <>
                        {auditLogs.map(log => (
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
                                    <Text size="xs" c="gray.5">{formatTimestamp(log.timestamp)}</Text>
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
                                    Showing {((auditPage - 1) * logsPerPage) + 1} to {Math.min(auditPage * logsPerPage, totalCount)} of {totalCount}
                                </Text>
                                <Group gap="xs">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftSection={<IconChevronLeft size={16} />}
                                        onClick={() => setAuditPage(Math.max(1, auditPage - 1))}
                                        disabled={auditPage === 1 || loading}
                                        radius="md"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        rightSection={<IconChevronRight size={16} />}
                                        onClick={() => setAuditPage(Math.min(totalPages, auditPage + 1))}
                                        disabled={auditPage >= totalPages || loading}
                                        radius="md"
                                    >
                                        Next
                                    </Button>
                                </Group>
                            </Group>
                        </Paper>
                    </>
                )}
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
                                        <Text size="sm" c="gray.9" ff="monospace">{formatTimestamp(selectedLog.timestamp)}</Text>
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
                                        <Text fw={500} c="gray.9" ff="monospace" style={{ whiteSpace: 'pre-wrap' }}>
                                            {typeof selectedLog.beforeValue === 'object'
                                                ? JSON.stringify(selectedLog.beforeValue, null, 2)
                                                : String(selectedLog.beforeValue)}
                                        </Text>
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
                                        <Text fw={500} c="gray.9" ff="monospace" style={{ whiteSpace: 'pre-wrap' }}>
                                            {typeof selectedLog.afterValue === 'object'
                                                ? JSON.stringify(selectedLog.afterValue, null, 2)
                                                : String(selectedLog.afterValue)}
                                        </Text>
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
