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
  Stack, // Tambahkan Stack
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconLayoutDashboard,
  IconBuilding,
  IconUsers,
  IconLogout,
  IconChevronDown,
  IconBuildingSkyscraper,
  IconSearch,
  IconBell,
  IconInfoCircle,
  IconUserPlus,
  IconHomePlus,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: IconLayoutDashboard, href: '/super-admin/dashboard' },
  { label: 'Manage Properties', icon: IconBuilding, href: '/super-admin/hotels' },
  { label: 'Manage Users', icon: IconUsers, href: '/super-admin/users' },
];

// Data Dummy Notifikasi
const mockNotifications = [
  {
    id: 1,
    title: 'Hotel Baru Terdaftar',
    message: 'Santika baru saja ditambahkan ke sistem.',
    time: '6 hari yang lalu',
    icon: IconHomePlus,
    color: 'teal',
  },
  {
    id: 2,
    title: 'User Baru',
    message: 'Richand ditambahkan sebagai Hotel Manager.',
    time: '7 hari yang lalu',
    icon: IconUserPlus,
    color: 'blue',
  },
  {
    id: 3,
    title: 'Peringatan Sistem',
    message: 'Jadwal maintenance server akan dilakukan besok.',
    time: '3 jam yang lalu',
    icon: IconInfoCircle,
    color: 'orange',
  },
];

// Data untuk Autocomplete Search
const searchData = [
  { value: 'Dashboard', href: '/super-admin/dashboard' },
  { value: 'Manage Properties', href: '/super-admin/hotels' },
  { value: 'Manage Users', href: '/super-admin/users' },
];

const NAVBAR_WIDTH_COLLAPSED = rem(80);
const NAVBAR_WIDTH_EXPANDED = rem(280);

function SuperAdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();

  const [isNavbarExpanded, setIsNavbarExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- STATE UNTUK WAKTU & GREETING (Sama seperti Manager) ---
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('');

  // --- EFEK WAKTU (Sama seperti Manager) ---
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      const dateOptions: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      };
      setCurrentDate(now.toLocaleDateString('en-US', dateOptions));

      const hour = now.getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 18) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <AppShell
      header={{ height: 70 }} // Sedikit dipertinggi agar lebih lega (sama seperti Manager)
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
      <AppShell.Header
        style={{
          borderBottom: '1px solid #e5e7eb',
          background: 'white',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          zIndex: 101,
        }}
      >
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          
          {/* BAGIAN KIRI: Logo, Brand & GREETING */}
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs" wrap="nowrap">
              <Box
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // Gradien Ungu Super Admin
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
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
                <Text size="sm" fw={700} style={{ color: '#1e293b', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                  RoomMaster
                </Text>
                <Text size="10px" c="dimmed" tt="uppercase" fw={600}>Super Admin</Text>
              </Box>
            </Group>

            {/* DIVIDER & GREETING TEXT (Baru Ditambahkan) */}
            <Divider orientation="vertical" visibleFrom="md" mx="xs" style={{ height: 24 }} />

            <Stack gap={0} visibleFrom="md" style={{ lineHeight: 1 }}>
                <Text size="xs" c="dimmed" fw={500}>{currentDate}</Text>
                {/* Menggunakan warna indigo/ungu untuk Super Admin */}
                <Text size="sm" fw={600} c="indigo.7">{greeting}, {profile?.full_name?.split(' ')[0] || 'Admin'}</Text>
            </Stack>
          </Group>

          {/* BAGIAN TENGAH: Global Search */}
          <Box style={{ flex: 1, maxWidth: 480 }} visibleFrom="sm" mx="md">
            <Autocomplete
              placeholder="Cari..."
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
                    color: 'var(--mantine-color-gray-9)',
                    transition: 'all 0.2s ease',
                    '&:placeholder': {
                        color: 'var(--mantine-color-gray-6)',
                    },
                    '&:focus': {
                        backgroundColor: 'white',
                        borderColor: '#6366f1', 
                        boxShadow: '0 0 0 1px #6366f1', 
                    }
                }
              }}
            />
          </Box>

          {/* BAGIAN KANAN: Notifikasi & Profil */}
          <Group gap="sm" wrap="nowrap">
            
            {/* Notifikasi Popover */}
            <Popover width={320} position="bottom-end" withArrow shadow="md">
              <Popover.Target>
                <Indicator inline label="" size={8} color="red" offset={4} processing>
                    <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Notifications">
                        <IconBell size={20} stroke={1.5} />
                    </ActionIcon>
                </Indicator>
              </Popover.Target>
              <Popover.Dropdown p={0}>
                 <Box p="sm" bg="gray.0" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">Notifikasi Terbaru</Text>
                 </Box>
                 
                 <ScrollArea.Autosize mah={300}>
                    {mockNotifications.map((item) => (
                        <UnstyledButton 
                            key={item.id} 
                            p="sm" 
                            style={{ 
                                width: '100%', 
                                borderBottom: '1px solid var(--mantine-color-gray-1)',
                                transition: 'background-color 0.2s' 
                            }}
                            className="hover:bg-gray-50"
                        >
                            <Group align="flex-start" wrap="nowrap">
                                <ThemeIcon variant="light" color={item.color} size="md" radius="md" mt={2}>
                                    <item.icon size={16} />
                                </ThemeIcon>
                                <div style={{ flex: 1 }}>
                                    <Text size="sm" fw={600} lineClamp={1}>{item.title}</Text>
                                    <Text size="xs" c="dimmed" lineClamp={2} mt={2}>{item.message}</Text>
                                    <Text size="10px" c="dimmed" mt={4} ta="right">{item.time}</Text>
                                </div>
                            </Group>
                        </UnstyledButton>
                    ))}
                 </ScrollArea.Autosize>
                 
                 <Box p={8} ta="center">
                    <Button variant="subtle" size="xs" fullWidth color="violet">Lihat Semua</Button>
                 </Box>
              </Popover.Dropdown>
            </Popover>

            <Divider orientation="vertical" style={{ height: 24 }} color="gray.3" />

            {/* Profil Menu */}
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={8}>
                    <Avatar color="violet" radius="xl" size="sm">
                      {profile?.full_name?.charAt(0) || 'A'}
                    </Avatar>
                    <Box style={{ flex: 1 }} visibleFrom="sm">
                      <Text size="xs" fw={600}>{profile?.full_name || 'Admin'}</Text>
                      <Text size="10px" c="dimmed" style={{ lineHeight: 1 }}>Super Admin</Text>
                    </Box>
                    <IconChevronDown size={14} stroke={1.5} color="gray" />
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Account</Menu.Label>
                <Menu.Item leftSection={<IconLogout size={14} stroke={1.5} />} color="red" onClick={handleLogout}>
                  Logout
                </Menu.Item>
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
          boxShadow: '2px 0 4px rgba(0, 0, 0, 0.03)',
          transition: 'width 0.25s ease-in-out',
          display: 'flex',
          flexDirection: 'column', 
        }}
      >
        {/* Bagian Menu Utama */}
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
                styles={(theme) => ({
                  root: {
                    borderRadius: rem(6),
                    marginBottom: rem(2),
                    padding: `${rem(8)} ${rem(10)}`,
                    fontSize: rem(13),
                    fontWeight: 500,
                    color: isActive ? '#6366f1' : '#4b5563', // Indigo active text
                    backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent', // Indigo active bg
                    
                    '&:hover': {
                      background: 'rgba(99, 102, 241, 0.08)',
                      color: '#6366f1',
                    },
                  },
                  label: {
                    fontSize: rem(13),
                    display: isNavbarExpanded ? 'block' : 'none',
                  },
                  leftSection: {
                    marginRight: isNavbarExpanded ? theme.spacing.sm : 0,
                  },
                })}
              />
            );
          })}
        </AppShell.Section>

        {/* Bagian Logout */}
        <AppShell.Section>
          <NavLink
            label={isNavbarExpanded ? 'Logout' : undefined}
            leftSection={<IconLogout size={18} stroke={1.5} />}
            onClick={handleLogout}
            styles={(theme) => ({
              root: {
                borderRadius: rem(6),
                marginTop: rem(2), 
                padding: `${rem(8)} ${rem(10)}`,
                fontSize: rem(13),
                fontWeight: 500,
                color: '#ef4444', 
                
                '&:hover': {
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                },
              },
              label: {
                fontSize: rem(13),
                display: isNavbarExpanded ? 'block' : 'none',
              },
              leftSection: {
                marginRight: isNavbarExpanded ? theme.spacing.sm : 0,
              },
            })}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoleName="Super Admin">
      <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>
    </ProtectedRoute>
  );
}