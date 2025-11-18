'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Title,
  Box,
  Button,
  TextInput,
  Stack,
  Card,
  Alert,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { signIn } from '@/lib/auth-client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get redirect URL from query params
  const redirectTo = searchParams.get('redirect') || '/maps';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Convert username to email format for Better Auth
      const email = `${username}@system.local`;

      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Login failed');
      }

      notifications.show({
        title: 'Success',
        message: 'Logged in successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      // CRITICAL FIX: Wait for session to be available before redirect
      // Better Auth's signIn sets the cookie via HTTP response headers, but we need to ensure
      // the cookie is persisted and the session can be fetched before redirecting
      
      // Refresh router to ensure server components pick up the new session state
      router.refresh();
      
      // Wait longer to ensure cookie is set and session can be fetched
      // The cookie is set via HTTP-only Set-Cookie header, so we need to give the browser
      // time to persist it before redirecting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now redirect - the cookie should be set and available
      // Using window.location.href ensures a full page reload that picks up the session cookie
      window.location.href = redirectTo;
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
      notifications.show({
        title: 'Error',
        message: err.message || 'Login failed',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0f0f23', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <Container size="sm" style={{ width: '100%' }}>
        <Card shadow="md" padding="xl" radius="md" withBorder style={{ backgroundColor: 'white' }}>
          <Stack gap="lg">
            <div>
              <Title order={2}>Login</Title>
              <Text c="dimmed" size="sm" mt={4}>
                Enter your username and password to continue
              </Text>
            </div>

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label="Username"
                  placeholder="Enter your username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />

                <TextInput
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  disabled={!username || !password}
                >
                  Login
                </Button>
              </Stack>
            </form>

            <Button
              variant="subtle"
              onClick={() => router.push('/')}
              fullWidth
            >
              Back to Home
            </Button>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Box style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0f0f23', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <Text c="white">Loading...</Text>
      </Box>
    }>
      <LoginForm />
    </Suspense>
  );
}

