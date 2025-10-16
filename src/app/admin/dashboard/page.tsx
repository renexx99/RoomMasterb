'use client';

import { Container, Title, Text, Paper } from '@mantine/core';

export default function AdminDashboard() {
  return (
    <Container size="lg" mt="xl">
      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <Title order={2} mb="md">
          Hotel Admin Dashboard
        </Title>
        <Text c="dimmed">
          This is a placeholder for the Hotel Admin dashboard. Full functionality will be implemented soon.
        </Text>
      </Paper>
    </Container>
  );
}
