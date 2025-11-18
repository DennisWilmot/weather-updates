/**
 * SignatureCapture - Canvas-based signature capture component
 * Supports touch and mouse input, image compression, and Supabase upload
 */

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Paper, Button, Group, Text, Stack, Loader } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconTrash, IconCheck, IconUpload } from '@tabler/icons-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';

interface SignatureCaptureProps {
  label?: string;
  description?: string;
  value?: string; // URL or base64 string
  onChange: (url: string | null) => void;
  error?: string;
  required?: boolean;
  width?: number;
  height?: number;
  uploadToStorage?: boolean;
  storagePath?: string;
  className?: string;
}

export default function SignatureCapture({
  label,
  description,
  value,
  onChange,
  error,
  required = false,
  width = 400,
  height = 200,
  uploadToStorage = true,
  storagePath = 'signatures',
  className,
}: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Responsive dimensions
  const canvasWidth = isMobile ? Math.min(width, typeof window !== 'undefined' ? window.innerWidth - 32 : width) : width;
  const canvasHeight = isMobile ? Math.min(height, 250) : height;

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (use responsive dimensions)
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if value exists
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value, width, height, isMobile, canvasWidth, canvasHeight]);

  // Get coordinates relative to canvas
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  // Start drawing
  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
      setHasSignature(true);
    },
    []
  );

  // Draw
  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCoordinates(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing]
  );

  // Stop drawing
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Clear signature
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange(null);
  };

  // Save signature
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    setIsUploading(true);

    try {
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsUploading(false);
          return;
        }

        try {
          // Convert blob to File for imageCompression
          const file = new File([blob], 'signature.png', { type: 'image/png' });
          
          // Compress image
          const compressedBlob = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          });

          if (uploadToStorage) {
            // Upload to Supabase Storage
            const fileName = `signature-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
            const filePath = `${storagePath}/${fileName}`;

            const { data, error } = await supabase.storage
              .from('signatures')
              .upload(filePath, compressedBlob, {
                contentType: 'image/png',
                upsert: false,
              });

            if (error) throw error;

            // Get public URL
            const {
              data: { publicUrl },
            } = supabase.storage.from('signatures').getPublicUrl(filePath);

            onChange(publicUrl);
          } else {
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
              onChange(reader.result as string);
            };
            reader.readAsDataURL(compressedBlob);
          }
        } catch (err) {
          console.error('Error processing signature:', err);
          // Fallback to base64
          const dataUrl = canvas.toDataURL('image/png');
          onChange(dataUrl);
        } finally {
          setIsUploading(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Error saving signature:', err);
      setIsUploading(false);
    }
  };

  return (
    <div className={className}>
      {label && (
        <Group gap="xs" mb="xs">
          <Text size="sm" fw={500}>
            {label}
          </Text>
          {required && (
            <Text size="sm" c="red">
              *
            </Text>
          )}
        </Group>
      )}

      {description && (
        <Text size="xs" c="dimmed" mb="sm">
          {description}
        </Text>
      )}

      <Paper
        withBorder
        p="md"
        style={{
          borderColor: error ? 'var(--mantine-color-red-6)' : undefined,
        }}
      >
        <Stack gap="sm">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              cursor: 'crosshair',
              touchAction: 'none',
              width: '100%',
              maxWidth: isMobile ? '100%' : `${width}px`,
              height: isMobile ? `${canvasHeight}px` : 'auto',
              maxHeight: isMobile ? `${canvasHeight}px` : undefined,
              aspectRatio: isMobile ? undefined : `${width} / ${height}`,
            }}
          />

          {/* Controls */}
          <Group justify="space-between" wrap="wrap">
            <Button
              variant="subtle"
              color="red"
              size={isMobile ? "md" : "sm"}
              leftSection={<IconTrash size={isMobile ? 18 : 16} />}
              onClick={handleClear}
              disabled={!hasSignature || isUploading}
              style={{
                minHeight: isMobile ? '44px' : undefined,
                flex: isMobile ? '1' : undefined,
              }}
            >
              Clear
            </Button>

            <Button
              variant="filled"
              color="blue"
              size={isMobile ? "md" : "sm"}
              leftSection={isUploading ? <Loader size={isMobile ? 18 : 16} /> : <IconCheck size={isMobile ? 18 : 16} />}
              onClick={handleSave}
              disabled={!hasSignature || isUploading}
              loading={isUploading}
              style={{
                minHeight: isMobile ? '44px' : undefined,
                flex: isMobile ? '1' : undefined,
              }}
            >
              {isUploading ? 'Saving...' : 'Save Signature'}
            </Button>
          </Group>

          {/* Preview */}
          {value && !isUploading && (
            <Group gap="xs">
              <IconCheck size={16} color="green" />
              <Text size="xs" c="dimmed">
                Signature saved
              </Text>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Error Message */}
      {error && (
        <Text size="xs" c="red" mt="xs">
          {error}
        </Text>
      )}
    </div>
  );
}

