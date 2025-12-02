'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import {
    Box,
    Container,
    Paper,
    TextInput,
    PasswordInput,
    Button,
    Title,
    Text,
    Anchor,
    Divider,
    Stack,
    Group,
} from '@mantine/core';
import { IconLock, IconUser, IconMapPin } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading('Logging in...');

        try {
            // ⭐ Use the Better Auth client - it handles the correct endpoint
            const { data, error } = await authClient.signIn.email({
                email,
                password,
                callbackURL: '/', // Redirect after successful login
            });

            if (error) {
                console.error('Login error:', error);
                toast.dismiss(toastId);
                toast.error(error.message || 'Invalid email or password');
                return;
            }

            if (data) {
                toast.dismiss(toastId);
                console.log('data', data);
                toast.success('Logged in successfully!');
                // The client will handle the redirect based on callbackURL
                router.push('/');
                // router.refresh(); // Refresh to update session state
            }
        } catch (err: any) {
            console.error('Login exception:', err);
            toast.dismiss(toastId);
            toast.error('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1a1a3c 0%, #2d2d5f 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <Container size="xs" style={{ width: '100%' }}>
                <Paper
                    radius="lg"
                    p="xl"
                    withBorder
                    shadow="xl"
                    style={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                    }}
                >
                    {/* Header */}
                    <Box mb="xl" style={{ textAlign: 'center' }}>
                        <Box
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                backgroundColor: '#1a1a3c',
                                marginBottom: '16px',
                            }}
                        >
                            <IconMapPin size={32} color="#60a5fa" />
                        </Box>
                        <Title order={1} style={{ color: '#1a1a3c', marginBottom: '8px' }}>
                            Welcome Back
                        </Title>
                        <Text c="dimmed" size="sm">
                            Sign in to access your dashboard
                        </Text>
                    </Box>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit}>
                        <Stack gap="md">
                            <TextInput
                                label="Email"
                                placeholder="Enter your Email"
                                required
                                type="email"
                                leftSection={<IconUser size={18} />}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                size="md"
                                styles={{
                                    input: {
                                        '&:focus': {
                                            borderColor: '#1a1a3c',
                                        },
                                    },
                                }}
                            />

                            <PasswordInput
                                label="Password"
                                placeholder="Enter your password"
                                required
                                leftSection={<IconLock size={18} />}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                size="md"
                                styles={{
                                    input: {
                                        '&:focus': {
                                            borderColor: '#1a1a3c',
                                        },
                                    },
                                }}
                            />

                            <Group justify="space-between" mt="xs">
                                <Anchor
                                    component="button"
                                    type="button"
                                    c="dimmed"
                                    size="sm"
                                    onClick={() => {
                                        // TODO: Implement forgot password
                                        console.log('Forgot password clicked');
                                    }}
                                >
                                    Forgot password?
                                </Anchor>
                            </Group>

                            <Button
                                type="submit"
                                fullWidth
                                size="md"
                                loading={loading}
                                style={{
                                    backgroundColor: '#1a1a3c',
                                    '&:hover': {
                                        backgroundColor: '#2d2d5f',
                                    },
                                }}
                                mt="md"
                            >
                                Sign In
                            </Button>
                        </Stack>
                    </form>

                    {/* Divider */}
                    <Divider label="or" labelPosition="center" my="lg" />

                    {/* Sign Up Link */}
                    <Text ta="center" size="sm" c="dimmed">
                        Don't have an account?{' '}
                        <Anchor
                            component="button"
                            type="button"
                            fw={500}
                            onClick={() => router.push('/auth')}
                            style={{ color: '#1a1a3c' }}
                        >
                            Request Account
                        </Anchor>
                    </Text>
                </Paper>

                {/* Footer */}
                <Text ta="center" size="xs" c="dimmed" mt="xl" style={{ color: 'white' }}>
                    © 2024 Intellibus. All rights reserved.
                </Text>
            </Container>
        </Box>
    );
}