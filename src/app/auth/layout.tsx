import { Box } from '@mantine/core';
import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box bg="gray.1" mih="100vh">
      {children}
    </Box>
  );
}