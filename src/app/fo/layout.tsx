// src/app/fo/layout.tsx
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
  Autocomplete,
  ActionIcon,
  Indicator,
  Popover,
  ScrollArea,
  ThemeIcon,
  Divider,
  Button,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconLayoutDashboard,
  IconCalendarEvent,
  IconUsersGroup,
  IconLogout,
  IconChevronDown,
  IconSearch,
  IconUserCheck,
  IconLogin,
  IconCoin,
  IconBook2,
  IconBell,
  IconInfoCircle,
  IconMessage,
  IconBed,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

// --- Navigasi Menu ---
interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: IconLayoutDashboard, href: '/fo/dashboard' },
  { label: 'Proses Check-in/Out', icon: IconLogin, href: '/fo/check-in' },
  { label: 'Reservasi', icon: IconCalendarEvent, href: '/fo/reservations' },
  { label: 'Buku Tamu', icon: IconUsersGroup, href: '/fo/guests' },
  { label: 'Ketersediaan Kamar', icon: IconSearch, href: '/fo/availability' }, // IconSearch diganti di bawah agar tidak duplikat
  { label: 'Billing & Folio', icon: IconCoin, href: '/fo/billing' },
  { label: 'Log Tamu', icon: IconBook2, href: '/fo/log' },
];

// --- Mock Data (Search & Notif) ---
const mockNotifications = [
  { id: 1, title: 'Permintaan Housekeeping', message: 'Kamar 201 minta handuk tambahan', time: '2 menit lalu', icon: IconBed, color: 'blue' },
  { id: 2, title: 'Check-out Segera', message: 'Tamu kamar 105 akan check-out', time: '15 menit lalu', icon: IconLogout, color: 'orange' },
  { id: 3, title: 'Pesan Baru', message: 'Konfirmasi pembayaran dari Tamu VIP', time: '1 jam lalu', icon: IconMessage, color: 'teal' },
];

const searchData = [
  { value: 'Dashboard', href: '/fo/dashboard' },
  { value: 'Check In Tamu', href: '/fo/check-in' },
  { value: 'Cek Ketersediaan', href: '/fo/availability' },
  { value: 'Buat Reservasi', href: '/fo/reservations' },
];

const NAVBAR_WIDTH_COLLAPSED = rem(80);
const NAVBAR_WIDTH_EXPANDED = rem(280);

function FoLayoutContent({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [hotelName, setHotelName] = useState<string>('');
  const [loadingHotel, setLoadingHotel] = useState(true);

  const [isNavbarExpanded, setIsNavbarExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Front Office'
  )?.hotel_id;

  useEffect(() => {
    const fetchHotelInfo = async () => {
      if (!assignedHotelId) {
        setLoadingHotel(false);
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
      } finally {
        setLoadingHotel(false);
      }
    };

    if (!authLoading && profile) fetchHotelInfo();
    else if (!authLoading && !profile) setLoadingHotel(false);
  }, [profile, authLoading, assignedHotelId]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      notifications.show({ title: 'Sukses', message: 'Berhasil logout', color: 'green' });
      router.push('/auth/login');
    } catch {
      notifications.show({ title: 'Error', message: 'Gagal logout', color: 'red' });
    }
  };

  const handleSearchSubmit = (value: string) => {
    const target = searchData.find((item) => item.value === value);
    if (target) {
      router.push(target.href);
      setSearchQuery('');
    }
  };

  const roleName = profile?.roles?.find((r) => r.role_name === 'Front Office')?.role_name || 'Front Office';

  if (authLoading || loadingHotel) {
    return <Center style={{ minHeight: '100vh' }}><Loader size="lg" color="teal" /></Center>;
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: isNavbarExpanded ? NAVBAR_WIDTH_EXPANDED : NAVBAR_WIDTH_COLLAPSED,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="0"
      styles={{
        main: { 
          background: '#f5f6fa',
          transition: 'padding-left 0.25s ease',
          paddingTop: '60px',
        },
      }}
    >
      {/* --- HEADER --- */}
      <AppShell.Header style={{ borderBottom: '1px solid #e5e7eb', background: 'white', zIndex: 101 }}>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          
          {/* Kiri: Logo & Burger */}
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs" wrap="nowrap">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', // Teal Gradient
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(20, 184, 166, 0.3)',
                }}
              >
                <IconUserCheck size={18} stroke={1.5} color="white" />
              </Box>
              
              <Box visibleFrom="sm" style={{
                  opacity: isNavbarExpanded ? 1 : 0,
                  width: isNavbarExpanded ? 'auto' : 0,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  display: opened ? 'block' : 'initial'
              }}>
                <Text size="sm" fw={700} style={{ color: '#1e293b', whiteSpace: 'nowrap' }}>
                  {hotelName}
                </Text>
              </Box>
            </Group>
          </Group>

          {/* Tengah: Search Bar */}
          <Box style={{ flex: 1, maxWidth: 500 }} visibleFrom="sm" mx="md">
            <Autocomplete
              placeholder="Cari menu atau fitur..."
              leftSection={<IconSearch size={16} stroke={1.5} color="var(--mantine-color-gray-6)" />}
              data={searchData.map(item => item.value)}
              value={searchQuery}
              onChange={setSearchQuery}
              onOptionSubmit={handleSearchSubmit}
              size="sm"
              radius="md"
              styles={{
                input: {
                    backgroundColor: 'var(--mantine-color-gray-1)', 
                    border: '1px solid var(--mantine-color-gray-3)',
                    transition: 'all 0.2s ease',
                    '&:focus': {
                        backgroundColor: 'white',
                        borderColor: '#14b8a6', // Teal Border
                        boxShadow: '0 0 0 1px #14b8a6', 
                    }
                }
              }}
            />
          </Box>

          {/* Kanan: Notifikasi & Profil */}
          <Group gap="sm" wrap="nowrap">
            <Popover width={320} position="bottom-end" withArrow shadow="md">
              <Popover.Target>
                <Indicator inline label="" size={8} color="red" offset={4} processing>
                    <ActionIcon variant="subtle" color="gray" size="lg">
                        <IconBell size={20} stroke={1.5} />
                    </ActionIcon>
                </Indicator>
              </Popover.Target>
              <Popover.Dropdown p={0}>
                 <Box p="sm" bg="gray.0" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">Notifikasi FO</Text>
                 </Box>
                 <ScrollArea.Autosize mah={300}>
                    {mockNotifications.map((item) => (
                        <UnstyledButton key={item.id} p="sm" className="hover:bg-gray-50" style={{ width: '100%', borderBottom: '1px solid #f1f3f5' }}>
                            <Group align="flex-start" wrap="nowrap">
                                <ThemeIcon variant="light" color={item.color} size="md" radius="md" mt={2}>
                                    <item.icon size={16} />
                                </ThemeIcon>
                                <div style={{ flex: 1 }}>
                                    <Text size="sm" fw={600}>{item.title}</Text>
                                    <Text size="xs" c="dimmed" lineClamp={2}>{item.message}</Text>
                                    <Text size="10px" c="dimmed" mt={2} ta="right">{item.time}</Text>
                                </div>
                            </Group>
                        </UnstyledButton>
                    ))}
                 </ScrollArea.Autosize>
                 <Box p={8} ta="center">
                    <Button variant="subtle" size="xs" fullWidth color="teal">Lihat Semua</Button>
                 </Box>
              </Popover.Dropdown>
            </Popover>

            <Divider orientation="vertical" style={{ height: 24 }} />

            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={8}>
                    <Avatar color="teal" radius="xl" size="sm">
                      {profile?.full_name?.charAt(0) || 'F'}
                    </Avatar>
                    <Box visibleFrom="sm" style={{ lineHeight: 1 }}>
                      <Text size="xs" fw={600}>{profile?.full_name}</Text>
                      <Text size="10px" c="dimmed">{roleName}</Text>
                    </Box>
                    <IconChevronDown size={14} stroke={1.5} color="gray" />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Akun</Menu.Label>
                <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* --- NAVBAR --- */}
      <AppShell.Navbar
        p="xs"
        onMouseEnter={() => setIsNavbarExpanded(true)}
        onMouseLeave={() => setIsNavbarExpanded(false)}
        style={{
          borderRight: '1px solid #e5e7eb',
          background: 'white',
          boxShadow: '2px 0 4px rgba(0, 0, 0, 0.03)',
          transition: 'width 0.25s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppShell.Section grow>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.href}
                href={item.href}
                label={isNavbarExpanded ? item.label : undefined}
                leftSection={<Icon size={18} stroke={1.5} />}
                active={isActive}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                  if (opened) toggle();
                }}
                styles={() => ({
                  root: {
                    borderRadius: rem(6),
                    marginBottom: rem(2),
                    padding: `${rem(8)} ${rem(10)}`,
                    fontWeight: 500,
                    color: isActive ? '#0d9488' : '#4b5563', // Teal active
                    backgroundColor: isActive ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(20, 184, 166, 0.08)', // Teal hover
                      color: '#0d9488',
                    },
                  },
                  label: {
                    fontSize: rem(13),
                    display: isNavbarExpanded ? 'block' : 'none',
                  },
                  leftSection: {
                    marginRight: isNavbarExpanded ? rem(12) : 0,
                  },
                })}
              />
            );
          })}
        </AppShell.Section>

        {/* Footer / Logout */}
        <AppShell.Section>
          <NavLink
            label={isNavbarExpanded ? 'Logout' : undefined}
            leftSection={<IconLogout size={18} stroke={1.5} />}
            onClick={handleLogout}
            styles={() => ({
              root: {
                borderRadius: rem(6),
                marginTop: rem(2),
                padding: `${rem(8)} ${rem(10)}`,
                fontWeight: 500,
                color: '#ef4444',
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                },
              },
              label: {
                fontSize: rem(13),
                display: isNavbarExpanded ? 'block' : 'none',
              },
              leftSection: {
                marginRight: isNavbarExpanded ? rem(12) : 0,
              },
            })}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

export default function FoLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoleName="Front Office">
      <FoLayoutContent>{children}</FoLayoutContent>
    </ProtectedRoute>
  );
}