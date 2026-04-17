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
  Divider,
  Loader,
  Center,
  Stack,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconLayoutDashboard,
  IconCalendarEvent,
  IconListDetails,
  IconLogout,
  IconBuildingSkyscraper,
  IconFilePlus,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

// --- Navigation Menu ---
interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: IconLayoutDashboard, href: '/ta/dashboard' },
  { label: 'Availability', icon: IconCalendarEvent, href: '/ta/availability' },
  { label: 'Reservations', icon: IconListDetails, href: '/ta/reservations' },
  { label: 'Book Room', icon: IconFilePlus, href: '/ta/book-room' },
];

const NAVBAR_WIDTH_COLLAPSED = rem(72);
const NAVBAR_WIDTH_EXPANDED = rem(260);

function TaLayoutContent({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [hotelName, setHotelName] = useState<string>('');
  const [loadingHotel, setLoadingHotel] = useState(true);
  const [isNavbarExpanded, setIsNavbarExpanded] = useState(false);

  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Travel Agent'
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
        setHotelName(data?.name || 'Hotel Not Found');
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
      notifications.show({ title: 'Signed Out', message: 'You have been logged out.', color: 'gray' });
      router.push('/auth/login');
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to sign out.', color: 'red' });
    }
  };

  if (authLoading || loadingHotel) {
    return <Center style={{ minHeight: '100vh' }}><Loader size="lg" color="dark" /></Center>;
  }

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: isNavbarExpanded ? NAVBAR_WIDTH_EXPANDED : NAVBAR_WIDTH_COLLAPSED,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="0"
      styles={{
        main: {
          background: '#f7f7f7',
          transition: 'padding-left 0.2s ease',
          paddingTop: '64px',
        },
      }}
    >
      {/* ─── HEADER ─── */}
      <AppShell.Header
        style={{
          borderBottom: '1px solid #e0e0e0',
          background: '#ffffff',
          zIndex: 101,
        }}
      >
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          {/* LEFT: Logo & Hotel */}
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs" wrap="nowrap">
              <Box
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '8px',
                  background: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconBuildingSkyscraper size={18} stroke={1.5} color="white" />
              </Box>

              <Box
                visibleFrom="sm"
                style={{
                  opacity: isNavbarExpanded ? 1 : 0,
                  width: isNavbarExpanded ? 'auto' : 0,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  display: opened ? 'block' : 'initial',
                }}
              >
                <Text size="sm" fw={700} style={{ color: '#1a1a1a', whiteSpace: 'nowrap' }}>
                  {hotelName}
                </Text>
                <Text size="10px" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.05em' }}>
                  Travel Agent Portal
                </Text>
              </Box>
            </Group>
          </Group>

          {/* RIGHT: Profile Menu */}
          <Group gap="md" wrap="nowrap">
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs" wrap="nowrap">
                    <Avatar color="dark" radius="xl" size="md" style={{ border: '2px solid #e0e0e0' }}>
                      {profile?.full_name?.charAt(0) || 'T'}
                    </Avatar>
                    <Box visibleFrom="sm">
                      <Text size="sm" fw={600} style={{ color: '#1a1a1a' }}>
                        {profile?.full_name}
                      </Text>
                      <Text size="xs" c="dimmed">Travel Agent</Text>
                    </Box>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Box p="xs" pb="sm">
                  <Text size="sm" fw={600}>{profile?.full_name}</Text>
                  <Text size="xs" c="dimmed">{profile?.email}</Text>
                </Box>
                <Divider mb="xs" />
                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  onClick={handleLogout}
                  style={{ color: '#1a1a1a' }}
                >
                  Sign Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* ─── NAVBAR ─── */}
      <AppShell.Navbar
        p="xs"
        onMouseEnter={() => setIsNavbarExpanded(true)}
        onMouseLeave={() => setIsNavbarExpanded(false)}
        style={{
          borderRight: '1px solid #e0e0e0',
          background: '#ffffff',
          transition: 'width 0.2s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppShell.Section grow>
          <Stack gap={2} mt="xs">
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
                      marginBottom: rem(1),
                      padding: `${rem(10)} ${rem(12)}`,
                      fontWeight: 500,
                      color: isActive ? '#000000' : '#6b7280',
                      backgroundColor: isActive ? '#f0f0f0' : 'transparent',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        color: '#000000',
                      },
                    },
                    label: {
                      fontSize: rem(13),
                      display: isNavbarExpanded ? 'block' : 'none',
                    },
                    leftSection: {
                      marginRight: isNavbarExpanded ? rem(12) : 0,
                      color: isActive ? '#000000' : '#9ca3af',
                    },
                  })}
                />
              );
            })}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Divider mb="xs" color="gray.2" />
          <NavLink
            label={isNavbarExpanded ? 'Sign Out' : undefined}
            leftSection={<IconLogout size={18} stroke={1.5} />}
            onClick={handleLogout}
            styles={() => ({
              root: {
                borderRadius: rem(6),
                padding: `${rem(10)} ${rem(12)}`,
                fontWeight: 500,
                color: '#6b7280',
                '&:hover': {
                  backgroundColor: '#fafafa',
                  color: '#1a1a1a',
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

export default function TaLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoleName="Travel Agent">
      <TaLayoutContent>{children}</TaLayoutContent>
    </ProtectedRoute>
  );
}
