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
  {
    label: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/super-admin/dashboard',
  },
  {
    label: 'Manajemen Hotel',
    icon: IconBuilding,
    href: '/super-admin/hotels',
  },
  {
    label: 'Manajemen User',
    icon: IconUsers,
    href: '/super-admin/users',
  },
];

function SuperAdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();

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
        main: {
          background: '#f8f9fa',
        },
      }}
    >
      {/* Header */}
      <AppShell.Header
        style={{
          borderBottom: '1px solid #e9ecef',
          background: 'white',
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconBuildingSkyscraper size={24} stroke={1.5} color="white" />
              </Box>
              <Text
                size="xl"
                fw={700}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                RoomMaster
              </Text>
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
                    <Text size="sm" fw={500}>
                      {profile?.full_name || 'Admin'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Super Admin
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

      {/* Sidebar */}
      <AppShell.Navbar
        p="md"
        style={{
          borderRight: '1px solid #e9ecef',
          background: 'white',
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
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                        : '#f8f9fa',
                    },
                    '&[data-active]': {
                      background:
                        'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      color: '#667eea',
                      fontWeight: 600,
                    },
                  },
                  label: {
                    fontSize: rem(14),
                    fontWeight: isActive ? 600 : 500,
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
                color: '#fa5252',
                '&:hover': {
                  background: 'rgba(250, 82, 82, 0.1)',
                },
              },
            }}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      {/* Main Content */}
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="super_admin">
      <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>
    </ProtectedRoute>
  );
}