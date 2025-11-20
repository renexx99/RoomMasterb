'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Paper,
  TextInput,
  Select,
  ActionIcon,
  Text,
  Grid,
  Modal,
} from '@mantine/core';
import {
  IconPlus,
  IconArrowLeft,
  IconSearch,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { Guest } from '@/core/types/database';
import { GuestsTable } from './components/GuestsTable';
import { GuestFormModal } from './components/GuestFormModal';
import { notifications } from '@mantine/notifications';
import { deleteGuest } from './actions';

interface ClientProps {
  initialGuests: Guest[];
  hotelId: string | null;
}

export default function GuestsManagementClient({ initialGuests, hotelId }: ClientProps) {
  const router = useRouter();
  
  // State Data (Diperbarui via props dari Server Component saat revalidatePath)
  // Kita gunakan initialGuests langsung, tapi untuk filter/sort client-side kita butuh memo
  const guests = initialGuests;

  // Modal States
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  // --- Filter & Sort Logic ---
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
      case 'name_desc':
        result.sort((a, b) => b.full_name.localeCompare(a.full_name));
        break;
      case 'email_asc':
        result.sort((a, b) => a.email.localeCompare(b.email));
        break;
      case 'email_desc':
        result.sort((a, b) => b.email.localeCompare(a.email));
        break;
      case 'created_at_desc':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'created_at_asc':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'name_asc':
      default:
        result.sort((a, b) => a.full_name.localeCompare(b.full_name));
        break;
    }

    return result;
  }, [guests, searchTerm, sortBy]);

  // --- Handlers ---

  const handleOpenCreate = () => {
    setEditingGuest(null);
    setModalOpened(true);
  };

  const handleOpenEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setModalOpened(true);
  };

  const handleOpenDelete = (guest: Guest) => {
    setDeleteTarget(guest);
    setDeleteModalOpened(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const result = await deleteGuest(deleteTarget.id);
      
      if (result.error) {
        notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
      } else {
        notifications.show({ title: 'Sukses', message: 'Tamu berhasil dihapus', color: 'green' });
        setDeleteModalOpened(false);
        setDeleteTarget(null);
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
         <Paper withBorder p="xl" ta="center">
           <Text size="lg" fw={500} c="dimmed">
             Akun Anda belum terhubung dengan Hotel manapun.
           </Text>
         </Paper>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '2rem 0', marginBottom: '2rem' }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <div>
              <Group mb="xs">
                <ActionIcon variant="transparent" color="white" onClick={() => router.push('/admin/dashboard')} aria-label="Kembali ke Dashboard">
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Title order={1} c="white">Manajemen Tamu</Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>Kelola data tamu hotel Anda</Text>
            </div>
            <Button leftSection={<IconPlus size={18} />} onClick={handleOpenCreate} variant="white" color="teal">
              Tambah Tamu
            </Button>
          </Group>
        </Container>
      </div>

      {/* Main Content */}
      <Container size="lg" pb="xl">
        <Paper shadow="xs" p="md" radius="md" withBorder mb="lg">
          <Grid align="flex-end" gutter="md">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <TextInput
                label="Cari Tamu"
                placeholder="Cari nama, email, atau no. telepon..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                label="Urutkan"
                value={sortBy}
                onChange={(value) => setSortBy(value || 'name_asc')}
                data={[
                  { value: 'name_asc', label: 'Nama (A-Z)' },
                  { value: 'name_desc', label: 'Nama (Z-A)' },
                  { value: 'email_asc', label: 'Email (A-Z)' },
                  { value: 'email_desc', label: 'Email (Z-A)' },
                  { value: 'created_at_desc', label: 'Terbaru Ditambahkan' },
                  { value: 'created_at_asc', label: 'Terlama Ditambahkan' },
                ]}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        <GuestsTable 
          guests={filteredAndSortedGuests}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
        />
      </Container>

      {/* Modal Form (Add/Edit) */}
      <GuestFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        hotelId={hotelId}
        guestToEdit={editingGuest}
      />

      {/* Modal Delete Confirmation */}
      <Modal 
        opened={deleteModalOpened} 
        onClose={() => setDeleteModalOpened(false)} 
        title="Konfirmasi Hapus Tamu" 
        centered 
        size="sm"
      >
        <Text size="sm" mb="lg">
          Apakah Anda yakin ingin menghapus data tamu <strong>{deleteTarget?.full_name}</strong>? Tindakan ini tidak dapat dibatalkan.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteModalOpened(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button color="red" onClick={handleDeleteConfirm} loading={isSubmitting}>
            Hapus Tamu
          </Button>
        </Group>
      </Modal>
    </div>
  );
}