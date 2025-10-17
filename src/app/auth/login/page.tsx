'use client';

import { Container, Grid, Box, Stack, Title, Text } from '@mantine/core';
import { IconBuildingSkyscraper } from '@tabler/icons-react';
import { LoginForm } from '@/features/auth/components/LoginForm';

// Komponen branding kita definisikan di sini
function AuthBranding() {
  return (
    <Box>
      <Stack align="center" gap="lg">
        <IconBuildingSkyscraper
          size={60}
          stroke={1.5}
          color="var(--mantine-color-blue-6)"
        />
        <Title order={1} ta="center">
          RoomMaster
        </Title>
        <Text c="dimmed" size="lg" ta="center" maw={400}>
          The All-in-One Property Management System for modern hotel chains.
        </Text>
      </Stack>
    </Box>
  );
}

// Komponen Halaman Login
export default function LoginPage() {
  return (
    <Container size="lg" py="xl" style={{ display: 'flex', alignItems: 'center', height: '100vh' }}>
      <Grid grow align="center" gutter={{ base: 40, md: 80 }}>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <LoginForm />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }} visibleFrom="md">
          <AuthBranding />
        </Grid.Col>
      </Grid>
    </Container>
  );
}