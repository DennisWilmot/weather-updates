'use client';

import { SignUp } from '@clerk/nextjs';
import { Container, Stack, Title, Text, Box } from '@mantine/core';
import Image from 'next/image';

export default function SignUpPage() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="lg" mt="xl">
        <Box mb="md">
          <Image 
            src="/White_Icon_Blue_Bkg-removebg-preview.png" 
            alt="Intellibus" 
            width={60} 
            height={60}
            style={{ objectFit: 'contain' }}
          />
        </Box>
        <Title order={1} ta="center">Sign Up</Title>
        <Text c="dimmed" ta="center" size="sm">
          Create an account to access response team features
        </Text>
        <Box mt="md">
          <SignUp 
            appearance={{
              elements: {
                rootBox: {
                  margin: '0 auto',
                },
              },
            }}
            afterSignUpUrl="/"
            afterSignInUrl="/"
          />
        </Box>
      </Stack>
    </Container>
  );
}

