'use client';

import { Card, Image, Text, Badge, Button, Group, ActionIcon, Menu, Box, SimpleGrid, ThemeIcon } from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconBed, IconUsers, IconMapPin, IconBuildingStore } from '@tabler/icons-react';
import { HotelWithStats } from '@/core/types/database';

interface Props {
  hotel: HotelWithStats;
  onEdit: (hotel: HotelWithStats) => void;
  onDelete: (hotel: HotelWithStats) => void;
}

export function HotelCard({ hotel, onEdit, onDelete }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'teal';
      case 'maintenance': return 'orange';
      case 'suspended': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image
          src={hotel.image_url || "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-8.png"} // Placeholder image
          height={160}
          alt={hotel.name}
          fallbackSrc="https://placehold.co/600x400?text=No+Image"
        />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Box style={{ flex: 1 }}>
            <Group gap="xs" align="center" wrap="nowrap">
                <Text fw={600} size="lg" truncate>{hotel.name}</Text>
                <Badge size="sm" variant="light" color="gray">{hotel.code}</Badge>
            </Group>
            <Group gap={4} mt={4}>
                <IconMapPin size={14} style={{ opacity: 0.6 }} />
                <Text size="sm" c="dimmed" lineClamp={1}>
                {hotel.address}
                </Text>
            </Group>
        </Box>
        
        <Menu withinPortal position="bottom-end" shadow="sm">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(hotel)}>
              Edit Hotel
            </Menu.Item>
            <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => onDelete(hotel)}>
              Hapus Hotel
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Card.Section px="lg" pb="lg">
        <SimpleGrid cols={2} spacing="xs" mt="md">
            <Group gap={8} bg="gray.0" p={8} style={{ borderRadius: 8 }}>
                <ThemeIcon variant="light" color="blue" size="md">
                    <IconBed size={16} />
                </ThemeIcon>
                <Box>
                    <Text size="xs" c="dimmed">Kamar</Text>
                    <Text fw={600} size="sm">{hotel.total_rooms}</Text>
                </Box>
            </Group>

            <Group gap={8} bg="gray.0" p={8} style={{ borderRadius: 8 }}>
                <ThemeIcon variant="light" color="grape" size="md">
                    <IconUsers size={16} />
                </ThemeIcon>
                <Box>
                    <Text size="xs" c="dimmed">Staff</Text>
                    <Text fw={600} size="sm">{hotel.total_staff}</Text>
                </Box>
            </Group>
        </SimpleGrid>

        <Group justify="space-between" mt="md" align="center">
             <Badge color={getStatusColor(hotel.status)} variant="light" fullWidth>
                {hotel.status.toUpperCase()}
            </Badge>
        </Group>
      </Card.Section>
    </Card>
  );
}