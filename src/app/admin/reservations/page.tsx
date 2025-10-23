'use client';

import { Container, Title, Text, Paper, Stack } from '@mantine/core';
import { IconCalendarEvent } from '@tabler/icons-react';

export default function ReservationsPage() {
  return (
    <Container size="lg">
      <Stack gap="lg">
        <div>
          <Title order={2} c="#1e293b">
            Manajemen Reservasi
          </Title>
          <Text c="#475569" size="sm">
            Kelola reservasi hotel Anda
          </Text>
        </div>

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
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
              }}
            >
              <IconCalendarEvent size={40} stroke={1.5} color="white" />
            </div>
            <Title order={3} c="#1e293b">
              Halaman Reservasi
            </Title>
            <Text c="dimmed" size="lg" maw={500}>
              Fitur manajemen reservasi sedang dalam pengembangan. Anda akan dapat mengelola check-in, check-out, dan status pembayaran di sini.
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}