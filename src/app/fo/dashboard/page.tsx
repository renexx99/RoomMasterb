// src/app/fo/dashboard/page.tsx
'use client';

import {
  Container,
  Title,
  Text,
  Card,
  SimpleGrid,
  Stack,
  Group,
  Paper,
  Badge,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconBed,
  IconCalendarCheck,
  IconUsers,
  IconCalendarEvent,
  IconLogin, // Kedatangan
  IconLogout, // Keberangkatan
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { notifications } from '@mantine/notifications';

// Interface untuk stats dashboard FO
interface FoDashboardStats {
  availableRooms: number;
  todayCheckIns: number; // Jumlah Kedatangan
  todayCheckOuts: number; // Jumlah Keberangkatan
  guestsInHouse: number; // Tamu In-House
  hotelName: string;
}

export default function FoDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<FoDashboardStats>({
    availableRooms: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    guestsInHouse: 0,
    hotelName: '',
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Cari hotel_id dari assignment peran 'Front Office'
  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Front Office'
  )?.hotel_id;

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!assignedHotelId) {
        setLoadingStats(false);
        return;
      }

      setLoadingStats(true);
      try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Ambil Nama Hotel
        const { data: hotelData } = await supabase
          .from('hotels')
          .select('name')
          .eq('id', assignedHotelId)
          .maybeSingle();

        // 2. Hitung Kamar Tersedia
        const { count: availableCount } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', assignedHotelId)
          .eq('status', 'available');

        // 3. Hitung Kedatangan (Check-in Hari Ini)
        const { count: checkInsCount } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', assignedHotelId)
          .eq('check_in_date', today)
          .neq('payment_status', 'cancelled');

        // 4. Hitung Keberangkatan (Check-out Hari Ini)
        const { count: checkOutsCount } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', assignedHotelId)
          .eq('check_out_date', today)
          .neq('payment_status', 'cancelled');

        // 5. Hitung Tamu In-House (Aktif hari ini)
        const { count: guestsInHouseCount } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', assignedHotelId)
          .lte('check_in_date', today)
          .gte('check_out_date', today)
          .neq('payment_status', 'cancelled');

        setStats({
          availableRooms: availableCount || 0,
          todayCheckIns: checkInsCount || 0,
          todayCheckOuts: checkOutsCount || 0,
          guestsInHouse: guestsInHouseCount || 0,
          hotelName: hotelData?.name || '',
        });
      } catch (error) {
        console.error('Error fetching FO dashboard stats:', error);
        notifications.show({
          title: 'Error',
          message: 'Gagal memuat statistik dashboard.',
          color: 'red',
        });
      } finally {
        setLoadingStats(false);
      }
    };

    if (!authLoading && assignedHotelId) {
      fetchDashboardStats();
    } else if (!authLoading && !assignedHotelId) {
      setLoadingStats(false);
    }
  }, [authLoading, assignedHotelId]);

  if (authLoading || loadingStats) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  if (!assignedHotelId) {
    return (
      <Container size="lg">
        <Paper shadow="xs" p="xl" radius="lg" mt="xl" withBorder>
          <Stack align="center">
            <Title order={3} ta="center">
              Assignment Hotel Tidak Ditemukan
            </Title>
            <Text c="dimmed" ta="center">
              Anda belum ditugaskan ke hotel manapun. Silakan hubungi
              Administrator.
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const foRoleName =
    profile?.roles?.find((r) => r.role_name === 'Front Office')?.role_name ||
    'Front Office';

  return (
    <Container
      size="lg"
      style={{ background: '#f9fafc', borderRadius: 12, padding: '1.5rem' }}
    >
      <Stack gap="xl">
        {/* Header Dashboard */}
        <div>
          <Group mb="xs">
            <Title order={2} c="#1e293b">
              Front Office Dashboard
            </Title>
            <Badge size="lg" color="teal" variant="light">
              {stats.hotelName}
            </Badge>
          </Group>
          <Text c="#475569">Ringkasan operasional Anda hari ini.</Text>
        </div>

        {/* Kartu Statistik */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {[
            {
              title: 'Kedatangan Hari Ini',
              value: stats.todayCheckIns,
              color: '#06b6d4', // Cyan
              icon: <IconLogin size={24} stroke={1.5} color="#06b6d4" />,
            },
            {
              title: 'Keberangkatan Hari Ini',
              value: stats.todayCheckOuts,
              color: '#f59e0b', // Orange
              icon: <IconLogout size={24} stroke={1.5} color="#f59e0b" />,
            },
            {
              title: 'Tamu In-House',
              value: stats.guestsInHouse,
              color: '#8b5cf6', // Violet
              icon: <IconUsers size={24} stroke={1.5} color="#8b5cf6" />,
            },
            {
              title: 'Kamar Tersedia',
              value: stats.availableRooms,
              color: '#10b981', // Green
              icon: <IconBed size={24} stroke={1.5} color="#10b981" />,
            },
          ].map((item) => (
            <Card
              key={item.title}
              padding="lg"
              radius="lg"
              shadow="xs"
              style={{
                background: 'white',
                border: 'none',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              }}
            >
              <Group justify="space-between" mb="md">
                <div>
                  <Text size="sm" c="#1e293b" fw={500}>
                    {item.title}
                  </Text>
                  <Text size="xl" fw={700} mt="xs" c={item.color}>
                    {item.value}
                  </Text>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: `${item.color}1A`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </div>
              </Group>
            </Card>
          ))}
        </SimpleGrid>

        {/* Pesan Selamat Datang */}
        <Paper
          shadow="xs"
          p="xl"
          radius="lg"
          style={{
            background:
              'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', // Gradien Teal
            color: 'white',
          }}
        >
          <Stack gap="md">
            <Title order={3} c="white">
              Selamat Datang, {profile?.full_name}!
            </Title>
            <Text size="lg" c="white" opacity={0.95}>
              Anda bertugas di <strong>{stats.hotelName}</strong>. Gunakan menu
              navigasi untuk mengelola reservasi dan tamu.
            </Text>
            <Group mt="md">
              <Badge
                size="lg"
                color="white"
                variant="filled"
                style={{ color: '#0d9488' }}
              >
                {foRoleName}
              </Badge>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}