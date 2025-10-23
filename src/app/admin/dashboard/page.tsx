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
  IconClock,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';

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
        const { data: hotelData } = await supabase
          .from('hotels')
          .select('name')
          .eq('id', profile.hotel_id)
          .maybeSingle();

        // Count available rooms
        const { count: availableCount } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', profile.hotel_id)
          .eq('status', 'available');

        // Count today's check-ins
        const today = new Date().toISOString().split('T')[0];
        const { count: checkInsCount } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', profile.hotel_id)
          .eq('check_in_date', today)
          .neq('payment_status', 'cancelled');

        // Count active reservations (not cancelled, check-out date >= today)
        const { count: activeReservationsCount } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', profile.hotel_id)
          .gte('check_out_date', today)
          .neq('payment_status', 'cancelled');

        // Count total guests
        const { count: guestsCount } = await supabase
          .from('guests')
          .select('*', { count: 'exact', head: true })
          .eq('hotel_id', profile.hotel_id);

        setStats({
          availableRooms: availableCount || 0,
          todayCheckIns: checkInsCount || 0,
          activeReservations: activeReservationsCount || 0,
          totalGuests: guestsCount || 0,
          hotelName: hotelData?.name || '',
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [profile?.hotel_id]);

  if (loading) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Container size="lg" style={{ background: '#f9fafc', borderRadius: 12, padding: '1.5rem' }}>
      <Stack gap="xl">
        <div>
          <Group mb="xs">
            <Title order={2} c="#1e293b">
              Dashboard
            </Title>
            <Badge size="lg" color="teal" variant="light">
              {stats.hotelName}
            </Badge>
          </Group>
          <Text c="#475569">Selamat datang di dashboard hotel Anda</Text>
        </div>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {[
            {
              title: 'Kamar Tersedia',
              value: stats.availableRooms,
              color: '#10b981',
              icon: <IconBed size={24} stroke={1.5} color="#10b981" />,
            },
            {
              title: 'Check-in Hari Ini',
              value: stats.todayCheckIns,
              color: '#3b82f6',
              icon: <IconCalendarCheck size={24} stroke={1.5} color="#3b82f6" />,
            },
            {
              title: 'Reservasi Aktif',
              value: stats.activeReservations,
              color: '#f59e0b',
              icon: <IconClock size={24} stroke={1.5} color="#f59e0b" />,
            },
            {
              title: 'Total Tamu',
              value: stats.totalGuests,
              color: '#8b5cf6',
              icon: <IconUsers size={24} stroke={1.5} color="#8b5cf6" />,
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
              Anda mengelola <strong>{stats.hotelName}</strong>. Gunakan menu navigasi di sebelah kiri untuk mengelola kamar, reservasi, dan tamu.
            </Text>
            <Group mt="md">
              <Badge size="lg" color="white" variant="filled" style={{ color: '#10b981' }}>
                Hotel Administrator
              </Badge>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}