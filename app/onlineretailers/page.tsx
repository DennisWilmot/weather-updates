'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Stack,
  Title,
  Text,
  Box,
  Center,
  Loader,
  Group,
  Button,
  Burger,
  Drawer,
  Flex,
  Card,
  Grid,
  Badge,
  Anchor,
  Alert,
  SegmentedControl,
  Modal,
  TextInput,
  Textarea,
  FileInput
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPhone, IconExternalLink, IconShoppingCart, IconGrid3x3, IconList, IconPlus, IconPhoto } from '@tabler/icons-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';

interface Retailer {
  id: string;
  name: string;
  websiteUrl: string;
  phoneNumber: string | null;
  description: string | null;
  logoUrl: string | null;
  verified: boolean;
  status: string;
  createdAt: string;
}

export default function OnlineRetailersPage() {
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [submitModalOpened, { open: openSubmitModal, close: closeSubmitModal }] = useDisclosure(false);
  const [successModalOpened, { open: openSuccessModal, close: closeSuccessModal }] = useDisclosure(false);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    phoneNumber: '',
    description: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch retailers
  const { data: retailersData, isLoading, error, refetch } = useQuery({
    queryKey: ['online-retailers'],
    queryFn: async () => {
      const response = await fetch('/api/online-retailers');
      if (!response.ok) throw new Error('Failed to fetch retailers');
      return response.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  const retailers: Retailer[] = retailersData?.data || [];

  const handleSubmitRetailer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.websiteUrl.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please fill in the required fields (Name and Website URL)',
        color: 'red',
        autoClose: 3000
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Upload image if provided
      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        try {
          const fileName = `${Date.now()}-${imageFile.name}`;
          const { data, error: uploadError } = await supabase.storage
            .from('retailers')
            .upload(fileName, imageFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('retailers')
            .getPublicUrl(fileName);
          
          uploadedImageUrl = publicUrl;
        } catch (uploadErr) {
          notifications.show({
            title: 'Image Upload Error',
            message: `Failed to upload image: ${uploadErr instanceof Error ? uploadErr.message : 'Unknown error'}. Continuing without image...`,
            color: 'orange',
            autoClose: 5000
          });
          // Continue without image rather than failing the entire submission
        }
      }

      const response = await fetch('/api/online-retailers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          websiteUrl: formData.websiteUrl.trim(),
          phoneNumber: formData.phoneNumber.trim() || null,
          description: formData.description.trim() || null,
          logoUrl: uploadedImageUrl || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit retailer');
      }

      // Reset form
      setFormData({
        name: '',
        websiteUrl: '',
        phoneNumber: '',
        description: ''
      });
      setImageFile(null);
      setImagePreview(null);

      closeSubmitModal();
      openSuccessModal();
      
      // Invalidate and refetch retailers query
      queryClient.invalidateQueries({ queryKey: ['online-retailers'] });
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Submission Error',
        message: error instanceof Error ? error.message : 'Failed to submit retailer. Please try again.',
        color: 'red',
        autoClose: 5000
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  return (
    <>
      {/* Header Navbar - Same as other pages */}
      <Box 
        style={{ 
          backgroundColor: '#0f0f23', 
          borderBottom: '2px solid #1478FF',
          height: '14.28vh',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Box style={{ width: '100%', paddingLeft: 'var(--mantine-spacing-md)', paddingRight: 'var(--mantine-spacing-md)' }}>
          <Flex align="center" justify="space-between" gap="lg" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Left side - Logo and Title */}
            <Group gap="md" visibleFrom="sm" style={{ flex: '0 0 auto' }}>
              <Image 
                src="/White_Icon_Blue_Bkg-removebg-preview.png" 
                alt="Intellibus" 
                width={40} 
                height={40}
                style={{ objectFit: 'contain' }}
              />
              <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Title order={1} c="white" fw={800} size="xl" style={{ cursor: 'pointer' }}>
                  Hurricane Response
                </Title>
              </Link>
            </Group>

            {/* Mobile Logo and Title */}
            <Group gap="xs" hiddenFrom="sm" style={{ flex: '1 1 auto', justifyContent: 'center' }}>
              <Image 
                src="/White_Icon_Blue_Bkg-removebg-preview.png" 
                alt="Intellibus" 
                width={32} 
                height={32}
                style={{ objectFit: 'contain' }}
              />
              <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Title order={1} c="white" fw={800} size="lg" style={{ cursor: 'pointer' }}>
                  Hurricane Response
                </Title>
              </Link>
            </Group>
            
            {/* Right side - Navigation Tabs */}
            <Group gap="xs" style={{ flex: '0 0 auto' }}>
              <Burger
                opened={opened}
                onClick={open}
                color="white"
                size="sm"
                aria-label="Toggle navigation"
                hiddenFrom="sm"
              />
              
              <Group gap="xs" visibleFrom="sm">
               
                <Button
                  variant="outline"
                  color="electricBlue"
                  size="sm"
                  onClick={() => router.push('/')}
                  leftSection="📢"
                >
                  Report
                </Button>
                <Button
                  variant="outline"
                  color="coral"
                  size="sm"
                  onClick={() => router.push('/')}
                  leftSection="📞"
                >
                  Contacts
                </Button>
                <Button
                  variant="filled"
                  color="yellow"
                  size="sm"
                  leftSection="🛒"
                >
                  Online Retailers
                </Button>
              </Group>
            </Group>
          </Flex>
        </Box>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        title="Navigation"
        position="left"
        size="sm"
        hiddenFrom="sm"
        styles={{
          content: {
            backgroundColor: '#0f0f23',
            color: 'white'
          },
          header: {
            backgroundColor: '#0f0f23',
            borderBottom: '1px solid #1478FF'
          },
          title: {
            color: 'white'
          }
        }}
      >
        <Stack gap="md" mt="md">
          
          <Button
            variant="subtle"
            color="electricBlue"
            fullWidth
            onClick={() => { router.push('/'); close(); }}
            leftSection="📢"
          >
            Report Update
          </Button>
          <Button
            variant="subtle"
            color="coral"
            fullWidth
            onClick={() => { router.push('/'); close(); }}
            leftSection="📞"
          >
            Emergency Contacts
          </Button>
          <Button
            variant="filled"
            color="yellow"
            fullWidth
            leftSection="🛒"
            onClick={close}
          >
            Online Retailers
          </Button>
        </Stack>
      </Drawer>

      {/* Main Content */}
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start">
            <Box style={{ flex: 1 }}>
              <Title order={2} mb="xs">Online Retailers</Title>
              <Text c="dimmed" size="sm">
                For people who want to help but are unable to due to location constraints, you can buy online at these stores and have goods delivered to those in need.
              </Text>
            </Box>
            <Group gap="sm">
              <SegmentedControl
                value={viewMode}
                onChange={(value) => setViewMode(value as 'grid' | 'list')}
                data={[
                  { label: 'Grid', value: 'grid' },
                  { label: 'List', value: 'list' }
                ]}
              />
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={openSubmitModal}
                color="blue"
              >
                Submit Retailer
              </Button>
            </Group>
          </Group>

          {isLoading ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <Loader size="lg" color="blue" />
                <Text c="dimmed">Loading retailers...</Text>
              </Stack>
            </Center>
          ) : error ? (
            <Alert color="red" title="Error">
              Failed to load retailers. Please try again later.
            </Alert>
          ) : retailers.length === 0 ? (
            <Alert color="yellow" title="No Retailers">
              No retailers available at this time.
            </Alert>
          ) : viewMode === 'grid' ? (
            <Grid>
              {retailers.map((retailer) => (
                <Grid.Col key={retailer.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <RetailerCard retailer={retailer} />
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            <Stack gap="md">
              {retailers.map((retailer) => (
                <RetailerListItem key={retailer.id} retailer={retailer} />
              ))}
            </Stack>
          )}
        </Stack>
      </Container>

      {/* Submit Retailer Modal */}
      <Modal
        opened={submitModalOpened}
        onClose={closeSubmitModal}
        title="Submit Online Retailer"
        centered
        size="md"
      >
        <form onSubmit={handleSubmitRetailer}>
          <Stack gap="md">
            <TextInput
              label="Retailer Name"
              placeholder="e.g., Store Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextInput
              label="Website URL"
              placeholder="https://example.com"
              required
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
            />
            <TextInput
              label="Phone Number (Optional)"
              placeholder="(876) 123-4567"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
            <Textarea
              label="Description (Optional)"
              placeholder="Brief description of the retailer..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <FileInput
              label="Logo/Thumbnail Image (Optional)"
              placeholder="Upload retailer logo"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              leftSection={<IconPhoto size={16} />}
              value={imageFile}
              onChange={handleImageChange}
              clearable
            />
            {imagePreview && (
              <Box style={{ width: '100%', maxWidth: '200px', margin: '0 auto' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}
                />
              </Box>
            )}
            <Group justify="flex-end" gap="xs">
              <Button variant="outline" onClick={closeSubmitModal} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Submit
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Success Modal */}
      <Modal
        opened={successModalOpened}
        onClose={closeSuccessModal}
        title="Submission Received"
        centered
      >
        <Stack gap="md">
          <Alert color="blue" title="Submission Pending">
            Your submission will be reviewed and verified. Once approved, it will appear on the website.
          </Alert>
          <Button onClick={closeSuccessModal} fullWidth>
            Close
          </Button>
        </Stack>
      </Modal>
    </>
  );
}

function RetailerCard({ retailer }: { retailer: Retailer }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Map retailer names to thumbnail filenames
  const getThumbnailFilename = (retailerName: string): string | null => {
    const nameMap: Record<string, string> = {
      'Caribshopper': 'caribshopper.png',
      '7Krave Kravemart': '7Krave.png',
      'Sampars Cash & Carry': 'sampars.png',
      'PriceSmart Jamaica': 'Pricemart.png',
      'QuickCart': 'Quickcart.png',
      'GroceryList Jamaica': 'grocerylist.png',
    };
    
    // Try exact match first
    if (nameMap[retailerName]) {
      return nameMap[retailerName];
    }
    
    // Try case-insensitive match
    const lowerName = retailerName.toLowerCase();
    for (const [key, value] of Object.entries(nameMap)) {
      if (key.toLowerCase() === lowerName) {
        return value;
      }
    }
    
    return null;
  };

  useEffect(() => {
    // Prefer logoUrl from database if available
    if (retailer.logoUrl) {
      setThumbnailUrl(retailer.logoUrl);
      return;
    }
    
    // Fallback to thumbnail filename mapping
    const filename = getThumbnailFilename(retailer.name);
    if (filename) {
      const { data: { publicUrl } } = supabase.storage
        .from('retailers')
        .getPublicUrl(filename);
      setThumbnailUrl(publicUrl);
    }
  }, [retailer.name, retailer.logoUrl]);

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onClick={() => window.open(retailer.websiteUrl, '_blank', 'noopener,noreferrer')}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
      }}
    >
      <Stack gap="md" style={{ flex: 1 }}>
        {/* Thumbnail Image */}
        {thumbnailUrl && !imageError ? (
          <Box style={{ width: '100%', height: '200px', position: 'relative', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
            <img
              src={thumbnailUrl}
              alt={retailer.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '8px'
              }}
              onError={() => {
                setImageError(true);
              }}
            />
          </Box>
        ) : (
          <Box style={{ width: '100%', height: '200px', backgroundColor: '#e9ecef', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
            <IconShoppingCart size={48} color="#adb5bd" />
            {thumbnailUrl && imageError && (
              <Text size="xs" c="dimmed" ta="center">Image failed to load</Text>
            )}
            {!thumbnailUrl && (
              <Text size="xs" c="dimmed" ta="center">No thumbnail available</Text>
            )}
          </Box>
        )}

        {/* Retailer Info */}
        <Stack gap="xs" style={{ flex: 1 }}>
          <Group justify="space-between" align="flex-start">
            <Title order={4} style={{ flex: 1 }}>{retailer.name}</Title>
            {retailer.verified && (
              <Badge color="green" size="sm">Verified</Badge>
            )}
          </Group>

          {retailer.description && (
            <Text size="sm" c="dimmed" lineClamp={2}>
              {retailer.description}
            </Text>
          )}

          {retailer.phoneNumber && (
            <Group gap="xs">
              <IconPhone size={16} color="#1478FF" />
              <Anchor href={`tel:${retailer.phoneNumber}`} size="sm" onClick={(e) => e.stopPropagation()}>
                {retailer.phoneNumber}
              </Anchor>
            </Group>
          )}

          <Button
            variant="light"
            fullWidth
            mt="auto"
            rightSection={<IconExternalLink size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              window.open(retailer.websiteUrl, '_blank', 'noopener,noreferrer');
            }}
          >
            Visit Website
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}

function RetailerListItem({ retailer }: { retailer: Retailer }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Map retailer names to thumbnail filenames
  const getThumbnailFilename = (retailerName: string): string | null => {
    const nameMap: Record<string, string> = {
      'Caribshopper': 'caribshopper.png',
      '7Krave Kravemart': '7Krave.png',
      'Sampars Cash & Carry': 'sampars.png',
      'PriceSmart Jamaica': 'Pricemart.png',
      'QuickCart': 'Quickcart.png',
      'GroceryList Jamaica': 'grocerylist.png',
    };
    
    // Try exact match first
    if (nameMap[retailerName]) {
      return nameMap[retailerName];
    }
    
    // Try case-insensitive match
    const lowerName = retailerName.toLowerCase();
    for (const [key, value] of Object.entries(nameMap)) {
      if (key.toLowerCase() === lowerName) {
        return value;
      }
    }
    
    return null;
  };

  useEffect(() => {
    // Prefer logoUrl from database if available
    if (retailer.logoUrl) {
      setThumbnailUrl(retailer.logoUrl);
      return;
    }
    
    // Fallback to thumbnail filename mapping
    const filename = getThumbnailFilename(retailer.name);
    if (filename) {
      const { data: { publicUrl } } = supabase.storage
        .from('retailers')
        .getPublicUrl(filename);
      setThumbnailUrl(publicUrl);
    }
  }, [retailer.name, retailer.logoUrl]);

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      style={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onClick={() => window.open(retailer.websiteUrl, '_blank', 'noopener,noreferrer')}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
      }}
    >
      <Group gap="md" align="flex-start" wrap="nowrap">
        {/* Thumbnail */}
        <Box style={{ width: '120px', height: '120px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
          {thumbnailUrl && !imageError ? (
            <img
              src={thumbnailUrl}
              alt={retailer.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '8px'
              }}
              onError={() => {
                setImageError(true);
              }}
            />
          ) : (
            <Box style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9ecef' }}>
              <IconShoppingCart size={32} color="#adb5bd" />
            </Box>
          )}
        </Box>

        {/* Retailer Info */}
        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Title order={4} style={{ flex: 1, minWidth: 0 }}>{retailer.name}</Title>
            {retailer.verified && (
              <Badge color="green" size="sm">Verified</Badge>
            )}
          </Group>

          {retailer.description && (
            <Text size="sm" c="dimmed" lineClamp={2}>
              {retailer.description}
            </Text>
          )}

          <Group gap="md" wrap="wrap">
            {retailer.phoneNumber && (
              <Group gap="xs">
                <IconPhone size={16} color="#1478FF" />
                <Anchor href={`tel:${retailer.phoneNumber}`} size="sm" onClick={(e) => e.stopPropagation()}>
                  {retailer.phoneNumber}
                </Anchor>
              </Group>
            )}
            <Button
              variant="light"
              size="xs"
              rightSection={<IconExternalLink size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                window.open(retailer.websiteUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              Visit Website
            </Button>
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}

