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
  Autocomplete,
  ActionIcon,
  Indicator,
  Popover,
  ScrollArea,
  ThemeIcon,
  Divider,
  Button,
  Stack,
  Center,
  Loader,
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
  IconReportAnalytics,
  IconCalendarTime,
  IconChecks,
  IconSearch,
  IconBell,
  IconInfoCircle,
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
  { label: 'Dashboard', icon: IconLayoutDashboard, href: '/manager/dashboard' },
  { label: 'Reports', icon: IconReportAnalytics, href: '/manager/reports' },
  { label: 'Shift', icon: IconCalendarTime, href: '/manager/shifts' },
  { label: 'Approvals', icon: IconChecks, href: '/manager/approvals' },
  { label: 'Room Type', icon: IconCategory, href: '/manager/room-types' },
  { label: 'Manage Rooms', icon: IconBed, href: '/manager/rooms' },
  { label: 'Reservations', icon: IconCalendarEvent, href: '/manager/reservations' },
  { label: 'Guest Folio', icon: IconUsersGroup, href: '/manager/guests' },
];

// --- Mock Data Notifikasi & Search ---
const mockNotifications = [
  { id: 1, title: 'Permintaan Diskon', message: 'Front Office meminta persetujuan diskon 10%', time: '10 menit lalu', icon: IconChecks, color: 'blue' },
  { id: 2, title: 'Laporan Harian', message: 'Laporan pendapatan kemarin siap', time: '1 jam lalu', icon: IconReportAnalytics, color: 'teal' },
  { id: 3, title: 'Komplain Tamu', message: 'Eskalasi komplain dari Kamar 303', time: '3 jam lalu', icon: IconInfoCircle, color: 'red' },
];

const searchData = [
  { value: 'Dashboard', href: '/manager/dashboard' },
  { value: 'Reports', href: '/manager/reports' },
  { value: 'Shift', href: '/manager/shifts' },
  { value: 'Approvals', href: '/manager/approvals' },
];

const NAVBAR_WIDTH_COLLAPSED = rem(80);
const NAVBAR_WIDTH_EXPANDED = rem(280);

function ManagerLayoutContent({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [hotelName, setHotelName] = useState<string>('');
  const [loadingHotel, setLoadingHotel] = useState(true);
  const [isNavbarExpanded, setIsNavbarExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk Waktu dan Greeting
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');

  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Hotel Manager'
  )?.hotel_id;

  // Efek untuk Waktu dan Greeting (ENGLISH VERSION)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Format Tanggal Bahasa Inggris (e.g., "Thursday, Dec 4, 2025")
      const dateOptions: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      };
      setCurrentDate(now.toLocaleDateString('en-US', dateOptions));

      // Greeting Logic (English)
      const hour = now.getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 18) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

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
        setHotelName(data?.name || 'Unknown Hotel');
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
      notifications.show({ title: 'Success', message: 'Logged out successfully', color: 'green' });
      router.push('/auth/login');
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to logout', color: 'red' });
    }
  };

  const handleSearchSubmit = (value: string) => {
    const target = searchData.find((item) => item.value === value);
    if (target) {
      router.push(target.href);
      setSearchQuery('');
    }
  };

  if (authLoading || loadingHotel) {
    return <Center style={{ minHeight: '100vh' }}><Loader size="lg" color="blue" /></Center>;
  }

  return (
    <AppShell
      header={{ height: 70 }}
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
          paddingTop: '70px',
        },
      }}
    >
      {/* --- HEADER --- */}
      <AppShell.Header style={{ borderBottom: '1px solid #e5e7eb', background: 'white', zIndex: 101 }}>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          
          {/* BAGIAN KIRI: Logo, Nama Hotel, DAN Sapaan/Tanggal */}
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            
            {/* Logo & Hotel Name */}
            <Group gap="xs" wrap="nowrap">
              <Box
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                }}
              >
                <IconBuildingSkyscraper size={20} stroke={1.5} color="white" />
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
                <Text size="10px" c="dimmed" tt="uppercase" fw={600}>Manager Panel</Text>
              </Box>
            </Group>

            {/* Divider Pemisah */}
            <Divider orientation="vertical" visibleFrom="md" mx="xs" style={{ height: 24 }} />

            {/* INFO WAKTU & SAPAAN (Pindah ke Kiri - Bahasa Inggris) */}
            <Stack gap={0} visibleFrom="md" style={{ lineHeight: 1 }}>
                <Text size="xs" c="dimmed" fw={500}>{currentDate}</Text>
                <Text size="sm" fw={600} c="blue.7">{greeting}, {profile?.full_name?.split(' ')[0]}</Text>
            </Stack>
          </Group>

          {/* BAGIAN TENGAH: Search Bar */}
          <Box style={{ flex: 1, maxWidth: 400 }} visibleFrom="sm" mx="md">
            <Autocomplete
              placeholder="Search menu..."
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
                        borderColor: '#3b82f6', 
                        boxShadow: '0 0 0 1px #3b82f6', 
                    }
                }
              }}
            />
          </Box>

          {/* BAGIAN KANAN: Notifikasi & Profil */}
          <Group gap="md" wrap="nowrap">
            {/* Notifikasi */}
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
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">Notifications</Text>
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
                    <Button variant="subtle" size="xs" fullWidth color="blue">View All</Button>
                 </Box>
              </Popover.Dropdown>
            </Popover>

            {/* Profile Menu */}
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Avatar color="blue" radius="xl" size="md">
                    {profile?.full_name?.charAt(0) || 'M'}
                  </Avatar>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Box p="xs" pb="sm">
                    <Text size="sm" fw={600}>{profile?.full_name}</Text>
                    <Text size="xs" c="dimmed">Hotel Manager</Text>
                </Box>
                <Divider mb="xs" />
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
                    color: isActive ? '#2563eb' : '#4b5563',
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent', // Blue background
                    '&:hover': {
                      backgroundColor: 'rgba(37, 99, 235, 0.08)',
                      color: '#2563eb',
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

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoleName="Hotel Manager">
      <ManagerLayoutContent>{children}</ManagerLayoutContent>
    </ProtectedRoute>
  );
}