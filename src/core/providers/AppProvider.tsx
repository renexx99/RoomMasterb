'use client';

import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Inisialisasi TanStack Query client
const queryClient = new QueryClient();

// Definisikan tema dasar untuk Mantine
const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  primaryColor: 'indigo', // sedikit lebih lembut dari 'blue'
  radius: {
    md: '8px',
  },
  components: {
    NavLink: {
      styles: {
        root: {
          borderRadius: '8px',
          fontWeight: 500,
          color: '#374151',
          transition: 'all 0.25s ease',
          '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.12)', // hover ungu lembut
            color: '#4f46e5',
            boxShadow: '0 2px 6px rgba(99, 102, 241, 0.15)',
          },
          "&[dataActive]": {
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            color: '#4f46e5',
            fontWeight: 600,
            boxShadow: 'inset 0 0 0 1px rgba(99, 102, 241, 0.3)',
          },
        },
      },
    },
  },
});

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <Notifications position="top-right" zIndex={1000} />
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
}
