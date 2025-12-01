// app/reset-password/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import {
  Box,
  Container,
  Paper,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Progress,
  Group,
} from '@mantine/core';
import { IconLock, IconMapPin, IconCheck, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasUpperCase, setHasUpperCase] = useState(false);
  const [hasLowerCase, setHasLowerCase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);

  useEffect(() => {
    // Get token from URL
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      toast.error('Invalid or missing reset token');
      setTokenValid(false);
      // Redirect after 2 seconds
      setTimeout(() => router.push('/auth'), 2000);
    } else {
      setToken(tokenFromUrl);
      setTokenValid(true);
    }
  }, [searchParams, router]);

  // Check password strength
  useEffect(() => {
    const minLength = password.length >= 8;
    const upperCase = /[A-Z]/.test(password);
    const lowerCase = /[a-z]/.test(password);
    const number = /[0-9]/.test(password);
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    setHasMinLength(minLength);
    setHasUpperCase(upperCase);
    setHasLowerCase(lowerCase);
    setHasNumber(number);
    setHasSpecialChar(specialChar);

    // Calculate strength
    let strength = 0;
    if (minLength) strength += 20;
    if (upperCase) strength += 20;
    if (lowerCase) strength += 20;
    if (number) strength += 20;
    if (specialChar) strength += 20;

    setPasswordStrength(strength);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!password) {
      toast.error('Please enter a password');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    if (passwordStrength < 60) {
      toast.error('Please create a stronger password');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Resetting password...');

    try {
      // ⭐ Reset password using Better Auth client
      const { data, error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        console.error('Reset error:', error);
        toast.dismiss(toastId);
        toast.error(error.message || 'Failed to reset password');
        return;
      }

      toast.dismiss(toastId);
      toast.success('Password set successfully!');

      // Redirect to login page
      setTimeout(() => {
        router.push('/auth');
      }, 1500);
    } catch (err: any) {
      console.error('Reset exception:', err);
      toast.error('An error occurred while resetting password');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking token
  if (tokenValid === null) {
    return (
      <Box
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a3c 0%, #2d2d5f 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text c="white">Validating reset link...</Text>
      </Box>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <Box
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a3c 0%, #2d2d5f 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container size="xs">
          <Paper radius="lg" p="xl" withBorder>
            <Stack gap="md" align="center">
              <Box
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconX size={32} color="#dc2626" />
              </Box>
              <Title order={2} ta="center">
                Invalid Reset Link
              </Title>
              <Text ta="center" c="dimmed">
                This password reset link is invalid or has expired. Please request a new one.
              </Text>
              <Button onClick={() => router.push('/auth')} fullWidth>
                Back to Login
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

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
              Set Your Password
            </Title>
            <Text c="dimmed" size="sm">
              Create a secure password for your account
            </Text>
          </Box>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <PasswordInput
                label="New Password"
                placeholder="Enter your new password"
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

              {/* Password Strength Indicator */}
              {password && (
                <Box>
                  <Group justify="space-between" mb={5}>
                    <Text size="xs" fw={500}>
                      Password strength
                    </Text>
                    <Text size="xs" c={passwordStrength >= 80 ? 'green' : passwordStrength >= 60 ? 'yellow' : 'red'}>
                      {passwordStrength >= 80 ? 'Strong' : passwordStrength >= 60 ? 'Good' : 'Weak'}
                    </Text>
                  </Group>
                  <Progress
                    value={passwordStrength}
                    color={passwordStrength >= 80 ? 'green' : passwordStrength >= 60 ? 'yellow' : 'red'}
                    size="sm"
                  />
                </Box>
              )}

              {/* Password Requirements */}
              {password && (
                <Paper p="sm" withBorder radius="md" bg="gray.0">
                  <Text size="xs" fw={600} mb="xs" c="gray.7">
                    Password must contain:
                  </Text>
                  <Stack gap={4}>
                    <RequirementItem met={hasMinLength} label="At least 8 characters" />
                    <RequirementItem met={hasUpperCase} label="One uppercase letter" />
                    <RequirementItem met={hasLowerCase} label="One lowercase letter" />
                    <RequirementItem met={hasNumber} label="One number" />
                    <RequirementItem met={hasSpecialChar} label="One special character (!@#$%...)" />
                  </Stack>
                </Paper>
              )}

              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm your new password"
                required
                leftSection={<IconLock size={18} />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                size="md"
                error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : null}
                styles={{
                  input: {
                    '&:focus': {
                      borderColor: '#1a1a3c',
                    },
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                size="md"
                loading={loading}
                disabled={!password || !confirmPassword || password !== confirmPassword || passwordStrength < 60}
                style={{
                  backgroundColor: '#1a1a3c',
                  '&:hover': {
                    backgroundColor: '#2d2d5f',
                  },
                }}
                mt="md"
              >
                Set Password & Continue
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* Footer */}
        <Text ta="center" size="xs" c="dimmed" mt="xl" style={{ color: 'white' }}>
          © 2024 Intellibus. All rights reserved.
        </Text>
      </Container>
    </Box>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <Group gap="xs">
      {met ? (
        <IconCheck size={14} color="#10b981" />
      ) : (
        <IconX size={14} color="#ef4444" />
      )}
      <Text size="xs" c={met ? 'green.7' : 'gray.6'}>
        {label}
      </Text>
    </Group>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Box
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a3c 0%, #2d2d5f 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text c="white">Loading...</Text>
      </Box>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}