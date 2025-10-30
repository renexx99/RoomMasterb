// src/app/manager/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppShell,
  Burger,
  Group,
  Text,
  NavLink,
  Avatar,
  Menu,
  UnstyledButton,
  Box,
  rem,
  Badge,
  Loader,
  Center,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconLayoutDashboard,
  IconBed,
  IconCalendarEvent,
  IconUsersGroup,
  IconLogout,
  IconChevronDown,
  IconBuildingSkyscraper,
  IconCategory,
  IconReportAnalytics, // <-- TAMBAHKAN ICON INI
} from '@tabler/icons-react'; // Impor icons yang relevan
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  href: string;
}

// Navigasi khusus untuk Hotel Manager
const navItems: NavItem[] = [
  { label: 'Dashboard', icon: IconLayoutDashboard, href: '/manager/dashboard' },
  { label: 'Laporan', icon: IconReportAnalytics, href: '/manager/reports' }, // <-- TAMBAHKAN MENU INI
  { label: 'Tipe Kamar', icon: IconCategory, href: '/manager/room-types' },
  { label: 'Manajemen Kamar', icon: IconBed, href: '/manager/rooms' },
  {
    label: 'Manajemen Reservasi',
    icon: IconCalendarEvent,
    href: '/manager/reservations',
  },
  { label: 'Manajemen Tamu', icon: IconUsersGroup, href: '/manager/guests' },
];

function ManagerLayoutContent({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth(); // Ambil profile dan loading status
  const [hotelName, setHotelName] = useState<string>('');
  const [loadingHotel, setLoadingHotel] = useState(true);

  // Cari hotel_id dari assignment peran user saat ini
  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Hotel Manager'
  )?.hotel_id;

  useEffect(() => {
    const fetchHotelInfo = async () => {
      if (!assignedHotelId) {
        setLoadingHotel(false);
        console.warn(
          'Hotel Manager profile does not have an assigned hotel_id in roles.'
        );
        // Mungkin tampilkan pesan error atau redirect jika tidak ada hotel
        return;
      }

      try {
        setLoadingHotel(true);
        const { data, error } = await supabase
          .from('hotels')
          .select('name')
          .eq('id', assignedHotelId)
          .maybeSingle();

        if (error) throw error;
        setHotelName(data?.name || 'Hotel Tidak Ditemukan');
      } catch (error) {
        console.error('Error fetching hotel:', error);
        setHotelName('Gagal Memuat Nama Hotel');
      } finally {
        setLoadingHotel(false);
      }
    };

    if (!authLoading && profile) {
      // Hanya fetch jika auth selesai loading dan profile ada
      fetchHotelInfo();
    } else if (!authLoading && !profile) {
      setLoadingHotel(false); // Jika tidak ada profile setelah loading, stop loading hotel
    }
  }, [profile, authLoading, assignedHotelId]);

  const handleLogout = async () => {
    // ... (fungsi logout tetap sama seperti di admin/layout)
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      notifications.show({
        title: 'Sukses',
        message: 'Berhasil logout',
        color: 'green',
      });
      router.push('/auth/login');
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Gagal logout',
        color: 'red',
      });
    }
  };

  const managerRoleName =
    profile?.roles?.find((r) => r.role_name === 'Hotel Manager')?.role_name ||
    'Hotel Manager';

  // Tampilkan loader jika auth atau data hotel masih loading
  if (authLoading || loadingHotel) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: { background: '#f5f6fa' }, // Background senada
      }}
    >
      <AppShell.Header
        style={{
          borderBottom: '1px solid #e5e7eb',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Header mirip admin/layout, ganti warna/icon jika perlu */}
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Group gap="xs">
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '8px',
                  // Gunakan gradient hijau yang sama
                  background:
                    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 6px rgba(16, 185, 129, 0.3)',
                }}
              >
                <IconBuildingSkyscraper
                  size={22}
                  stroke={1.5}
                  color="white"
                />
              </Box>
              <Box>
                <Text size="lg" fw={800} style={{ color: '#1e293b' }}>
                  {hotelName || 'Manager Dashboard'} {/* Nama Hotel */}
                </Text>
                <Badge size="xs" color="blue" variant="light">
                  {' '}
                  {/* Badge berbeda? */}
                  {managerRoleName}
                </Badge>
              </Box>
            </Group>
          </Group>

          {/* Menu User (Avatar, Nama, Logout) - Mirip admin/layout */}
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <UnstyledButton>
                <Group gap="xs">
                  <Avatar color="blue" radius="xl">
                    {' '}
                    {/* Warna avatar berbeda? */}
                    {profile?.full_name?.charAt(0) || 'M'}
                  </Avatar>
                  <Box style={{ flex: 1 }} visibleFrom="sm">
                    <Text size="sm" fw={600}>
                      {profile?.full_name || 'Manager'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {managerRoleName}
                    </Text>
                  </Box>
                  <IconChevronDown size={16} stroke={1.5} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Akun</Menu.Label>
              <Menu.Item
                leftSection={<IconLogout size={16} stroke={1.5} />}
                color="red"
                onClick={handleLogout}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="md"
        style={{
          borderRight: '1px solid #e5e7eb',
          background: 'white',
          boxShadow: '2px 0 4px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Sidebar dengan NavLink khusus Manager */}
        <AppShell.Section grow>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                leftSection={<Icon size={20} stroke={1.5} />}
                active={isActive}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                  if (opened) toggle();
                }}
                // Styling NavLink (bisa disamakan dengan admin/layout atau sedikit dibedakan)
                styles={{
                  root: {
                    borderRadius: rem(8),
                    marginBottom: rem(4),
                    padding: rem(12),
                    fontSize: rem(14),
                    fontWeight: 500,
                    // Warna aktif/hover bisa disesuaikan
                    color: isActive ? '#3b82f6' : '#374151', // Contoh: Biru untuk Manager
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      background: 'rgba(59, 130, 246, 0.12)', // Hover biru
                      color: '#3b82f6',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)',
                    },
                    '&[dataActive]': {
                      background:
                        'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)', // Gradien biru
                      color: '#3b82f6',
                      fontWeight: 600,
                      boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.3)',
                    },
                  },
                  label: { fontSize: rem(14) },
                }}
              />
            );
          })}
        </AppShell.Section>
        {/* Tombol Logout */}
        <AppShell.Section>
          <NavLink
            label="Logout"
            leftSection={<IconLogout size={20} stroke={1.5} />}
            onClick={handleLogout}
            styles={{
              /* ... styling sama seperti admin/layout ... */
              root: {
                borderRadius: rem(8),
                padding: rem(12),
                fontSize: rem(14),
                fontWeight: 500,
                color: '#ef4444',
                transition: 'all 0.25s ease',
                '&:hover': {
                  background: 'rgba(239, 68, 68, 0.08)',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.15)',
                },
              },
            }}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

// Export default dengan ProtectedRoute untuk Hotel Manager
export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Pastikan hanya role "Hotel Manager" yang bisa mengakses
    <ProtectedRoute requiredRoleName="Hotel Manager">
      <ManagerLayoutContent>{children}</ManagerLayoutContent>
    </ProtectedRoute>
  );
}