'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Redirect to maps page
      router.push('/maps');
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

