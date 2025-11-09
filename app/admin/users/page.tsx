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

export default function AdminUsersPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Get admin key from environment or prompt
      const adminKey = prompt('Enter admin key:');
      if (!adminKey) {
        setError('Admin key is required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`,
        },
        body: JSON.stringify({
          username,
          password,
          fullName: fullName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      notifications.show({
        title: 'Success',
        message: `User "${username}" created successfully`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      // Reset form
      setUsername('');
      setPassword('');
      setFullName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to create user',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 0' }}>
      <Container size="sm">
        <Card shadow="md" padding="xl" radius="md" withBorder>
          <Stack gap="lg">
            <div>
              <Title order={2}>Create New User</Title>
              <Text c="dimmed" size="sm" mt={4}>
                Create credentials for a new user account
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
                  placeholder="Enter username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />

                <TextInput
                  label="Password"
                  type="password"
                  placeholder="Enter password (min 8 characters)"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  minLength={8}
                />

                <TextInput
                  label="Full Name (Optional)"
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  disabled={!username || !password || password.length < 8}
                >
                  Create User
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

