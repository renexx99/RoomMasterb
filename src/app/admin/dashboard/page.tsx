// Lokasi: src/app/admin/dashboard/page.tsx

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
  Grid,
  Table, // <-- Impor Tabel
  ThemeIcon, // <-- Impor Ikon
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
import { Reservation, Guest } from '@/core/types/database'; // <-- Impor tipe data Anda

// --- Impor Komponen Template yang Sudah Diperbaiki ---
import SalesChart from '@/components/SalesChart/SalesChart';
import RevenueChart from '@/components/RevenueChart/RevenueChart';
// --- Hapus Impor OrdersTable ---

// --- Tipe data untuk tabel reservasi ---
interface SimpleReservation extends Reservation {
  guest: Pick<Guest, 'full_name'>;
}

// --- Komponen Tabel Reservasi (Menggantikan OrdersTable) ---
function RecentReservationsTable({ hotelId }: { hotelId: string }) {
  const [reservations, setReservations] = useState<SimpleReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select(`*, guest:guests(full_name)`)
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false }) // Ambil yang terbaru
        .limit(5); // Batasi 5 saja

      if (data) {
        setReservations(data as SimpleReservation[]);
      } else {
        console.error('Error fetching recent reservations:', error);
      }
      setLoading(false);
    };

    if (hotelId) {
      fetchReservations();
    }
  }, [hotelId]);

  if (loading) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    );
  }

  if (reservations.length === 0) {
    return (
      <Text c="dimmed" ta="center" p="md">
        Belum ada reservasi terbaru.
      </Text>
    );
  }

  const rows = reservations.map((row) => (
    <Table.Tr key={row.id}>
      <Table.Td>
        <Text fw={500}>{row.guest?.full_name || 'N/A'}</Text>
      </Table.Td>
      <Table.Td>
        {new Date(row.check_in_date + 'T00:00:00').toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
        })}
      </Table.Td>
      <Table.Td>
        <Badge
          color={
            row.payment_status === 'paid'
              ? 'green'
              : row.payment_status === 'pending'
                ? 'orange'
                : 'red'
          }
          variant="light"
        >
          {row.payment_status}
        </Badge>
      </Table.Td>
      <Table.Td>Rp {row.total_price.toLocaleString('id-ID')}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Table verticalSpacing="sm" striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Tamu</Table.Th>
          <Table.Th>Check-in</Table.Th>
          <Table.Th>Status Bayar</Table.Th>
          <Table.Th>Total</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
// --- Akhir Komponen Baru ---

interface DashboardStats {
  availableRooms: number;
  todayCheckIns: number;
  activeReservations: number;
  totalGuests: number;
  hotelName: string;
}

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth(); // Ganti nama loading
  const [stats, setStats] = useState<DashboardStats>({
    availableRooms: 0,
    todayCheckIns: 0,
    activeReservations: 0,
    totalGuests: 0,
    hotelName: '',
  });
  const [loadingStats, setLoadingStats] = useState(true); // Loading terpisah untuk stats

  // Ambil hotelId dari profile.roles
  const [hotelId, setHotelId] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !authLoading) {
      // Cari peran yang memiliki hotel_id (Admin, Manager, atau FO)
      const hotelRole = profile.roles?.find((r) => r.hotel_id);
      
      if (hotelRole?.hotel_id) {
        setHotelId(hotelRole.hotel_id);
      } else {
        console.warn('Profile does not have a valid hotel_id in roles.');
        setLoadingStats(false);
      }
    } else if (!profile && !authLoading) {
        // Jika tidak ada profile setelah loading selesai
        setLoadingStats(false);
    }
  }, [profile, authLoading]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!hotelId) {
        // Jangan fetch jika tidak ada hotelId
        setLoadingStats(false);
        return;
      }

      setLoadingStats(true); // Mulai loading stats
      try {
        // Fetch hotel name
        const { data: hotelData, error: hotelError } = await supabase
          .from('hotels')
          .select('name')
          .eq('id', hotelId)
          .single();

        if (hotelError) throw hotelError;

        // Fetch available rooms
        const { count: availableRoomsCount, error: roomsError } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', hotelId)
          .eq('status', 'available'); // Status dari skema Anda

        if (roomsError) throw roomsError;

        // Fetch today's check-ins
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCheckInsCount, error: checkInError } =
          await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('hotel_id', hotelId)
            .eq('check_in_date', today)
            .neq('payment_status', 'cancelled'); // Bukan yang batal

        if (checkInError) throw checkInError;

        // Fetch active reservations (in-house)
        const { count: activeReservationsCount, error: activeResError } =
          await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('hotel_id', hotelId)
            .lte('check_in_date', today)
            .gte('check_out_date', today)
            .neq('payment_status', 'cancelled');

        if (activeResError) throw activeResError;

        // Fetch total guests
        const { count: totalGuestsCount, error: guestsError } = await supabase
          .from('guests')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', hotelId);

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
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, [hotelId]); // Trigger effect saat hotelId didapatkan

  const dashboardItems = [
    {
      title: 'Kamar Tersedia',
      value: stats.availableRooms.toString(),
      icon: <IconBed size={24} color="#10b981" />,
      color: 'green', // Warna ThemeIcon
    },
    {
      title: 'Check-in Hari Ini',
      value: stats.todayCheckIns.toString(),
      icon: <IconCalendarCheck size={24} color="#3b82f6" />,
      color: 'blue',
    },
    {
      title: 'Tamu In-House', // Diganti dari 'Reservasi Aktif'
      value: stats.activeReservations.toString(),
      icon: <IconClock size={24} color="#f97316" />,
      color: 'orange',
    },
    {
      title: 'Total Tamu Terdaftar',
      value: stats.totalGuests.toString(),
      icon: <IconUsers size={24} color="#8b5cf6" />,
      color: 'violet',
    },
  ];

  // Tampilkan loader utama jika auth atau stats masih loading
  if (authLoading || loadingStats) {
    return (
      <Center style={{ height: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }
  
  // Dapatkan nama peran yang relevan
  const adminRoleName = profile?.roles?.find(r => r.hotel_id)?.role_name || 'Hotel User';

  return (
    <Container fluid p="lg">
      <Stack gap="lg">
        <Title order={2} fw={600}>
          Dashboard Admin
        </Title>

        {/* 4 Kartu Statistik */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {dashboardItems.map((item) => (
            <Card
              key={item.title}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
            >
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text c="dimmed" size="sm" fw={500}>
                    {item.title}
                  </Text>
                  <Text size="xl" fw={700} c={item.color}> {/* Teks tetap berwarna */}
                    {item.value}
                  </Text>
                </div>
                {/* Menggunakan ThemeIcon untuk background ikon */}
                <ThemeIcon color={item.color} variant="light" size={48} radius="md">
                  {item.icon}
                </ThemeIcon>
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
                {adminRoleName}
              </Badge>
            </Group>
          </Stack>
        </Paper>

        {/* --- KOMPONEN DARI TEMPLATE (DIMULAI) --- */}

        {/* 1. Grafik (Menggunakan data dummy dari komponennya) */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <SalesChart withBorder radius="md" />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <RevenueChart withBorder radius="md" />
          </Grid.Col>
        </Grid>

        {/* 2. Tabel (Menggunakan data REAL dari project Anda) */}
        <Title order={3} mt="lg" mb="sm">
          5 Reservasi Terbaru
        </Title>
        <Card withBorder radius="md" p={0}>
          {hotelId ? (
            <RecentReservationsTable hotelId={hotelId} />
          ) : (
            <Text c="dimmed" ta="center" p="md">
              Hotel tidak terdeteksi.
            </Text>
          )}
        </Card>
      </Stack>
    </Container>
  );
}