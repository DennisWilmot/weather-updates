'use client';

import { useState, useEffect } from 'react';
import {
  Stack,
  Title,
  Text,
  Card,
  Group,
  Button,
  Badge,
  Alert,
  Loader,
  Center,
  Divider,
  Box,
  ThemeIcon
} from '@mantine/core';
import { 
  IconRefresh,
  IconAlertTriangle,
  IconExternalLink,
  IconClock
} from '@tabler/icons-react';

interface Tweet {
  id: string;
  author: string;
  handle: string;
  created_at: string;
  text: string;
  url: string;
}

interface NewsFeedProps {
  // Optional props for customization
}

export default function NewsFeed({}: NewsFeedProps) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/live-updates', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTweets(data.tweets || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching tweets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tweets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchTweets, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const tweetTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - tweetTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatJamaicaTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'America/Jamaica',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Stack gap="lg">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="md" color="#1478FF" />
              <Text c="dimmed">Loading news updates...</Text>
            </Stack>
          </Center>
        </Card>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack gap="lg">
        <Alert color="red" title="Error Loading News" icon={<IconAlertTriangle />}>
          {error}
          <Button mt="sm" onClick={fetchTweets} leftSection={<IconRefresh />}>
            Retry
          </Button>
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header Card */}
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ borderColor: '#1478FF' }}>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={2} c="#1478FF">📰 Emergency News Updates</Title>
            <Badge color="blue" variant="light" size="lg">
              {tweets.length} updates
            </Badge>
          </Group>
          
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              {lastUpdated ? (
                <>Last updated: {formatJamaicaTime(lastUpdated.toISOString())}</>
              ) : (
                'Loading...'
              )}
            </Text>
            <Button
              variant="outline"
              size="sm"
              leftSection={<IconRefresh />}
              onClick={fetchTweets}
              loading={loading}
              color="#1478FF"
            >
              Refresh
            </Button>
          </Group>
          
          <Text size="sm" c="dimmed">
            Real-time updates from official sources and emergency services
          </Text>
        </Stack>
      </Card>

      {/* Tweets Feed */}
      {tweets.length === 0 ? (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Center py="xl">
            <Stack align="center" gap="md">
              <ThemeIcon size="xl" color="gray" variant="light">
                <IconClock />
              </ThemeIcon>
              <Text c="dimmed">No recent updates available</Text>
              <Text size="sm" c="dimmed">Check back soon for the latest emergency information</Text>
            </Stack>
          </Center>
        </Card>
      ) : (
        <Stack gap="md">
          {tweets.map((tweet) => (
            <Card key={tweet.id} shadow="sm" padding="md" radius="md" withBorder>
              <Stack gap="sm">
                {/* Tweet Header */}
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Text fw={600} size="sm" c="#1478FF">
                      {tweet.author}
                    </Text>
                    <Text size="xs" c="dimmed">
                      @{tweet.handle}
                    </Text>
                  </Box>
                  <Group gap="xs" align="center">
                    <Text size="xs" c="dimmed">
                      {formatTimeAgo(tweet.created_at)}
                    </Text>
                    <Badge size="xs" variant="light" color="gray">
                      {formatJamaicaTime(tweet.created_at)}
                    </Badge>
                  </Group>
                </Group>

                <Divider />

                {/* Tweet Content */}
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {tweet.text}
                </Text>

                {/* Tweet Footer */}
                <Group justify="space-between" align="center">
                  <Text size="xs" c="dimmed">
                    Tweet ID: {tweet.id}
                  </Text>
                  <Button
                    component="a"
                    href={tweet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="subtle"
                    size="xs"
                    leftSection={<IconExternalLink size={12} />}
                    color="#1478FF"
                  >
                    View on X
                  </Button>
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      {/* Footer Info */}
      <Card shadow="sm" padding="md" radius="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
        <Text size="xs" c="dimmed" ta="center">
          Updates are automatically refreshed every 2 minutes. 
          Only tweets from the last 72 hours are shown for emergency relevance.
        </Text>
      </Card>
    </Stack>
  );
}
