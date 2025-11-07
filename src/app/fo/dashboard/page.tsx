'use client';

import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  SimpleGrid,
  Loader, // Ditambahkan
  Center, // Ditambahkan
  Badge, // Ditambahkan
  Group, // Ditambahkan
} from '@mantine/core';
import { useAuth } from '@/features/auth/hooks/useAuth';
import StatsCard from '@/components/Dashboard/StatsCard';
import OrdersTable from '@/components/Dashboard/OrdersTable';
import Surface from '@/components/Dashboard/Surface';
import { useFetchData } from '@/hooks/useFetchData';
import { useEffect, useState } from 'react'; // Ditambahkan
import { supabase } from '@/core/config/supabaseClient'; // Ditambahkan
import { notifications } from '@mantine/notifications'; // Ditambahkan

// Interface untuk stats FO
interface FoDashboardStats {
  todayCheckIns: number;
  todayCheckOuts: number;
  availableRooms: number;
  dirtyRooms: number;
  hotelName: string;
}

export default function FrontOfficeDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<FoDashboardStats>({
    todayCheckIns: 0,
    todayCheckOuts: 0,
    availableRooms: 0,
    dirtyRooms: 0,
    hotelName: '',
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Ambil data dummy untuk tabel
  const {
    data: ordersData,
    loading: ordersLoading,
    error: ordersError,
  } = useFetchData('/mocks/Orders.json');

  // Cari hotel_id dari assignment peran user (asumsi FO juga punya 1 hotel)
  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Front Office',
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

        // 2. Hitung Kamar Tersedia (available)
        const { count: availableCount } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', assignedHotelId)
          .eq('status', 'available');

        // 3. Hitung Kamar Kotor (dirty)
        const { count: dirtyCount } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', assignedHotelId)
          .eq('status', 'dirty');

        // 4. Hitung Check-in Hari Ini
        const { count: checkInsCount } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', assignedHotelId)
          .eq('check_in_date', today)
          .neq('payment_status', 'cancelled');

        // 5. Hitung Check-out Hari Ini
        const { count: checkOutsCount } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', assignedHotelId)
          .eq('check_out_date', today)
          .neq('payment_status', 'cancelled');

        setStats({
          todayCheckIns: checkInsCount || 0,
          todayCheckOuts: checkOutsCount || 0,
          availableRooms: availableCount || 0,
          dirtyRooms: dirtyCount || 0,
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

  // Tampilkan loader
  if (authLoading || loadingStats) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  // Handle jika FO tidak punya hotel assignment
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
  const foStats = [
    {
      title: 'Total Kedatangan',
      value: stats.todayCheckIns.toString(),
      diff: 0,
      period: 'today',
    },
    {
      title: 'Total Keberangkatan',
      value: stats.todayCheckOuts.toString(),
      diff: 0,
      period: 'today',
    },
    {
      title: 'Kamar Tersedia',
      value: stats.availableRooms.toString(),
      diff: 0,
    },
    {
      title: 'Kamar Kotor (Dirty)',
      value: stats.dirtyRooms.toString(),
      diff: 0,
    },
    // Kita bisa tambahkan 'Kamar Bersih' jika di-fetch
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
              Front Office Dashboard
            </Title>
            <Badge size="lg" color="green" variant="light">
              {stats.hotelName}
            </Badge>
          </Group>
          <Text c="#475569">Ringkasan operasional harian hotel.</Text>
        </div>

        {/* Baris Atas: Stats (Menggunakan StatsCard baru) */}
        {/* Menggunakan 4 kolom agar pas */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {foStats.map((stat) => (
            <StatsCard key={stat.title} data={stat} />
          ))}
        </SimpleGrid>

        {/* Baris Bawah: Tabel Penuh */}
        {/* PERBAIKAN: Props 'withBorder' dan 'p' dihapus 
          karena sudah ada di dalam style default Surface.
        */}
        <Surface>
          <Title order={4} mb="md">
            Daftar Tamu Check-in Hari Ini (Data Mock)
          </Title>
          <OrdersTable
            data={ordersData}
            loading={ordersLoading}
            error={ordersError ? ordersError.toString() : null}
          />
        </Surface>
      </Stack>
    </Container>
  );
}