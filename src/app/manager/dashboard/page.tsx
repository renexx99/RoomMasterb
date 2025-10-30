// src/app/manager/dashboard/page.tsx
'use client';

import {
  Container, Title, Text, Card, SimpleGrid, Stack, Group, Paper, Badge, Loader, Center,
} from '@mantine/core';
import {
  IconBed, IconCalendarCheck, IconUsers, IconClock, IconTrendingUp, IconUserStar,
  IconCalendarEvent, // Tambahkan ikon relevan
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { notifications } from '@mantine/notifications';

// Interface untuk stats dashboard Manager
interface ManagerDashboardStats {
  availableRooms: number;
  todayCheckIns: number;
  todayCheckOuts: number; // Mungkin lebih relevan daripada total active reservations
  guestsInHouse: number; // Jumlah tamu yang sedang menginap
  // Tambahkan stats lain jika perlu: Occupancy %, Revenue Today, VIP Arrivals
  hotelName: string;
}

export default function ManagerDashboard() {
  const { profile, loading: authLoading } = useAuth(); // Ambil profile dan loading status
  const [stats, setStats] = useState<ManagerDashboardStats>({
    availableRooms: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    guestsInHouse: 0,
    hotelName: '',
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Cari hotel_id dari assignment peran user saat ini
  const assignedHotelId = profile?.roles?.find(r => r.hotel_id && r.role_name === 'Hotel Manager')?.hotel_id;

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!assignedHotelId) {
        setLoadingStats(false);
        return;
      }

      setLoadingStats(true); // Mulai loading stats
      try {
        const today = new Date().toISOString().split('T')[0];

        // Ambil Nama Hotel
        const { data: hotelData } = await supabase
          .from('hotels')
          .select('name')
          .eq('id', assignedHotelId)
          .maybeSingle();

        // Hitung Kamar Tersedia
        const { count: availableCount } = await supabase.from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', assignedHotelId).eq('status', 'available');

        // Hitung Check-in Hari Ini (tidak dibatalkan)
        const { count: checkInsCount } = await supabase.from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', assignedHotelId).eq('check_in_date', today)
          .neq('payment_status', 'cancelled');

        // Hitung Check-out Hari Ini (tidak dibatalkan)
        const { count: checkOutsCount } = await supabase.from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', assignedHotelId).eq('check_out_date', today)
          .neq('payment_status', 'cancelled');

        // Hitung Tamu In-House (reservasi aktif hari ini)
        // Ini lebih kompleks: check_in <= today AND check_out >= today
        // Mungkin perlu function di Supabase untuk performa lebih baik,
        // tapi kita coba query langsung dulu
        const { count: guestsInHouseCount } = await supabase.from('reservations')
           .select('*', { count: 'exact', head: true })
           .eq('hotel_id', assignedHotelId)
           .lte('check_in_date', today) // Check-in hari ini atau sebelumnya
           .gte('check_out_date', today) // Check-out hari ini atau setelahnya
           .neq('payment_status', 'cancelled'); // Bukan yang batal


        setStats({
          availableRooms: availableCount || 0,
          todayCheckIns: checkInsCount || 0,
          todayCheckOuts: checkOutsCount || 0,
          guestsInHouse: guestsInHouseCount || 0,
          hotelName: hotelData?.name || '',
        });

      } catch (error) {
        console.error('Error fetching manager dashboard stats:', error);
        notifications.show({title: "Error", message: "Gagal memuat statistik dashboard.", color: "red"})
      } finally {
        setLoadingStats(false);
      }
    };

     if (!authLoading && assignedHotelId) { // Hanya fetch jika auth selesai dan hotelId ada
         fetchDashboardStats();
     } else if (!authLoading && !assignedHotelId) {
         setLoadingStats(false); // Jika tidak ada hotelId setelah auth, stop loading
     }
  }, [authLoading, assignedHotelId]); // Trigger effect saat authLoading berubah atau assignedHotelId didapatkan

  // Tampilkan loader jika auth atau stats masih loading
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
                      <Title order={3} ta="center">Assignment Hotel Tidak Ditemukan</Title>
                      <Text c="dimmed" ta="center">
                          Anda belum ditugaskan ke hotel manapun. Silakan hubungi Super Admin.
                      </Text>
                  </Stack>
              </Paper>
          </Container>
      )
  }

  const managerRoleName = profile?.roles?.find(r => r.role_name === 'Hotel Manager')?.role_name || 'Hotel Manager';

  return (
    <Container size="lg" style={{ background: '#f9fafc', borderRadius: 12, padding: '1.5rem' }}>
      <Stack gap="xl">
        {/* Header Dashboard */}
        <div>
          <Group mb="xs">
            <Title order={2} c="#1e293b"> Manager Dashboard </Title>
            <Badge size="lg" color="blue" variant="light"> {/* Warna badge berbeda? */}
              {stats.hotelName}
            </Badge>
          </Group>
          <Text c="#475569">Ringkasan operasional hotel Anda hari ini.</Text>
        </div>

        {/* Kartu Statistik */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {/* Sesuaikan data dan ikon untuk Manager */}
          {[
            { title: 'Kamar Tersedia', value: stats.availableRooms, color: '#10b981', icon: <IconBed size={24} stroke={1.5} color="#10b981" /> },
            { title: 'Check-in Hari Ini', value: stats.todayCheckIns, color: '#3b82f6', icon: <IconCalendarCheck size={24} stroke={1.5} color="#3b82f6" /> },
            { title: 'Check-out Hari Ini', value: stats.todayCheckOuts, color: '#f59e0b', icon: <IconCalendarEvent size={24} stroke={1.5} color="#f59e0b" /> }, // Ganti ikon/warna jika perlu
            { title: 'Tamu In-House', value: stats.guestsInHouse, color: '#8b5cf6', icon: <IconUsers size={24} stroke={1.5} color="#8b5cf6" /> },
            // Tambahkan kartu lain jika perlu (misal: Okupansi, VIP)
          ].map((item) => (
            <Card key={item.title} padding="lg" radius="lg" shadow="xs" style={{ /* ... styling sama ... */
                 background: 'white', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            }}>
              <Group justify="space-between" mb="md">
                <div>
                  <Text size="sm" c="#1e293b" fw={500}>{item.title}</Text>
                  <Text size="xl" fw={700} mt="xs" c={item.color}>{item.value}</Text>
                </div>
                <div style={{ /* ... styling icon wrapper sama ... */
                    width: 48, height: 48, borderRadius: '12px', background: `${item.color}1A`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                 }}>
                  {item.icon}
                </div>
              </Group>
            </Card>
          ))}
        </SimpleGrid>

        {/* Pesan Selamat Datang */}
        <Paper shadow="xs" p="xl" radius="lg" style={{ /* ... styling gradient/warna bisa disesuaikan ... */
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', // Contoh: Gradien biru
            color: 'white',
        }}>
          <Stack gap="md">
            <Title order={3} c="white">
              Selamat Datang, {profile?.full_name}!
            </Title>
            <Text size="lg" c="white" opacity={0.95}>
              Anda mengelola operasional <strong>{stats.hotelName}</strong>. Gunakan menu navigasi untuk melihat detail kamar, reservasi, dan tamu.
            </Text>
            <Group mt="md">
              <Badge size="lg" color="white" variant="filled" style={{ color: '#3b82f6' }}> {/* Warna teks badge disesuaikan */}
                {managerRoleName}
              </Badge>
            </Group>
          </Stack>
        </Paper>

        {/* Tambahkan bagian lain jika perlu (misal: grafik ringkasan, daftar tugas) */}

      </Stack>
    </Container>
  );
}