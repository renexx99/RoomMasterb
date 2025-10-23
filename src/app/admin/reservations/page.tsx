'use client';

import { Container, Title, Text, Paper, Stack, Group, ActionIcon } from '@mantine/core'; // Tambahkan Group, ActionIcon
import { IconCalendarEvent, IconArrowLeft } from '@tabler/icons-react'; // Tambahkan IconArrowLeft
import { useRouter } from 'next/navigation'; // Tambahkan useRouter

export default function ReservationsPage() {
  const router = useRouter(); // Inisialisasi router

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
                            onClick={() => router.push('/admin/dashboard')} // Navigate back to admin dashboard
                            aria-label="Kembali ke Dashboard Admin"
                            >
                            <IconArrowLeft size={20} />
                            </ActionIcon>
                            <Title order={1} c="white">
                                Manajemen Reservasi
                            </Title>
                        </Group>
                        <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                            Kelola reservasi hotel Anda
                        </Text>
                    </div>
                    {/* No action button needed here for now */}
                </Group>
            </Container>
        </div>

        <Container size="lg" pb="xl"> {/* Added bottom padding */}
            <Stack gap="lg">
                {/* Removed old Title/Text */}
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
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', // Placeholder blue gradient for icon
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
     </div>
  );
}