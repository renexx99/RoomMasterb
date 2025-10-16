import { Box, Container, Flex } from '@mantine/core';
import React from 'react';

// Layout ini akan digunakan untuk semua halaman di bawah /auth
// Tujuannya adalah untuk memusatkan konten di tengah layar
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Flex
        align="center"
        justify="center"
        mih="100vh"
        bg="gray.1"
      >
        <Container size="xs" w="100%">
            {children}
        </Container>
      </Flex>
    </Box>
  );
}

