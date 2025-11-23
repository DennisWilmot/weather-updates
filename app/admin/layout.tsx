"use client";

import AdminNavigation from "./nav";
import { Box, Container } from '@mantine/core';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <Box>
            <AdminNavigation />
            <Box bg="#f8f9fa" style={{ minHeight: '100vh' }}>
                <Container size="xl" py="md">
                    {children}
                </Container>
            </Box>
        </Box>
    );
}
