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
  primaryColor: 'blue',
  radius: {
    md: '8px',
  },
});

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        {/* Notifications harus berada di dalam MantineProvider */}
        <Notifications position="top-right" zIndex={1000} />
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
}