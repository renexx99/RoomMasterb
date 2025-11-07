'use client';

import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Stack,
  Group,
  Paper,
  Badge,
  Loader,
  Center,
  Grid,
} from '@mantine/core';
import {
  IconBed,
  IconCalendarCheck,
  IconUsers,
  IconCalendarEvent,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { notifications } from '@mantine/notifications';

// Komponen template baru kita
import StatsCard from '@/components/Dashboard/StatsCard';
import SalesChart from '@/components/Dashboard/SalesChart';
import OrdersTable from '@/components/Dashboard/OrdersTable';
import Surface from '@/components/Dashboard/Surface';
import { useFetchData } from '@/hooks/useFetchData'; // Untuk OrdersTable

// Interface untuk stats dashboard Manager
interface ManagerDashboardStats {
  availableRooms: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  guestsInHouse: number;
  hotelName: string;
}

export default function ManagerDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<ManagerDashboardStats>({
    availableRooms: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    guestsInHouse: 0,
    hotelName: '',
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Ambil data dummy untuk tabel di baris bawah
  const {
    data: ordersData,
    loading: ordersLoading,
    error: ordersError,
  } = useFetchData('/mocks/Orders.json');

  // Cari hotel_id dari assignment peran user
  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Hotel Manager',
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

        // 3. Hitung Check-in Hari Ini
        const { count: checkInsCount } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', assignedHotelId)
          .eq('check_in_date', today)
          .neq('payment_status', 'cancelled');

        // 4. Hitung Check-out Hari Ini
        const { count: checkOutsCount } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', assignedHotelId)
          .eq('check_out_date', today)
          .neq('payment_status', 'cancelled');

        // 5. Hitung Tamu In-House
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
        console.error('Error fetching manager dashboard stats:', error);
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

  // Tampilkan loader
  if (authLoading || loadingStats) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  // Handle jika manager tidak punya hotel assignment
  if (!assignedHotelId) {
    return (
      <Container size="lg">
        <Paper shadow="xs" p="xl" radius="lg" mt="xl" withBorder>
          <Stack align="center">
            <Title order={3} ta="center">
              Assignment Hotel Tidak Ditemukan
            </Title>
            <Text c="dimmed" ta="center">
              Anda belum ditugaskan ke hotel manapun. Silakan hubungi Super Admin.
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Ubah data 'stats' agar sesuai dengan props 'StatsCard'
  const statsData = [
    {
      title: 'Kamar Tersedia',
      value: stats.availableRooms.toString(),
      diff: 0,
    },
    {
      title: 'Check-in Hari Ini',
      value: stats.todayCheckIns.toString(),
      diff: 0,
    },
    {
      title: 'Check-out Hari Ini',
      value: stats.todayCheckOuts.toString(),
      diff: 0,
    },
    {
      title: 'Tamu In-House',
      value: stats.guestsInHouse.toString(),
      diff: 0,
    },
  ];

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
              Manager Dashboard
            </Title>
            <Badge size="lg" color="blue" variant="light">
              {stats.hotelName}
            </Badge>
          </Group>
          <Text c="#475569">Ringkasan operasional hotel Anda hari ini.</Text>
        </div>

        {/* Baris Atas: Stats (Menggunakan StatsCard baru) */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {statsData.map((stat) => (
            <StatsCard key={stat.title} data={stat} />
          ))}
        </SimpleGrid>

        {/* Baris Bawah: Charts & Table (dari template baru) */}
        <Grid>
          {/* Kolom Kiri (1/2): SalesChart untuk Sumber Reservasi */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <SalesChart style={{ height: 450 }} />
          </Grid.Col>

          {/* Kolom Kanan (1/2): OrdersTable untuk Aktivitas Terbaru */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            {/* PERBAIKAN: Props 'withBorder' dan 'p' dihapus 
              karena sudah ada di dalam style default Surface.
            */}
            <Surface style={{ height: 450 }}>
              <Title order={4} mb="md">
                Aktivitas Terbaru
              </Title>
              <OrdersTable
                data={ordersData}
                loading={ordersLoading}
                error={ordersError ? ordersError.toString() : null}
              />
            </Surface>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}