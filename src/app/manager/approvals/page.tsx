// src/app/manager/approvals/page.tsx
'use client';

import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Center,
  Loader,
  ActionIcon,
  Button,
  Card,
  Badge,
  Avatar,
  Divider,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconReceiptRefund,
  IconDiscount2,
  IconBox,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useState } from 'react';

// Data Mock (Dummy) untuk UI
const mockRequests = [
  {
    id: 'req_001',
    type: 'discount',
    icon: <IconDiscount2 size={18} />,
    color: 'blue',
    title: 'Permintaan Diskon 15%',
    requester: {
      name: 'Andi (Front Office)',
      avatar: 'AF',
    },
    details:
      'Tamu di Kamar 301 (Reservasi #RES-789) adalah tamu reguler dan meminta diskon 15% untuk perpanjangan 2 malam.',
    created_at: '2025-10-31T09:15:00Z',
  },
  {
    id: 'req_002',
    type: 'refund',
    icon: <IconReceiptRefund size={18} />,
    color: 'red',
    title: 'Permintaan Refund Penuh',
    requester: {
      name: 'Citra (Front Office)',
      avatar: 'CF',
    },
    details:
      'Tamu di Kamar 505 (Reservasi #RES-790) check-out lebih awal karena AC rusak. Meminta refund penuh untuk 1 malam terakhir.',
    created_at: '2025-10-31T08:30:00Z',
  },
  {
    id: 'req_003',
    type: 'other',
    icon: <IconBox size={18} />,
    color: 'gray',
    title: 'Permintaan Khusus (Non-Standar)',
    requester: {
      name: 'Andi (Front Office)',
      avatar: 'AF',
    },
    details:
      'Tamu VIP di Suite 1001 (Reservasi #RES-791) meminta setup dekorasi ulang tahun khusus di kamar sebelum jam 15:00.',
    created_at: '2025-10-31T07:00:00Z',
  },
];

function ApprovalsContent() {
  const { loading: authLoading } = useAuth();
  const router = useRouter();

  // State untuk UI (simulasi loading)
  const [loading, setLoading] = useState(false);

  // Fungsi dummy untuk tombol
  const handleApproval = (id: string, action: 'approve' | 'reject') => {
    setLoading(true);
    console.log(`Request ${id} di-${action}`);
    // Simulasi proses
    setTimeout(() => {
      setLoading(false);
      // Di aplikasi nyata, Anda akan memfilter 'mockRequests' atau me-refresh data
    }, 750);
  };

  if (authLoading) {
    return <Center style={{ minHeight: '100vh' }}><Loader size="xl" /></Center>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
                  onClick={() => router.push('/manager/dashboard')}
                  aria-label="Kembali ke Dashboard Manager"
                >
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Title order={1} c="white">
                  Persetujuan Permintaan
                </Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                Tinjau dan setujui permintaan dari staf Anda.
              </Text>
            </div>
          </Group>
        </Container>
      </div>

      {/* Konten */}
      <Container size="lg" pb="xl">
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Title order={3} mb="lg">
            Permintaan Tertunda ({mockRequests.length})
          </Title>

          {mockRequests.length > 0 ? (
            <Stack gap="lg">
              {mockRequests.map((req) => (
                <Card key={req.id} shadow="xs" radius="md" withBorder>
                  <Stack>
                    {/* Header Kartu */}
                    <Group justify="space-between">
                      <Group gap="sm">
                        <Badge
                          color={req.color}
                          variant="light"
                          size="lg"
                          leftSection={req.icon}
                        >
                          {req.type.charAt(0).toUpperCase() + req.type.slice(1)}
                        </Badge>
                        <Title order={5}>{req.title}</Title>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {new Date(req.created_at).toLocaleString('id-ID', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </Text>
                    </Group>
                    
                    <Divider />
                    
                    {/* Detail Permintaan */}
                    <Text size="sm" mt="xs">
                      {req.details}
                    </Text>

                    {/* Footer Kartu (Peminta & Aksi) */}
                    <Group justify="space-between" mt="md">
                      <Group gap="xs">
                        <Avatar color={req.color} radius="xl" size="sm">
                          {req.requester.avatar}
                        </Avatar>
                        <Text size="sm" fw={500}>
                          {req.requester.name}
                        </Text>
                      </Group>

                      <Group>
                        <Button
                          color="red"
                          variant="light"
                          leftSection={<IconX size={16} />}
                          onClick={() => handleApproval(req.id, 'reject')}
                          loading={loading}
                        >
                          Tolak
                        </Button>
                        <Button
                          color="green"
                          variant="filled"
                          leftSection={<IconCheck size={16} />}
                          onClick={() => handleApproval(req.id, 'approve')}
                          loading={loading}
                        >
                          Setujui
                        </Button>
                      </Group>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </Stack>
          ) : (
            <Center py="xl">
              <Text c="dimmed">Tidak ada permintaan yang tertunda saat ini.</Text>
            </Center>
          )}
        </Paper>
      </Container>
    </div>
  );
}

// Bungkus dengan ProtectedRoute
export default function ManagerApprovalsPage() {
  return (
    <ProtectedRoute requiredRoleName="Hotel Manager">
      <ApprovalsContent />
    </ProtectedRoute>
  );
}