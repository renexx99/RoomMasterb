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
  Autocomplete,
  ActionIcon,
  Indicator,
  Popover,
  ScrollArea,
  ThemeIcon,
  Divider,
  Button,
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
  IconUsers,
  IconSearch,
  IconBell,
  IconInfoCircle,
  IconMessage,
  IconCalendar,
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
  { label: 'Dashboard', icon: IconLayoutDashboard, href: '/admin/dashboard' },
  { label: 'Tipe Kamar', icon: IconCategory, href: '/admin/room-types' },
  { label: 'Kamar', icon: IconBed, href: '/admin/rooms' },
  { label: 'Reservasi', icon: IconCalendarEvent, href: '/admin/reservations' },
  { label: 'Buku Tamu', icon: IconUsersGroup, href: '/admin/guests' },
  { label: 'Staf Hotel', icon: IconUsers, href: '/admin/staff' },
];

// --- Mock Data ---
const mockNotifications = [
  { id: 1, title: 'Reservasi Baru', message: 'Budi Santoso - Deluxe Room #101', time: '5 menit lalu', icon: IconCalendar, color: 'blue' },
  { id: 2, title: 'Pesan Tamu', message: 'Permintaan extra bed kamar 205', time: '1 jam lalu', icon: IconMessage, color: 'green' },
  { id: 3, title: 'Maintenance', message: 'AC Kamar 303 perlu servis', time: '3 jam lalu', icon: IconInfoCircle, color: 'orange' },
];

const searchData = [
  { value: 'Dashboard', href: '/admin/dashboard' },
  { value: 'Buat Reservasi', href: '/admin/reservations' },
  { value: 'Cek Kamar', href: '/admin/rooms' },
];

const NAVBAR_WIDTH_COLLAPSED = rem(80);
const NAVBAR_WIDTH_EXPANDED = rem(280);

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [hotelName, setHotelName] = useState<string>('');
  const [loadingHotel, setLoadingHotel] = useState(true);
  const [isNavbarExpanded, setIsNavbarExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHotelInfo = async () => {
      const ADMIN_PATH_ROLES = ['Hotel Admin', 'Hotel Manager', 'Front Office'];
      const assignedHotelId = profile?.roles?.find(r => r.hotel_id && ADMIN_PATH_ROLES.includes(r.role_name || ''))?.hotel_id;

      if (!assignedHotelId) {
        setLoadingHotel(false);
        return;
      }
      try {
        setLoadingHotel(true);
        const { data, error } = await supabase.from('hotels').select('name').eq('id', assignedHotelId).maybeSingle();
        if (error) throw error;
        if (data) setHotelName(data.name);
      } catch (error) {
        console.error('Error fetching hotel:', error);
      } finally {
        setLoadingHotel(false);
      }
    };
    if (profile?.roles) fetchHotelInfo();
    else if (!profile && !authLoading) setLoadingHotel(false);
  }, [profile, authLoading]);

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

  const hotelRoleName = profile?.roles?.find(r => r.hotel_id && r.role_name !== 'Super Admin')?.role_name || 'Hotel Admin';

  if (loadingHotel || authLoading) {
    return <Center style={{ minHeight: '100vh' }}><Loader size="lg" color="teal" /></Center>;
  }

  return (
    <AppShell
      header={{ height: 60 }} // Tinggi header compact
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
      {/* Header Full Width */}
      <AppShell.Header style={{ borderBottom: '1px solid #e5e7eb', background: 'white', zIndex: 101 }}>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          
          {/* Kiri: Logo */}
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs" wrap="nowrap">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconBuildingSkyscraper size={18} stroke={1.5} color="white" />
              </Box>
              <Box visibleFrom="sm" style={{
                  opacity: isNavbarExpanded ? 1 : 0,
                  width: isNavbarExpanded ? 'auto' : 0,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  display: opened ? 'block' : 'initial'
              }}>
                <Text size="sm" fw={700} style={{ color: '#1e293b', whiteSpace: 'nowrap' }}>RoomMaster</Text>
              </Box>
            </Group>
          </Group>

          {/* Tengah: Search Bar Lebar */}
          <Box style={{ flex: 1, maxWidth: 600 }} visibleFrom="sm" mx="md">
            <Autocomplete
              placeholder="Cari fitur atau menu..."
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
                        borderColor: '#10b981',
                        boxShadow: '0 0 0 1px #10b981', 
                    }
                }
              }}
            />
          </Box>

          {/* Kanan: Icons & Profile */}
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
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">Notifikasi</Text>
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
              </Popover.Dropdown>
            </Popover>

            <Divider orientation="vertical" style={{ height: 24 }} />

            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={8}>
                    <Avatar color="teal" radius="xl" size="sm">{profile?.full_name?.charAt(0) || 'A'}</Avatar>
                    <Box visibleFrom="sm" style={{ lineHeight: 1 }}>
                      <Text size="xs" fw={600}>{profile?.full_name}</Text>
                      <Text size="10px" c="dimmed">{hotelRoleName}</Text>
                    </Box>
                    <IconChevronDown size={14} stroke={1.5} color="gray" />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>Logout</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="xs"
        onMouseEnter={() => setIsNavbarExpanded(true)}
        onMouseLeave={() => setIsNavbarExpanded(false)}
        style={{
          borderRight: '1px solid #e5e7eb',
          background: 'white',
          boxShadow: '2px 0 4px rgba(0,0,0,0.03)',
          transition: 'width 0.25s ease-in-out',
          display: 'flex', flexDirection: 'column',
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
                onClick={(e) => { e.preventDefault(); router.push(item.href); if (opened) toggle(); }}
                styles={() => ({
                  root: {
                    borderRadius: rem(6),
                    marginBottom: rem(2),
                    padding: `${rem(8)} ${rem(10)}`,
                    fontWeight: 500,
                    color: isActive ? '#10b981' : '#4b5563',
                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#10b981' },
                  },
                  label: { display: isNavbarExpanded ? 'block' : 'none', fontSize: rem(13) },
                  leftSection: { marginRight: isNavbarExpanded ? rem(12) : 0 },
                })}
              />
            );
          })}
        </AppShell.Section>
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
                '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08)' },
              },
              label: { display: isNavbarExpanded ? 'block' : 'none', fontSize: rem(13) },
              leftSection: { marginRight: isNavbarExpanded ? rem(12) : 0 },
            })}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </ProtectedRoute>
  );
}