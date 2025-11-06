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
  Grid, // <--- [BARU] Ditambahkan untuk layout
} from '@mantine/core';
import {
  IconBed,
  IconCalendarCheck,
  IconUsers,
  IconClock,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';

// [BARU] Impor komponen-komponen yang baru saja kamu salin
import SalesChart from '@/components/SalesChart/SalesChart';
import RevenueChart from '@/components/RevenueChart/RevenueChart';
import OrdersTable from '@/components/OrdersTable/OrdersTable';

// [BARU] Data Dummy untuk Uji Coba (diambil dari template)
// Nanti kamu bisa ganti ini dengan data dari Supabase
const salesData = [
  { name: 'Sen', Sales: 4000 },
  { name: 'Sel', Sales: 3000 },
  { name: 'Rab', Sales: 2000 },
  { name: 'Kam', Sales: 2780 },
  { name: 'Jum', Sales: 1890 },
  { name: 'Sab', Sales: 2390 },
  { name: 'Min', Sales: 3490 },
];

const revenueData = [
  { name: 'Jan', Mobile: 300, Desktop: 500 },
  { name: 'Feb', Mobile: 400, Desktop: 550 },
  { name: 'Mar', Mobile: 350, Desktop: 600 },
  { name: 'Apr', Mobile: 500, Desktop: 650 },
  { name: 'Mei', Mobile: 450, Desktop: 700 },
  { name: 'Jun', Mobile: 550, Desktop: 800 },
];

const ordersData = [
  {
    orderId: 'ORD-001',
    customerName: 'John Doe',
    status: 'Completed',
    total: 150.0,
    date: '2024-10-27',
  },
  {
    orderId: 'ORD-002',
    customerName: 'Jane Smith',
    status: 'Pending',
    total: 75.5,
    date: '2024-10-28',
  },
  {
    orderId: 'ORD-003',
    customerName: 'Mike Johnson',
    status: 'Processing',
    total: 220.0,
    date: '2024-10-28',
  },
  {
    orderId: 'ORD-004',
    customerName: 'Emily Davis',
    status: 'Completed',
    total: 80.0,
    date: '2024-10-29',
  },
];
// [BARU] Akhir dari Data Dummy

interface DashboardStats {
  availableRooms: number;
  todayCheckIns: number;
  activeReservations: number;
  totalGuests: number;
  hotelName: string;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    availableRooms: 0,
    todayCheckIns: 0,
    activeReservations: 0,
    totalGuests: 0,
    hotelName: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!profile?.hotel_id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch hotel name
        const { data: hotelData, error: hotelError } = await supabase
          .from('hotels')
          .select('name')
          .eq('id', profile.hotel_id)
          .single();

        if (hotelError) throw hotelError;

        // Fetch available rooms
        const { count: availableRoomsCount, error: roomsError } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', profile.hotel_id)
          .eq('status', 'Available');

        if (roomsError) throw roomsError;

        // Fetch today's check-ins
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCheckInsCount, error: checkInError } =
          await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('hotel_id', profile.hotel_id)
            .eq('check_in_date', today)
            .eq('status', 'Checked-In'); // Asumsi ada status 'Checked-In'

        if (checkInError) throw checkInError;

        // Fetch active reservations
        const { count: activeReservationsCount, error: activeResError } =
          await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('hotel_id', profile.hotel_id)
            .eq('status', 'Active'); // Asumsi ada status 'Active'

        if (activeResError) throw activeResError;

        // Fetch total guests
        const { count: totalGuestsCount, error: guestsError } = await supabase
          .from('guests')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', profile.hotel_id);

        if (guestsError) throw guestsError;

        setStats({
          availableRooms: availableRoomsCount ?? 0,
          todayCheckIns: todayCheckInsCount ?? 0,
          activeReservations: activeReservationsCount ?? 0,
          totalGuests: totalGuestsCount ?? 0,
          hotelName: hotelData?.name ?? 'Hotel Anda',
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [profile]);

  // Ini adalah data untuk 4 kartu statistikmu, yang diambil dari 'stats'
  const dashboardItems = [
    {
      title: 'Kamar Tersedia',
      value: stats.availableRooms.toString(),
      icon: <IconBed size={24} color="#10b981" />,
      color: '#10b981',
    },
    {
      title: 'Check-in Hari Ini',
      value: stats.todayCheckIns.toString(),
      icon: <IconCalendarCheck size={24} color="#3b82f6" />,
      color: '#3b82f6',
    },
    {
      title: 'Reservasi Aktif',
      value: stats.activeReservations.toString(),
      icon: <IconClock size={24} color="#f97316" />,
      color: '#f97316',
    },
    {
      title: 'Total Tamu Terdaftar',
      value: stats.totalGuests.toString(),
      icon: <IconUsers size={24} color="#8b5cf6" />,
      color: '#8b5cf6',
    },
  ];

  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  return (
    <Container fluid p="lg">
      <Stack gap="lg">
        {/* --- KODEMU YANG SUDAH ADA (DIMULAI) --- */}
        <Title order={2} fw={600}>
          Dashboard Admin
        </Title>

        {/* 4 Kartu Statistik (Menggunakan data 'stats' dari Supabase) */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {dashboardItems.map((item) => (
            <Card key={item.title} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text c="dimmed" size="sm" fw={500}>
                    {item.title}
                  </Text>
                  <Text size="xl" fw={700} c={item.color}>
                    {item.value}
                  </Text>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: `${item.color}1A`, // Transparansi 10% dari warna
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

        {/* Welcome Message */}
        <Paper
          shadow="xs"
          p="xl"
          radius="lg"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
          }}
        >
          <Stack gap="md">
            <Title order={3} c="white">
              Selamat Datang, {profile?.full_name}!
            </Title>
            <Text size="lg" c="white" opacity={0.95}>
              Anda mengelola <strong>{stats.hotelName}</strong>. Gunakan menu
              navigasi di sebelah kiri untuk mengelola kamar, reservasi, dan
              tamu.
            </Text>
            <Group mt="md">
              <Badge
                size="lg"
                color="white"
                variant="filled"
                style={{ color: '#10b981' }}
              >
                Hotel Administrator
              </Badge>
            </Group>
          </Stack>
        </Paper>
        {/* --- KODEMU YANG SUDAH ADA (BERAKHIR) --- */}

        {/* --- [BARU] KOMPONEN DARI TEMPLATE (DIMULAI) --- */}
        
        {/* --- [BARU] KOMPONEN DARI TEMPLATE (DIMULAI) --- */}
        
        {/* 1. Grafik (Menggunakan data dummy) */}
        <Grid>
          {/* Grafik Penjualan */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            {/* [PERBAIKAN] Komponen SalesChart sudah merupakan 'Card' sendiri.
              Kita bisa langsung memberikan props seperti 'withBorder' dan 'radius' padanya.
              Catatan: Judul "Sales Overview" sekarang akan datang dari file
              /components/SalesChart/SalesChart.tsx (bisa kamu edit nanti).
            */}
            <SalesChart withBorder radius="md" />
          </Grid.Col>

          {/* Grafik Pendapatan */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            {/* [PERBAIKAN] Sama seperti SalesChart, RevenueChart adalah 'Card' sendiri.
              Catatan: Judul "Revenue by Device" akan datang dari file
              /components/RevenueChart/RevenueChart.tsx (bisa kamu edit nanti).
            */}
            <RevenueChart withBorder radius="md" />
          </Grid.Col>
        </Grid>

        {/* 2. Tabel (Menggunakan data dummy) */}
        <Title order={3} mt="lg" mb="sm">
          Reservasi Terbaru (Contoh)
        </Title>
        <Card withBorder radius="md" p={0}>
          <OrdersTable data={ordersData} />
          {/* TODO: Ganti 'ordersData' dengan 5-10 data reservasi
            terbaru dari tabel 'reservations' di Supabase.
            Komponen OrdersTable mungkin perlu diedit kolomnya
            agar sesuai dengan data reservasi.
          */}
        </Card>
        
        {/* --- [BARU] KOMPONEN DARI TEMPLATE (BERAKHIR) --- */}
      </Stack>
    </Container>
  );
}