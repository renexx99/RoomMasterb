'use client';

import { Container, Grid, Box, Stack, Title, Text } from '@mantine/core';
import { IconBuildingSkyscraper } from '@tabler/icons-react';
import { LoginForm } from '@/features/auth/components/LoginForm';

// Komponen Branding dengan desain modern
function AuthBranding() {
  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <Stack align="center" gap="xl">
        {/* Icon dengan background gradient */}
        <Box
          style={{
            width: 100,
            height: 100,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
          }}
        >
          <IconBuildingSkyscraper
            size={50}
            stroke={1.5}
            color="white"
          />
        </Box>

        {/* Nama Aplikasi */}
        <Title 
          order={1} 
          ta="center"
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}
        >
          RoomMaster
        </Title>

        {/* Tagline */}
        <Text 
          c="dimmed" 
          size="lg" 
          ta="center" 
          maw={450}
          style={{
            lineHeight: 1.6,
            fontSize: '1.1rem',
          }}
        >
          The All-in-One Property Management System for modern hotel chains.
        </Text>

        {/* Feature highlights */}
        <Stack gap="sm" mt="xl">
          {[
            '🏨 Multi-property management',
            '📊 Real-time analytics',
            '🔒 Enterprise-grade security',
          ].map((feature, index) => (
            <Text 
              key={index}
              size="sm" 
              c="dimmed"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {feature}
            </Text>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}

// Komponen Halaman Login
export default function LoginPage() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container size="xl" py="xl">
        <Grid gutter={{ base: 0, md: 80 }} align="center">
          {/* Kolom Form Login */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Box
              style={{
                maxWidth: 480,
                margin: '0 auto',
              }}
            >
              <LoginForm />
            </Box>
          </Grid.Col>

          {/* Kolom Branding (hidden on mobile) */}
          <Grid.Col span={{ base: 12, md: 6 }} visibleFrom="md">
            <AuthBranding />
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}