import { Box, Title, Text, Stack } from '@mantine/core';
import { IconBuildingSkyscraper } from '@tabler/icons-react';
import React from 'react';

export function AuthBranding() {
  return (
    <Box>
      <Stack align="center" gap="lg">
        <IconBuildingSkyscraper size={60} stroke={1.5} />
        <Title order={1} ta="center">
          RoomMaster
        </Title>
        <Text c="dimmed" size="lg" ta="center" maw={400}>
          The All-in-One Property Management System for modern hotel chains.
        </Text>
      </Stack>
    </Box>
  );
}