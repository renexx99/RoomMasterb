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
      header={{ height: 60 }} // Sedikit diperkecil dari 70
      navbar={{
        width: isNavbarExpanded ? NAVBAR_WIDTH_EXPANDED : NAVBAR_WIDTH_COLLAPSED,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      // PENTING: padding="md" dihapus agar header halaman bisa full-width (mentok)
      padding="0" 
      styles={{
        main: {
          background: '#f5f6fa',
          transition: 'padding-left 0.25s ease',
          paddingTop: '60px', // Kompensasi manual untuk header height karena padding=0
        },
      }}
    >
      <AppShell.Header
        style={{
          borderBottom: '1px solid #e5e7eb',
          background: 'white',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs">
              <Box
                style={{
                  width: 32, // Diperkecil
                  height: 32,
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconBuildingSkyscraper size={18} stroke={1.5} color="white" />
              </Box>
              
              <Box style={{
                  opacity: isNavbarExpanded ? 1 : 0,
                  width: isNavbarExpanded ? 'auto' : 0,
                  overflow: 'hidden',
                  transition: 'opacity 0.2s ease, width 0.2s ease',
                  display: opened ? 'block' : 'initial'
              }}
               visibleFrom="sm" 
              >
                <Text size="sm" fw={700} style={{ color: '#1e293b', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                  RoomMaster
                </Text>
              </Box>
            </Group>
          </Group>

          <Menu shadow="md" width={200}>
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
                  <IconChevronDown size={14} stroke={1.5} />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<IconLogout size={14} stroke={1.5} />} color="red" onClick={handleLogout}>
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="xs" // Padding navbar diperkecil
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
                    padding: `${rem(8)} ${rem(10)}`, // Padding item diperkecil
                    fontSize: rem(13),
                    fontWeight: 500,
                    color: isActive ? '#4f46e5' : '#4b5563',
                    
                    '&:hover': {
                      background: 'rgba(99, 102, 241, 0.08)',
                      color: '#4f46e5',
                    },
                    "&[dataActive]": {
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#4f46e5',
                      fontWeight: 600,
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