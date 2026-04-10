// src/app/housekeeping/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Group,
  Text,
  Avatar,
  Menu,
  UnstyledButton,
  rem,
  Divider,
  Center,
  Loader,
  Stack,
} from '@mantine/core';
import {
  IconLayoutDashboard,
  IconChecklist,
  IconAlertTriangle,
  IconLogout,
  IconUser,
  IconSpray,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

// Bottom Tab Navigation (mobile-first)
interface TabItem {
  label: string;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  href: string;
}

const tabItems: TabItem[] = [
  { label: 'Dashboard', icon: IconLayoutDashboard, href: '/housekeeping/dashboard' },
  { label: 'My Tasks', icon: IconChecklist, href: '/housekeeping/tasks' },
  { label: 'Report', icon: IconAlertTriangle, href: '/housekeeping/report' },
];

function HousekeepingLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [hotelName, setHotelName] = useState<string>('');
  const [loadingHotel, setLoadingHotel] = useState(true);
  const [greeting, setGreeting] = useState('');

  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Housekeeping'
  )?.hotel_id;

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 18) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    updateGreeting();
    const timer = setInterval(updateGreeting, 60000);
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
      notifications.show({ title: 'Success', message: 'Logged out successfully', color: 'green' });
      router.push('/auth/login');
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to logout', color: 'red' });
    }
  };

  if (authLoading || loadingHotel) {
    return <Center style={{ minHeight: '100vh' }}><Loader size="lg" color="orange" /></Center>;
  }

  return (
    <Box style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#f8f9fa',
    }}>
      {/* ====== TOP HEADER (slim, mobile-friendly) ====== */}
      <Box
        style={{
          height: 60,
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left: Logo & Hotel */}
        <Group gap="sm" wrap="nowrap">
          <Box
            style={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconSpray size={18} stroke={1.5} color="white" />
          </Box>
          <Stack gap={0}>
            <Text size="sm" fw={700} c="white" style={{ lineHeight: 1.2 }}>
              {hotelName}
            </Text>
            <Text size="10px" c="rgba(255,255,255,0.7)" fw={500} tt="uppercase">
              Housekeeping
            </Text>
          </Stack>
        </Group>

        {/* Right: Greeting & Profile */}
        <Group gap="sm" wrap="nowrap">
          <Stack gap={0} visibleFrom="xs" style={{ textAlign: 'right' }}>
            <Text size="xs" c="rgba(255,255,255,0.7)" fw={500}>
              {greeting}
            </Text>
            <Text size="sm" fw={600} c="white" lineClamp={1}>
              {profile?.full_name?.split(' ')[0]}
            </Text>
          </Stack>

          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <UnstyledButton>
                <Avatar
                  color="white"
                  variant="filled"
                  radius="xl"
                  size="md"
                  style={{
                    border: '2px solid rgba(255,255,255,0.4)',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                  }}
                >
                  {profile?.full_name?.charAt(0) || 'H'}
                </Avatar>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Box p="xs" pb="sm">
                <Text size="sm" fw={600}>{profile?.full_name}</Text>
                <Text size="xs" c="dimmed">Housekeeping Staff</Text>
              </Box>
              <Divider mb="xs" />
              <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Box>

      {/* ====== MAIN CONTENT (scrollable) ====== */}
      <Box style={{ flex: 1, overflow: 'auto', paddingBottom: 70 }}>
        {children}
      </Box>

      {/* ====== BOTTOM TAB BAR (mobile-first) ====== */}
      <Box
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 68,
          background: 'white',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 100,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
        }}
      >
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.href);
          return (
            <UnstyledButton
              key={tab.href}
              onClick={() => router.push(tab.href)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '6px 16px',
                borderRadius: 12,
                transition: 'all 0.2s ease',
                background: isActive ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
              }}
            >
              <Box
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'transparent',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(245, 158, 11, 0.3)' : 'none',
                }}
              >
                <Icon
                  size={20}
                  stroke={1.8}
                  color={isActive ? 'white' : '#9ca3af'}
                />
              </Box>
              <Text
                size="10px"
                fw={isActive ? 700 : 500}
                style={{
                  color: isActive ? '#d97706' : '#9ca3af',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </Text>
            </UnstyledButton>
          );
        })}
      </Box>
    </Box>
  );
}

export default function HousekeepingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoleName="Housekeeping">
      <HousekeepingLayoutContent>{children}</HousekeepingLayoutContent>
    </ProtectedRoute>
  );
}
