'use client';

import { Container, Title, Text, Paper, Stack, Group, ActionIcon, Button } from '@mantine/core';
import { IconUsersGroup, IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function GuestsPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Gradient */}
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Green Gradient
          padding: '2rem 0',
          marginBottom: '2rem',
        }}
      >
        <Container size="lg">
          <Group justify="space-between" align="center">
            <div>
              <Group mb="xs">
                <ActionIcon
                  variant="transparent"
                  color="white"
                  onClick={() => router.push('/admin/dashboard')}
                  aria-label="Kembali ke Dashboard Admin"
                >
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Title order={1} c="white">
                  Manajemen Tamu
                </Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                Kelola data tamu hotel Anda
              </Text>
            </div>
             <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => { /* Logika buka modal tambah tamu */ }}
                variant="white"
                color="teal"
            >
                Tambah Tamu
            </Button>
          </Group>
        </Container>
      </div>

      <Container size="lg" pb="xl">
        <Stack gap="lg">
          <Paper
            shadow="sm"
            p="xl"
            radius="md"
            withBorder
            style={{
              textAlign: 'center',
              minHeight: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Stack gap="lg" align="center">
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', // Placeholder purple gradient for icon
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
                }}
              >
                <IconUsersGroup size={40} stroke={1.5} color="white" />
              </div>
              <Title order={3} c="#1e293b">
                Halaman Tamu
              </Title>
              <Text c="dimmed" size="lg" maw={500}>
                Fitur manajemen tamu sedang dalam pengembangan. Anda akan dapat melihat riwayat menginap dan mengelola data tamu di sini.
              </Text>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </div>
  );
}