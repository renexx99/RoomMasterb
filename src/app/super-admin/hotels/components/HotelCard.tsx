'use client';

import { Card, Image, Text, Badge, Group, Box, SimpleGrid, ThemeIcon, UnstyledButton } from '@mantine/core';
import { IconBed, IconUsers, IconMapPin } from '@tabler/icons-react';
import { HotelWithStats } from '@/core/types/database';

interface Props {
  hotel: HotelWithStats;
  onClick: (hotel: HotelWithStats) => void;
}

export function HotelCard({ hotel, onClick }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'teal';
      case 'maintenance': return 'orange';
      case 'suspended': return 'red';
      default: return 'gray';
    }
  };

  return (
    <UnstyledButton onClick={() => onClick(hotel)} style={{ width: '100%' }}>
        <Card 
            shadow="sm" 
            padding="lg" 
            radius="md" 
            withBorder 
            style={{ 
                transition: 'transform 0.2s ease, box-shadow 0.2s ease', 
                height: '100%' 
            }}
            className="hover:shadow-md hover:-translate-y-1"
        >
        <Card.Section>
            <Image
            src={hotel.image_url || "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-8.png"}
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
    </UnstyledButton>
  );
}