'use client';

import { Card, Group, Stack, Text, Badge, Divider, ThemeIcon, ActionIcon, Box } from '@mantine/core';
import { 
  IconEdit, IconTrash, IconBed, IconRuler, IconEye, IconInfoCircle 
} from '@tabler/icons-react';
import { RoomType } from '@/core/types/database';

interface Props {
  roomType: RoomType;
  onEdit: (rt: RoomType) => void;
  onDelete: (rt: RoomType) => void;
}

export function RoomTypeCard({ roomType, onEdit, onDelete }: Props) {
  
  // Helper untuk parsing amenities jika bentuknya string JSON (defensive coding)
  const getAmenitiesList = (): string[] => {
    if (Array.isArray(roomType.amenities)) return roomType.amenities;
    if (typeof roomType.amenities === 'string') {
        try { return JSON.parse(roomType.amenities); } catch { return []; }
    }
    return [];
  };

  const amenitiesList = getAmenitiesList();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack gap="sm" style={{ flex: 1 }}>
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Text fw={700} size="lg">{roomType.name}</Text>
            <Text size="xl" fw={700} c="blue" mt={4}>
              Rp {roomType.price_per_night.toLocaleString('id-ID')}
              <Text span size="sm" c="dimmed" fw={400}> /malam</Text>
            </Text>
          </div>
          <Group gap={4}>
            <ActionIcon variant="light" color="blue" onClick={() => onEdit(roomType)}>
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon variant="light" color="red" onClick={() => onDelete(roomType)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Group>

        <Divider />

        {/* Room Details */}
        <Stack gap={6}>
          {roomType.bed_type && (
            <Group gap={8}>
              <ThemeIcon size="sm" variant="light" color="indigo"><IconBed size={14} /></ThemeIcon>
              <Text size="sm">{roomType.bed_count}x {roomType.bed_type}</Text>
            </Group>
          )}
          {roomType.size_sqm && (
            <Group gap={8}>
              <ThemeIcon size="sm" variant="light" color="teal"><IconRuler size={14} /></ThemeIcon>
              <Text size="sm">{roomType.size_sqm} m²</Text>
            </Group>
          )}
          {roomType.view_type && (
            <Group gap={8}>
              <ThemeIcon size="sm" variant="light" color="cyan"><IconEye size={14} /></ThemeIcon>
              <Text size="sm">{roomType.view_type}</Text>
            </Group>
          )}
          <Group gap={8}>
            <ThemeIcon size="sm" variant="light" color="violet"><IconInfoCircle size={14} /></ThemeIcon>
            <Text size="sm">Kapasitas: {roomType.capacity} orang</Text>
          </Group>
        </Stack>

        {/* Amenities Preview */}
        {amenitiesList.length > 0 && (
          <Box mt="auto" pt="sm">
            <Text size="xs" fw={600} c="dimmed" mb={6}>FASILITAS</Text>
            <Group gap={4}>
              {amenitiesList.slice(0, 3).map((amenity, idx) => (
                <Badge key={idx} size="xs" variant="light" color="gray">{amenity}</Badge>
              ))}
              {amenitiesList.length > 3 && (
                <Badge size="xs" variant="light" color="blue">+{amenitiesList.length - 3} lainnya</Badge>
              )}
            </Group>
          </Box>
        )}

        {roomType.smoking_allowed && (
          <Badge size="sm" color="orange" variant="light" mt={4}>Smoking Allowed</Badge>
        )}
      </Stack>
    </Card>
  );
}