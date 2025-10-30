// src/app/manager/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Grid,
  Group,
  Center,
  Loader,
  ActionIcon,
  Badge,
  SimpleGrid,
  Card,
  RingProgress,
  Box,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconPercentage,
  IconBed,
  IconBedOff,
  IconCalendarCheck,
  IconCalendarEvent,
  IconCash,
  IconTools,
  IconBuildingSkyscraper,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

// Interface untuk data laporan
interface ReportStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  revenueToday: number;
}

function ReportsContent() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats>({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0,
    occupancyRate: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    revenueToday: 0,
  });

  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Hotel Manager'
  )?.hotel_id;

  useEffect(() => {
    if (!authLoading && assignedHotelId) {
      fetchReportData();
    } else if (!authLoading && !assignedHotelId) {
      setLoading(false);
      notifications.show({
        title: 'Error',
        message: 'Anda tidak terhubung ke hotel manapun.',
        color: 'red',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, assignedHotelId]);

  const fetchReportData = async () => {
    if (!assignedHotelId) return;
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Ambil semua hitungan status kamar
      const { count: totalRoomsCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', assignedHotelId);

      const { count: availableRoomsCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', assignedHotelId)
        .eq('status', 'available');

      const { count: occupiedRoomsCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', assignedHotelId)
        .eq('status', 'occupied');

      const { count: maintenanceRoomsCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', assignedHotelId)
        .eq('status', 'maintenance');

      // 2. Ambil pergerakan harian (Check-in / Check-out)
      const { count: todayCheckInsCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', assignedHotelId)
        .eq('check_in_date', today)
        .neq('payment_status', 'cancelled');

      const { count: todayCheckOutsCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('hotel_id', assignedHotelId)
        .eq('check_out_date', today)
        .neq('payment_status', 'cancelled');

      // 3. Ambil pendapatan (Sederhana: total harga dari reservasi yg 'paid' DAN check-in hari ini)
      const { data: revenueData, error: revenueError } = await supabase
        .from('reservations')
        .select('total_price')
        .eq('hotel_id', assignedHotelId)
        .eq('check_in_date', today) // Opsi: atau reservasi yang aktif hari ini
        .eq('payment_status', 'paid');

      if (revenueError) throw revenueError;

      const totalRevenueToday =
        revenueData?.reduce((acc, res) => acc + res.total_price, 0) || 0;

      // 4. Kalkulasi
      const totalRooms = totalRoomsCount || 0;
      const occupiedRooms = occupiedRoomsCount || 0;
      const occupancyRate =
        totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      setStats({
        totalRooms: totalRooms,
        availableRooms: availableRoomsCount || 0,
        occupiedRooms: occupiedRooms,
        maintenanceRooms: maintenanceRoomsCount || 0,
        occupancyRate: occupancyRate,
        todayCheckIns: todayCheckInsCount || 0,
        todayCheckOuts: todayCheckOutsCount || 0,
        revenueToday: totalRevenueToday,
      });
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      notifications.show({
        title: 'Error',
        message: error?.message || 'Gagal memuat data laporan.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  // Data untuk RingProgress
  const roomStatusData = [
    {
      name: 'Tersedia',
      value: stats.availableRooms,
      color: 'green',
      icon: <IconBed size={16} />,
    },
    {
      name: 'Terisi',
      value: stats.occupiedRooms,
      color: 'red',
      icon: <IconBedOff size={16} />,
    },
    {
      name: 'Maintenance',
      value: stats.maintenanceRooms,
      color: 'orange',
      icon: <IconTools size={16} />,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Gradient (Manager) */}
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
                  Laporan Operasional
                </Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                Ringkasan performa hotel Anda
              </Text>
            </div>
            {/* Bisa tambahkan tombol 'Export' di masa depan */}
          </Group>
        </Container>
      </div>

      <Container size="lg" pb="xl">
        <Stack gap="xl">
          {/* --- Ringkasan Utama (Okupansi & Pergerakan) --- */}
          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Title order={3} mb="lg">
              Ringkasan Utama
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
              {/* Card Okupansi */}
              <Card padding="lg" radius="md" shadow="xs" withBorder>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed" fw={500}>
                    Okupansi
                  </Text>
                  <IconPercentage size={24} stroke={1.5} color="#3b82f6" />
                </Group>
                <Text size="xl" fw={700} mt="md" c="blue.7"> {/* <-- DIUBAH */}
                  {stats.occupancyRate.toFixed(1)}%
                </Text>
                <Text size="xs" c="dimmed">
                  ({stats.occupiedRooms} / {stats.totalRooms} Kamar)
                </Text>
              </Card>

              {/* Card Check-in */}
              <Card padding="lg" radius="md" shadow="xs" withBorder>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed" fw={500}>
                    Check-in Hari Ini
                  </Text>
                  <IconCalendarCheck size={24} stroke={1.5} color="#10b981" />
                </Group>
                <Text size="xl" fw={700} mt="md" c="green.7"> {/* <-- DIUBAH */}
                  {stats.todayCheckIns}
                </Text>
                <Text size="xs" c="dimmed">
                  Tamu
                </Text>
              </Card>

              {/* Card Check-out */}
              <Card padding="lg" radius="md" shadow="xs" withBorder>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed" fw={500}>
                    Check-out Hari Ini
                  </Text>
                  <IconCalendarEvent size={24} stroke={1.5} color="#f59e0b" />
                </Group>
                <Text size="xl" fw={700} mt="md" c="orange.7"> {/* <-- DIUBAH */}
                  {stats.todayCheckOuts}
                </Text>
                <Text size="xs" c="dimmed">
                  Tamu
                </Text>
              </Card>

              {/* Card Revenue */}
              <Card padding="lg" radius="md" shadow="xs" withBorder>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed" fw={500}>
                    Pendapatan Hari Ini
                  </Text>
                  <IconCash size={24} stroke={1.5} color="#8b5cf6" />
                </Group>
                <Text size="xl" fw={700} mt="md" c="violet.7"> {/* <-- DIUBAH */}
                  Rp {stats.revenueToday.toLocaleString('id-ID')}
                </Text>
                <Text size="xs" c="dimmed">
                  (Dari check-in terbayar)
                </Text>
              </Card>
            </SimpleGrid>
          </Paper>

          {/* --- Detail Status Kamar --- */}
          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Title order={3} mb="lg">
              Status Kamar
            </Title>
            <Grid align="center" gutter="xl">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Center>
                  <RingProgress
                    size={180}
                    thickness={16}
                    label={
                      <Stack align="center" gap={0}>
                        <Text size="xs" c="dimmed" ta="center">
                          Total Kamar
                        </Text>
                        <Text fw={700} size="2.25rem" ta="center"> {/* <-- DIUBAH */}
                          {stats.totalRooms}
                        </Text>
                      </Stack>
                    }
                    sections={roomStatusData.map((s) => ({
                      value:
                        stats.totalRooms > 0
                          ? (s.value / stats.totalRooms) * 100
                          : 0,
                      color: s.color,
                      tooltip: `${s.name}: ${s.value}`,
                    }))}
                  />
                </Center>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Stack gap="lg">
                  {roomStatusData.map((s) => (
                    <Paper
                      key={s.name}
                      withBorder
                      radius="md"
                      p="md"
                      bg={`${s.color}.0`}
                    >
                      <Group justify="space-between">
                        <Group>
                          <Box
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: `${s.color}.1`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: `var(--mantine-color-${s.color}-7)`,
                            }}
                          >
                            {s.icon}
                          </Box>
                          <Text fw={600} size="lg" c={`${s.color}.8`}>
                            {s.name}
                          </Text>
                        </Group>
                        <Text fw={700} size="lg" c={`${s.color}.8`}> {/* <-- DIUBAH */}
                          {s.value} Kamar
                        </Text>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* (Placeholder untuk Feedback Tamu di masa depan) */}
          {/* <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Title order={3} mb="lg">Ringkasan Feedback Tamu</Title>
              <Text c="dimmed">Fitur ini akan segera hadir.</Text>
            </Paper>
            */}
        </Stack>
      </Container>
    </div>
  );
}

// Bungkus dengan ProtectedRoute
export default function ManagerReportsPage() {
  return (
    <ProtectedRoute requiredRoleName="Hotel Manager">
      <ReportsContent />
    </ProtectedRoute>
  );
}