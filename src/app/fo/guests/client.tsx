// src/app/fo/guests/client.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Container, Title, Button, Group, Paper, TextInput,
  Select, ActionIcon, Text, Grid, Modal, Stack, Box, ThemeIcon
} from '@mantine/core';
import { IconPlus, IconArrowLeft, IconSearch, IconUsersGroup } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { Guest } from '@/core/types/database';
import { GuestsTable } from './components/GuestsTable';
import { GuestFormModal } from './components/GuestFormModal';
import { deleteGuest } from './actions';

interface ClientProps {
  initialGuests: Guest[];
  hotelId: string | null;
}

export default function GuestsClient({ initialGuests, hotelId }: ClientProps) {
  const router = useRouter();
  const MAX_WIDTH = 1200;

  // State Data
  const guests = initialGuests;

  // UI States
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  // Logic Filter
  const filteredAndSortedGuests = useMemo(() => {
    let result = [...guests];

    // Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(guest =>
        guest.full_name.toLowerCase().includes(lowerSearch) ||
        guest.email.toLowerCase().includes(lowerSearch) ||
        (guest.phone_number && guest.phone_number.includes(searchTerm))
      );
    }

    // Sort
    switch (sortBy) {
      case 'name_desc': result.sort((a, b) => b.full_name.localeCompare(a.full_name)); break;
      case 'email_asc': result.sort((a, b) => a.email.localeCompare(b.email)); break;
      case 'created_desc': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      default: result.sort((a, b) => a.full_name.localeCompare(b.full_name)); break;
    }

    return result;
  }, [guests, searchTerm, sortBy]);

  // Handlers
  const handleOpenCreate = () => { setEditingGuest(null); setModalOpened(true); };
  const handleOpenEdit = (guest: Guest) => { setEditingGuest(guest); setModalOpened(true); };
  const handleOpenDelete = (guest: Guest) => { setDeleteTarget(guest); setDeleteModalOpened(true); };
  const closeModal = () => { setModalOpened(false); setEditingGuest(null); };
  const closeDeleteModal = () => { setDeleteModalOpened(false); setDeleteTarget(null); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const result = await deleteGuest(deleteTarget.id);
      if (result.error) {
        notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
      } else {
        notifications.show({ title: 'Sukses', message: 'Tamu berhasil dihapus', color: 'green' });
        closeDeleteModal();
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Terjadi kesalahan sistem', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hotelId) {
    return (
      <Container size="lg" py="xl">
        <Paper withBorder p="xl" ta="center"><Text c="dimmed">Akun tidak terhubung ke hotel.</Text></Paper>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Ramping (Teal Gradient) */}
      <div style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', padding: '0.75rem 0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <Container fluid px="lg">
          <Box maw={MAX_WIDTH} mx="auto">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <ThemeIcon variant="light" color="white" size="lg" radius="md" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                  <IconUsersGroup size={20} stroke={1.5} />
                </ThemeIcon>
                <div style={{ lineHeight: 1 }}>
                  <Title order={4} c="white" style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>Manajemen Tamu</Title>
                  <Text c="white" opacity={0.8} size="xs" mt={2}>Database profil tamu & riwayat</Text>
                </div>
              </Group>
              <Group gap="xs">
                <ActionIcon variant="white" color="teal" size="lg" radius="md" onClick={() => router.push('/fo/dashboard')} aria-label="Kembali">
                    <IconArrowLeft size={20} />
                </ActionIcon>
                <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate} variant="white" color="teal" size="xs" radius="md" fw={600}>
                    Tambah Tamu
                </Button>
              </Group>
            </Group>
          </Box>
        </Container>
      </div>

      {/* Konten Utama */}
      <Container fluid px="lg" py="md">
        <Box maw={MAX_WIDTH} mx="auto">
          <Stack gap="md">
            
            {/* Filter Section */}
            <Paper shadow="xs" p="sm" radius="md" withBorder>
              <Grid align="flex-end" gutter="sm">
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <TextInput
                    placeholder="Cari nama, email, atau no. telepon..."
                    leftSection={<IconSearch size={16} stroke={1.5} />}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.currentTarget.value)}
                    size="sm"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    value={sortBy}
                    onChange={(value) => setSortBy(value || 'name_asc')}
                    data={[
                      { value: 'name_asc', label: 'Nama (A-Z)' },
                      { value: 'name_desc', label: 'Nama (Z-A)' },
                      { value: 'email_asc', label: 'Email (A-Z)' },
                      { value: 'created_desc', label: 'Terbaru Ditambahkan' },
                    ]}
                    size="sm"
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Tabel Data */}
            <GuestsTable 
              data={filteredAndSortedGuests}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          </Stack>
        </Box>
      </Container>

      {/* Modal Form */}
      <GuestFormModal 
        opened={modalOpened}
        onClose={closeModal}
        hotelId={hotelId}
        guestToEdit={editingGuest}
      />

      {/* Modal Delete */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Konfirmasi Hapus" centered size="sm" radius="md">
        <Stack gap="md">
          <Text size="sm">
            Apakah Anda yakin ingin menghapus data tamu <strong>{deleteTarget?.full_name}</strong>?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" size="xs" onClick={closeDeleteModal} disabled={isSubmitting}>Batal</Button>
            <Button color="red" size="xs" onClick={handleDeleteConfirm} loading={isSubmitting}>Hapus Tamu</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}