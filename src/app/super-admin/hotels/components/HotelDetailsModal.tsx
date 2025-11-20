'use client';

import { Modal, Group, Text, Button, Stack, Image, Grid, Paper, Badge, ThemeIcon, Divider, NumberFormatter } from '@mantine/core';
import { IconBed, IconUsers, IconMapPin, IconCash, IconUserCheck, IconEdit, IconTrash } from '@tabler/icons-react';
import { HotelWithStats } from '@/core/types/database';

interface Props {
  opened: boolean;
  onClose: () => void;
  hotel: HotelWithStats | null;
  onEdit: (hotel: HotelWithStats) => void;
  onDelete: (hotel: HotelWithStats) => void;
}

export function HotelDetailsModal({ opened, onClose, hotel, onEdit, onDelete }: Props) {
  if (!hotel) return null;

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={<Text fw={700} size="lg">{hotel.name}</Text>} 
      size="xl" 
      centered
    >
      <Grid gutter="lg">
        {/* Kolom Kiri: Foto & Info Dasar */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack>
            <Image
              src={hotel.image_url || "https://placehold.co/600x400?text=No+Image"}
              radius="md"
              alt={hotel.name}
              height={200}
              style={{ objectFit: 'cover' }}
            />
            <Group gap="xs">
               <Badge size="lg" color={hotel.status === 'active' ? 'green' : 'red'}>{hotel.status}</Badge>
               <Badge size="lg" variant="outline" color="gray">{hotel.code}</Badge>
            </Group>
            <Group gap={8} align="flex-start">
              <IconMapPin size={20} style={{ marginTop: 2 }} color="gray" />
              <Text size="sm" c="dimmed">{hotel.address}</Text>
            </Group>
          </Stack>
        </Grid.Col>

        {/* Kolom Kanan: Statistik Detail */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="md">
            <Text fw={600} c="dimmed" size="sm" tt="uppercase">Performa & Statistik</Text>
            
            <Grid>
                <Grid.Col span={6}>
                    <Paper withBorder p="md" radius="md">
                        <Group justify="space-between" mb={5}>
                            <Text size="xs" c="dimmed">Total Pendapatan</Text>
                            <ThemeIcon variant="light" color="green" size="sm"><IconCash size={14}/></ThemeIcon>
                        </Group>
                        <Text fw={700} size="lg" c="green.8">
                            <NumberFormatter prefix="Rp " value={hotel.total_revenue} thousandSeparator="." decimalSeparator="," />
                        </Text>
                    </Paper>
                </Grid.Col>
                <Grid.Col span={6}>
                    <Paper withBorder p="md" radius="md">
                         <Group justify="space-between" mb={5}>
                            <Text size="xs" c="dimmed">Tamu Menginap</Text>
                            <ThemeIcon variant="light" color="blue" size="sm"><IconUserCheck size={14}/></ThemeIcon>
                        </Group>
                        <Text fw={700} size="lg" c="blue.8">{hotel.active_residents} Org</Text>
                    </Paper>
                </Grid.Col>
                <Grid.Col span={6}>
                    <Paper withBorder p="md" radius="md">
                         <Group justify="space-between" mb={5}>
                            <Text size="xs" c="dimmed">Jumlah Kamar</Text>
                            <ThemeIcon variant="light" color="indigo" size="sm"><IconBed size={14}/></ThemeIcon>
                        </Group>
                        <Text fw={700} size="lg" c="indigo.8">{hotel.total_rooms} Unit</Text>
                    </Paper>
                </Grid.Col>
                 <Grid.Col span={6}>
                    <Paper withBorder p="md" radius="md">
                         <Group justify="space-between" mb={5}>
                            <Text size="xs" c="dimmed">Total Staff</Text>
                            <ThemeIcon variant="light" color="grape" size="sm"><IconUsers size={14}/></ThemeIcon>
                        </Group>
                        <Text fw={700} size="lg" c="grape.8">{hotel.total_staff} Org</Text>
                    </Paper>
                </Grid.Col>
            </Grid>

            <Divider my="sm" />

            <Group grow>
                <Button leftSection={<IconEdit size={18} />} variant="default" onClick={() => { onClose(); onEdit(hotel); }}>
                    Edit Data Hotel
                </Button>
                <Button leftSection={<IconTrash size={18} />} color="red" variant="light" onClick={() => { onClose(); onDelete(hotel); }}>
                    Hapus Hotel
                </Button>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>
    </Modal>
  );
}