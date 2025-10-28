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
  { label: 'Dashboard', icon: IconLayoutDashboard, href: '/admin/dashboard' },
  { label: 'Manajemen Tipe Kamar', icon: IconCategory, href: '/admin/room-types' },
  { label: 'Manajemen Kamar', icon: IconBed, href: '/admin/rooms' },
  { label: 'Manajemen Reservasi', icon: IconCalendarEvent, href: '/admin/reservations' },
  { label: 'Manajemen Tamu', icon: IconUsersGroup, href: '/admin/guests' },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const [hotelName, setHotelName] = useState<string>('');
  const [loadingHotel, setLoadingHotel] = useState(true);

  useEffect(() => {
    const fetchHotelInfo = async () => {
      if (!profile?.hotel_id) {
        setLoadingHotel(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('hotels')
          .select('name')
          .eq('id', profile.hotel_id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setHotelName(data.name);
        }
      } catch (error) {
        console.error('Error fetching hotel:', error);
      } finally {
        setLoadingHotel(false);
      }
    };

    fetchHotelInfo();
  }, [profile?.hotel_id]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      notifications.show({
        title: 'Success',
        message: 'Logged out successfully',
        color: 'green',
      });

      router.push('/auth/login');
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to logout',
        color: 'red',
      });
    }
  };

  if (loadingHotel) {
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
        main: { background: '#f5f6fa' },
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
              <Box>
                <Text
                  size="lg"
                  fw={800}
                  style={{
                    color: '#1e293b',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {hotelName || 'Hotel Admin'}
                </Text>
                <Badge size="xs" color="green" variant="light">
                  Hotel Administrator
                </Badge>
              </Box>
            </Group>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <UnstyledButton>
                <Group gap="xs">
                  <Avatar color="teal" radius="xl">
                    {profile?.full_name?.charAt(0) || 'H'}
                  </Avatar>
                  <Box style={{ flex: 1 }} visibleFrom="sm">
                    <Text size="sm" fw={600}>
                      {profile?.full_name || 'Admin'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Hotel Admin
                    </Text>
                  </Box>
                  <IconChevronDown size={16} stroke={1.5} />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>
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
                styles={{
                  root: {
                    borderRadius: rem(8),
                    marginBottom: rem(4),
                    padding: rem(12),
                    fontSize: rem(14),
                    fontWeight: 500,
                    color: isActive ? '#10b981' : '#374151',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                    },
                    "&[dataActive]": {
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                      color: '#10b981',
                      fontWeight: 600,
                      boxShadow: 'inset 0 0 0 1px rgba(16, 185, 129, 0.3)',
                    },
                  },
                  label: {
                    fontSize: rem(14),
                  },
                }}
              />
            );
          })}
        </AppShell.Section>

        <AppShell.Section>
          <NavLink
            label="Logout"
            leftSection={<IconLogout size={20} stroke={1.5} />}
            onClick={handleLogout}
            styles={{
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoleName="hotel_admin">
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </ProtectedRoute>
  );
}