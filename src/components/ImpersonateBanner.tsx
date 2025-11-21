'use client';

import { useState, useEffect } from 'react';
import { Button, Paper, Text, Group, Box } from '@mantine/core';
import { IconSpy } from '@tabler/icons-react';
import { stopImpersonation } from '@/features/auth/hooks/useAuth';

export function ImpersonateBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [roleName, setRoleName] = useState('');

  useEffect(() => {
    // Cek session storage saat mount
    // Pastikan kode ini hanya berjalan di client side
    if (typeof window !== 'undefined') {
      const data = sessionStorage.getItem('impersonate_data');
      if (data) {
        const parsed = JSON.parse(data);
        setIsImpersonating(true);
        setRoleName(parsed.roleName);
      }
    }
  }, []);

  if (!isImpersonating) return null;

  return (
    <Paper 
      pos="fixed" 
      bottom={20} 
      right={20} 
      p="xs" 
      radius="md" 
      shadow="xl" 
      bg="indigo.6" 
      c="white"
      style={{ zIndex: 9999, border: '2px solid white' }}
    >
      <Group gap="sm">
        <IconSpy size={20} />
        <Box>
            <Text size="xs" fw={700}>IMPERSONATING MODE</Text>
            <Text size="xs" opacity={0.9}>Role: {roleName}</Text>
        </Box>
        <Button 
            size="xs" 
            variant="white" 
            color="dark" 
            onClick={stopImpersonation}
            ml="xs"
        >
            Exit
        </Button>
      </Group>
    </Paper>
  );
}