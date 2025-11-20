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
  IconReportAnalytics,
  IconCalendarTime,
  IconChecks,
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
  { label: 'Dashboard', icon: IconLayoutDashboard, href: '/manager/dashboard' },
  { label: 'Laporan', icon: IconReportAnalytics, href: '/manager/reports' },
  { label: 'Manajemen Shift', icon: IconCalendarTime, href: '/manager/shifts' },
  { label: 'Persetujuan', icon: IconChecks, href: '/manager/approvals' },
  { label: 'Tipe Kamar', icon: IconCategory, href: '/manager/room-types' },
  { label: 'Manajemen Kamar', icon: IconBed, href: '/manager/rooms' },
  { label: 'Manajemen Reservasi', icon: IconCalendarEvent, href: '/manager/reservations' },
  { label: 'Manajemen Tamu', icon: IconUsersGroup, href: '/manager/guests' },
];

// Konstanta Lebar Sidebar
const NAVBAR_WIDTH_COLLAPSED = rem(80);
const NAVBAR_WIDTH_EXPANDED = rem(280);

function ManagerLayoutContent({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [hotelName, setHotelName] = useState<string>('');
  const [loadingHotel, setLoadingHotel] = useState(true);

  // State untuk sidebar hover
  const [isNavbarExpanded, setIsNavbarExpanded] = useState(false);

  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Hotel Manager'
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
        setHotelName('Gagal Memuat Nama Hotel');
      } finally {
        setLoadingHotel(false);
      }
    };

    if (!authLoading && profile) {
      fetchHotelInfo();
    } else if (!authLoading && !profile) {
      setLoadingHotel(false);
    }
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

  const managerRoleName = profile?.roles?.find((r) => r.role_name === 'Hotel Manager')?.role_name || 'Hotel Manager';

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
        width: isNavbarExpanded ? NAVBAR_WIDTH_EXPANDED : NAVBAR_WIDTH_COLLAPSED,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: { 
          background: '#f5f6fa',
          transition: 'padding-left 0.25s ease',
        },
      }}
    >
      <AppShell.Header
        style={{
          borderBottom: '1px solid #e5e7eb',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs">
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 6px rgba(16, 185, 129, 0.3)',
                }}
              >
                <IconBuildingSkyscraper size={22} stroke={1.5} color="white" />
              </Box>
              
              {/* Judul dengan animasi */}
              <Box style={{
                  opacity: isNavbarExpanded ? 1 : 0,
                  width: isNavbarExpanded ? 'auto' : 0,
                  overflow: 'hidden',
                  transition: 'opacity 0.2s ease, width 0.2s ease',
                  display: opened ? 'block' : 'initial'
              }}
               visibleFrom="sm" 
              >
                <Box>
                  <Text size="lg" fw={800} style={{ color: '#1e293b', whiteSpace: 'nowrap' }}>
                    {hotelName || 'Manager Dashboard'}
                  </Text>
                  <Badge size="xs" color="blue" variant="light">
                    {managerRoleName}
                  </Badge>
                </Box>
              </Box>
              
               <Box hiddenFrom="sm">
                <Text size="lg" fw={800} style={{ color: '#1e293b' }}>
                  {hotelName || 'Manager Dashboard'}
                </Text>
              </Box>
            </Group>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <UnstyledButton>
                <Group gap="xs">
                  <Avatar color="blue" radius="xl">
                    {profile?.full_name?.charAt(0) || 'M'}
                  </Avatar>
                  <Box style={{ flex: 1 }} visibleFrom="sm">
                    <Text size="sm" fw={600}>{profile?.full_name || 'Manager'}</Text>
                    <Text size="xs" c="dimmed">{managerRoleName}</Text>
                  </Box>
                  <IconChevronDown size={16} stroke={1.5} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Akun</Menu.Label>
              <Menu.Item leftSection={<IconLogout size={16} stroke={1.5} />} color="red" onClick={handleLogout}>
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="md"
        onMouseEnter={() => setIsNavbarExpanded(true)}
        onMouseLeave={() => setIsNavbarExpanded(false)}
        style={{
          borderRight: '1px solid #e5e7eb',
          background: 'white',
          boxShadow: '2px 0 4px rgba(0, 0, 0, 0.03)',
          transition: 'width 0.25s ease-in-out',
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
                leftSection={<Icon size={20} stroke={1.5} />}
                active={isActive}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                  if (opened) toggle();
                }}
                styles={(theme) => ({
                  root: {
                    borderRadius: rem(8),
                    marginBottom: rem(4),
                    padding: rem(12),
                    fontSize: rem(14),
                    fontWeight: 500,
                    color: isActive ? '#3b82f6' : '#374151',
                    transition: 'all 0.25s ease',
                    
                    [`@media (max-width: ${theme.breakpoints.sm})`]: {
                      display: opened ? 'flex' : 'none',
                    },

                    justifyContent: isNavbarExpanded ? 'flex-start' : 'center',

                    '&:hover': {
                      background: 'rgba(59, 130, 246, 0.12)',
                      color: '#3b82f6',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)',
                    },
                    '&[dataActive]': {
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                      color: '#3b82f6',
                      fontWeight: 600,
                      boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.3)',
                    },
                  },
                  label: {
                    fontSize: rem(14),
                    display: isNavbarExpanded ? 'block' : 'none',
                    opacity: isNavbarExpanded ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                  },
                  leftSection: {
                    marginRight: isNavbarExpanded ? theme.spacing.md : 0,
                    transition: 'margin-right 0.25s ease',
                  },
                })}
              />
            );
          })}
        </AppShell.Section>
        <AppShell.Section>
          <NavLink
            label={isNavbarExpanded ? 'Logout' : undefined}
            leftSection={<IconLogout size={20} stroke={1.5} />}
            onClick={handleLogout}
            styles={(theme) => ({
              root: {
                borderRadius: rem(8),
                padding: rem(12),
                fontSize: rem(14),
                fontWeight: 500,
                color: '#ef4444',
                transition: 'all 0.25s ease',
                
                [`@media (max-width: ${theme.breakpoints.sm})`]: {
                   display: opened ? 'flex' : 'none',
                },
                justifyContent: isNavbarExpanded ? 'flex-start' : 'center',

                '&:hover': {
                  background: 'rgba(239, 68, 68, 0.08)',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.15)',
                },
              },
              label: {
                fontSize: rem(14),
                display: isNavbarExpanded ? 'block' : 'none',
                opacity: isNavbarExpanded ? 1 : 0,
                transition: 'opacity 0.2s ease',
              },
              leftSection: {
                marginRight: isNavbarExpanded ? theme.spacing.md : 0,
                transition: 'margin-right 0.25s ease',
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