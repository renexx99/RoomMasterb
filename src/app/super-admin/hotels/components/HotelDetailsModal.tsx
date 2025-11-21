'use client';

import { useState } from 'react';
import { Modal, Group, Text, Button, Stack, Image, Grid, Paper, Badge, ThemeIcon, Divider, NumberFormatter, Select, Box } from '@mantine/core';
import { IconBed, IconUsers, IconMapPin, IconCash, IconUserCheck, IconEdit, IconTrash, IconLogin, IconBuildingSkyscraper } from '@tabler/icons-react';
import { HotelWithStats } from '@/core/types/database';
import { startImpersonation } from '@/features/auth/hooks/useAuth'; // Import fungsi helper baru

interface Props {
  opened: boolean;
  onClose: () => void;
  hotel: HotelWithStats | null;
  onEdit: (hotel: HotelWithStats) => void;
  onDelete: (hotel: HotelWithStats) => void;
}

export function HotelDetailsModal({ opened, onClose, hotel, onEdit, onDelete }: Props) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [impersonateLoading, setImpersonateLoading] = useState(false);

  if (!hotel) return null;

  const handleImpersonate = () => {
    if (!selectedRole) return;
    setImpersonateLoading(true);
    
    // Panggil helper impersonasi
    startImpersonation(hotel.id, selectedRole);
    
    // Tidak perlu setImpersonateLoading(false) karena halaman akan reload/redirect
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={<Text fw={700} size="lg">Detail Properti</Text>} 
      size="xl" 
      centered
    >
      <Grid gutter="lg">
        {/* Kolom Kiri: Info Dasar */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack>
            <Image
              src={hotel.image_url || "https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-8.png"}
              radius="md"
              alt={hotel.name}
              h={200}
              fit="cover"
            />
            <div>
                <Text fw={700} size="xl" style={{ lineHeight: 1.2 }}>{hotel.name}</Text>
                <Group gap={8} mt={5}>
                    <Badge size="sm" variant="light" color="gray">{hotel.code}</Badge>
                    <Badge size="sm" color={hotel.status === 'active' ? 'teal' : 'red'}>{hotel.status}</Badge>
                </Group>
            </div>
            
            <Group gap={8} align="flex-start">
              <IconMapPin size={18} style={{ marginTop: 3 }} color="gray" />
              <Text size="sm" c="dimmed" style={{ flex: 1 }}>{hotel.address}</Text>
            </Group>
          </Stack>
        </Grid.Col>

        {/* Kolom Kanan: Statistik & Aksi */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="md">
             {/* --- STATISTIK --- */}
             <Paper withBorder p="md" radius="md" bg="gray.0">
                <Grid gutter="sm">
                    <Grid.Col span={6}>
                        <Group gap={8}>
                            <ThemeIcon variant="light" color="indigo" size="md"><IconBed size={16}/></ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Total Kamar</Text>
                                <Text fw={600}>{hotel.total_rooms}</Text>
                            </div>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Group gap={8}>
                            <ThemeIcon variant="light" color="grape" size="md"><IconUsers size={16}/></ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Total Staff</Text>
                                <Text fw={600}>{hotel.total_staff}</Text>
                            </div>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={6} mt="xs">
                         <Group gap={8}>
                            <ThemeIcon variant="light" color="blue" size="md"><IconUserCheck size={16}/></ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Tamu Aktif</Text>
                                <Text fw={600}>{hotel.active_residents}</Text>
                            </div>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={6} mt="xs">
                        <Group gap={8}>
                            <ThemeIcon variant="light" color="green" size="md"><IconCash size={16}/></ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Revenue</Text>
                                <Text fw={600} c="green.8">
                                    <NumberFormatter prefix="Rp " value={hotel.total_revenue} thousandSeparator="." decimalSeparator="," />
                                </Text>
                            </div>
                        </Group>
                    </Grid.Col>
                </Grid>
             </Paper>

            <Divider my="xs" label="Troubleshooting Access" labelPosition="center" />

            {/* --- LOGIN AS (IMPERSONATE) --- */}
            <Paper withBorder p="sm" radius="md" style={{ borderColor: 'var(--mantine-color-indigo-2)', background: 'var(--mantine-color-indigo-0)' }}>
                <Stack gap="xs">
                    <Group gap="xs">
                        <ThemeIcon color="indigo" variant="filled" size="sm" radius="xl"><IconBuildingSkyscraper size={12}/></ThemeIcon>
                        <Text size="sm" fw={600} c="indigo.9">Akses Dashboard Hotel Ini</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Masuk ke panel hotel ini untuk melakukan pengecekan atau audit.</Text>
                    
                    <Group align="flex-end" gap="xs">
                        <Select 
                            placeholder="Pilih Peran (Role)"
                            data={[
                                { value: 'Hotel Manager', label: 'Hotel Manager (Full Access)' },
                                { value: 'Front Office', label: 'Front Office' },
                                { value: 'Hotel Admin', label: 'Hotel Admin' },
                                // Bisa ditambahkan role lain seperti Housekeeping
                            ]}
                            value={selectedRole}
                            onChange={setSelectedRole}
                            style={{ flex: 1 }}
                            size="sm"
                        />
                        <Button 
                            color="indigo" 
                            size="sm" 
                            leftSection={<IconLogin size={16} />}
                            disabled={!selectedRole}
                            loading={impersonateLoading}
                            onClick={handleImpersonate}
                        >
                            Masuk
                        </Button>
                    </Group>
                </Stack>
            </Paper>

            <Divider my="xs" />

            {/* --- CRUD ACTIONS --- */}
            <Group grow>
                <Button leftSection={<IconEdit size={16} />} variant="default" size="sm" onClick={() => { onClose(); onEdit(hotel); }}>
                    Edit Info
                </Button>
                <Button leftSection={<IconTrash size={16} />} color="red" variant="light" size="sm" onClick={() => { onClose(); onDelete(hotel); }}>
                    Hapus
                </Button>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>
    </Modal>
  );
}