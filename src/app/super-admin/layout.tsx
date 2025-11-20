'use client';

import { useState } from 'react';
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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconLayoutDashboard,
  IconBuilding,
  IconUsers,
  IconLogout,
  IconChevronDown,
  IconBuildingSkyscraper,
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
  { label: 'Manajemen Hotel', icon: IconBuilding, href: '/super-admin/hotels' },
  { label: 'Manajemen User', icon: IconUsers, href: '/super-admin/users' },
];

const NAVBAR_WIDTH_COLLAPSED = rem(80);
const NAVBAR_WIDTH_EXPANDED = rem(280);

function SuperAdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();

  // State untuk sidebar hover
  const [isNavbarExpanded, setIsNavbarExpanded] = useState(false);

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
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 6px rgba(99, 102, 241, 0.3)',
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
                <Text size="xl" fw={800} style={{ color: '#1e293b', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                  RoomMaster
                </Text>
              </Box>
               <Box hiddenFrom="sm">
                 <Text size="xl" fw={800} style={{ color: '#1e293b', letterSpacing: '-0.02em' }}>
                  RoomMaster
                </Text>
              </Box>
            </Group>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <UnstyledButton>
                <Group gap="xs">
                  <Avatar color="violet" radius="xl">
                    {profile?.full_name?.charAt(0) || 'A'}
                  </Avatar>
                  <Box style={{ flex: 1 }} visibleFrom="sm">
                    <Text size="sm" fw={600}>{profile?.full_name || 'Admin'}</Text>
                    <Text size="xs" c="dimmed">Super Admin</Text>
                  </Box>
                  <IconChevronDown size={16} stroke={1.5} />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>
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
                    color: isActive ? '#4f46e5' : '#374151',
                    transition: 'all 0.25s ease',

                    [`@media (max-width: ${theme.breakpoints.sm})`]: {
                      display: opened ? 'flex' : 'none',
                    },
                    
                    justifyContent: isNavbarExpanded ? 'flex-start' : 'center',

                    '&:hover': {
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: '#4f46e5',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)',
                    },
                    '&[dataActive]': {
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                      color: '#4f46e5',
                      fontWeight: 600,
                      boxShadow: 'inset 0 0 0 1px rgba(99, 102, 241, 0.3)',
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

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoleName="Super Admin">
      <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>
    </ProtectedRoute>
  );
}