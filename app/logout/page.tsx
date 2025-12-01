"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container, Paper, Stack, Text, Loader, Box } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        async function logout() {
            try {
                // Call Better Auth built-in sign-out API
                await fetch("/api/auth/sign-out", {
                    method: "POST",
                });
                // Clear the better-auth cookie manually (extra safety)
                document.cookie =
                    "better-auth.session_token=; path=/; max-age=0; secure; samesite=lax";
                // Redirect to login page
                router.push("/auth");
            } catch (err) {
                console.error("Logout failed:", err);
                router.push("/auth");
            }
        }
        logout();
    }, [router]);

    return (
        <Container
            size="xs"
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Paper
                p="xl"
                withBorder
                radius="md"
                style={{
                    backgroundColor: 'white',
                    width: '100%',
                }}
            >
                <Stack align="center" gap="lg" py="md">
                    {/* Animated Icon Container */}
                    <Box
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            backgroundColor: 'var(--mantine-color-blue-1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'pulse 2s ease-in-out infinite',
                        }}
                    >
                        <IconLogout
                            size={36}
                            color="var(--mantine-color-blue-6)"
                            style={{
                                animation: 'slideOut 1.5s ease-in-out infinite',
                            }}
                        />
                    </Box>

                    {/* Spinner */}
                    <Loader size="md" />

                    {/* Text */}
                    <div style={{ textAlign: 'center' }}>
                        <Text size="lg" fw={500} mb={4}>
                            Logging out
                        </Text>
                        <Text size="sm" c="dimmed">
                            Please wait while we sign you out...
                        </Text>
                    </div>
                </Stack>
            </Paper>

            {/* CSS Animations */}
            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.05);
                        opacity: 0.8;
                    }
                }

                @keyframes slideOut {
                    0%, 100% {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    50% {
                        transform: translateX(8px);
                        opacity: 0.6;
                    }
                }
            `}</style>
        </Container>
    );
}