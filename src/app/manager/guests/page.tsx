// src/app/manager/guests/page.tsx
'use client';

// (Import semua yang ada di admin/guests)
import { useState, useEffect, useMemo } from 'react';
import {
  Container, Title, Button, Table, Group, Modal, TextInput,
  Stack, Paper, ActionIcon, Text, Box, Loader, Center, Grid, Select,
} from '@mantine/core';
import {
    IconEdit, IconTrash, IconPlus, IconArrowLeft, IconUser, IconMail, IconPhone,
    IconSearch
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth'; // Import useAuth
import { useRouter } from 'next/navigation';
import { Guest } from '@/core/types/database';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'; // Import ProtectedRoute

// --- Komponen Utama ---
function GuestsManagementContent() {
  const { profile, loading: authLoading } = useAuth(); // Gunakan useAuth
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  // Ambil assignedHotelId dari roles
  const assignedHotelId = profile?.roles?.find(r => r.hotel_id && r.role_name === 'Hotel Manager')?.hotel_id;

  // ... (State Modal, Filter, Sort sama seperti admin/guests) ...
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  const form = useForm({
    // ... (Initial values & validation sama seperti admin/guests) ...
    initialValues: {
      full_name: '',
      email: '',
      phone_number: '',
    },
    validate: {
      full_name: (value) => (!value ? 'Nama lengkap harus diisi' : null),
      email: (value) => {
        if (!value) return 'Email harus diisi';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Format email tidak valid';
        return null;
      },
    },
  });

  // --- Data Fetching (Gunakan assignedHotelId) ---
  useEffect(() => {
    if (!authLoading && assignedHotelId) {
      fetchGuests();
    } else if (!authLoading && !assignedHotelId) {
      setLoading(false);
      notifications.show({ title: 'Error', message: 'Anda tidak terhubung ke hotel manapun.', color: 'red' });
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, assignedHotelId]);

  const fetchGuests = async () => {
    if (!assignedHotelId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('hotel_id', assignedHotelId); // Gunakan assignedHotelId
      if (error) throw error;
      setGuests(data || []);
    } catch (error: any) {
        console.error("Error fetching guests:", error);
      notifications.show({ title: 'Error Pengambilan Data', message: error?.message || 'Gagal mengambil data tamu.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  // --- Filter & Sort Logic (Sama) ---
  const filteredAndSortedGuests = useMemo(() => {
    // ... (Logika filter dan sort sama persis seperti admin/guests)
    let result = [...guests];
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        result = result.filter(guest =>
            guest.full_name.toLowerCase().includes(lowerSearch) ||
            guest.email.toLowerCase().includes(lowerSearch) ||
            (guest.phone_number && guest.phone_number.includes(searchTerm))
        );
    }
    switch (sortBy) {
        case 'name_desc': result.sort((a, b) => b.full_name.localeCompare(a.full_name)); break;
        // ... (case sort lainnya)
        case 'created_at_desc': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
        case 'name_asc': default: result.sort((a, b) => a.full_name.localeCompare(b.full_name)); break;
    }
    return result;
  }, [guests, searchTerm, sortBy]);


  // --- Submit, Edit, Delete Handlers (Gunakan assignedHotelId) ---
  const handleSubmit = async (values: typeof form.values) => {
     if (!assignedHotelId) return; // Gunakan assignedHotelId
    try {
        const guestData = { hotel_id: assignedHotelId, full_name: values.full_name, email: values.email, phone_number: values.phone_number || null }; // Gunakan assignedHotelId
      if (editingGuest) {
        const { error } = await supabase.from('guests').update(guestData).eq('id', editingGuest.id);
        if (error) throw error;
        notifications.show({ title: 'Sukses', message: 'Data tamu berhasil diperbarui', color: 'green' });
      } else {
        const { error } = await supabase.from('guests').insert(guestData);
        if (error) throw error;
        notifications.show({ title: 'Sukses', message: 'Tamu baru berhasil ditambahkan', color: 'green' });
      }
      handleCloseModal();
      await fetchGuests();
    } catch (error: any) {
        console.error("Error saving guest:", error);
        if (error?.code === '23505' && error?.message?.includes('guests_email_key')) {
             notifications.show({ title: 'Error Penyimpanan', message: 'Email ini sudah terdaftar untuk tamu lain di hotel ini.', color: 'orange' });
        } else {
             notifications.show({ title: 'Error Penyimpanan', message: error?.message || 'Gagal menyimpan data tamu.', color: 'red' });
        }
    }
  };

  const handleEdit = (guest: Guest) => {
    // ... (logic sama seperti admin/guests)
    setEditingGuest(guest);
    form.setValues({ full_name: guest.full_name, email: guest.email, phone_number: guest.phone_number || '' });
    setModalOpened(true);
  };

  const handleDelete = async () => {
    // ... (logic sama seperti admin/guests)
     if (!deleteTarget) return;
    try {
      const { count, error: checkError } = await supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('guest_id', deleteTarget.id);
      if (checkError) throw checkError;
      if (count !== null && count > 0) {
        notifications.show({ title: 'Gagal Hapus', message: `Tidak dapat menghapus tamu karena memiliki ${count} reservasi terkait. Hapus reservasi terlebih dahulu.`, color: 'orange' });
        setDeleteModalOpened(false); setDeleteTarget(null); return;
      }
      const { error } = await supabase.from('guests').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      notifications.show({ title: 'Sukses', message: 'Data tamu berhasil dihapus', color: 'green' });
      handleCloseDeleteModal();
      await fetchGuests();
    } catch (error: any) {
        console.error("Error deleting guest:", error);
        notifications.show({ title: 'Error Penghapusan', message: error?.message || 'Gagal menghapus data tamu.', color: 'red' });
    }
  };

  // ... (Close Handlers sama) ...
  const handleCloseModal = () => { setModalOpened(false); setEditingGuest(null); form.reset(); };
  const handleCloseDeleteModal = () => { setDeleteModalOpened(false); setDeleteTarget(null); };

  if (loading || authLoading) {
     return ( <Center style={{ minHeight: 'calc(100vh - 140px)' }}> <Loader size="xl" /> </Center> );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Gradient (Biru Manager) */}
       <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', padding: '2rem 0', marginBottom: '2rem', }} >
        <Container size="lg">
          <Group justify="space-between" align="center">
            <div>
              <Group mb="xs">
                {/* Navigasi ke /manager/dashboard */}
                <ActionIcon variant="transparent" color="white" onClick={() => router.push('/manager/dashboard')} aria-label="Kembali ke Dashboard Manager" > <IconArrowLeft size={20} /> </ActionIcon>
                <Title order={1} c="white"> Manajemen Tamu </Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}> Kelola data tamu hotel Anda </Text>
            </div>
            {/* Tombol warna biru */}
            <Button leftSection={<IconPlus size={18} />} onClick={() => { setEditingGuest(null); form.reset(); setModalOpened(true); }} variant="white" color="blue" > Tambah Tamu </Button>
          </Group>
        </Container>
      </div>

      <Container size="lg" pb="xl">
        {/* ... (Seluruh isi JSX <Stack> ... </Stack> sama persis seperti admin/guests) ... */}
        <Stack gap="lg">
            {/* --- Filter & Search Inputs --- */}
             {guests.length > 0 && (
                 <Paper shadow="xs" p="md" radius="md" withBorder mb="lg">
                    <Grid align="flex-end" gutter="md">
                        <Grid.Col span={{ base: 12, md: 8 }}>
                        <TextInput label="Cari Tamu" placeholder="Cari nama, email, atau no. telepon..." leftSection={<IconSearch size={16} />} value={searchTerm} onChange={(event) => setSearchTerm(event.currentTarget.value)} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                        <Select label="Urutkan" value={sortBy} onChange={(value) => setSortBy(value || 'name_asc')}
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
             )}
          {/* --- Table --- */}
          {guests.length === 0 && !loading ? (
             <Paper shadow="sm" p="xl" radius="md" withBorder> <Box ta="center"> <Text c="dimmed" mb="md"> Belum ada data tamu. Klik tombol 'Tambah Tamu' di atas. </Text> </Box> </Paper>
          ) : filteredAndSortedGuests.length === 0 ? (
              <Paper shadow="sm" p="lg" radius="md" withBorder> <Text c="dimmed" ta="center" py="xl"> Tidak ada tamu yang cocok dengan pencarian Anda. </Text> </Paper>
          ) : (
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Table striped highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Nama Lengkap</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Nomor Telepon</Table.Th>
                    <Table.Th ta="center">Aksi</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredAndSortedGuests.map((guest) => (
                    <Table.Tr key={guest.id}>
                      <Table.Td fw={500}>{guest.full_name}</Table.Td>
                      <Table.Td>{guest.email}</Table.Td>
                      <Table.Td>{guest.phone_number || '-'}</Table.Td>
                      <Table.Td>
                        <Group gap="xs" justify="center">
                          <ActionIcon variant="light" color="blue" onClick={() => handleEdit(guest)} aria-label={`Edit tamu ${guest.full_name}`} > <IconEdit size={16} /> </ActionIcon>
                          <ActionIcon variant="light" color="red" onClick={() => { setDeleteTarget(guest); setDeleteModalOpened(true); }} aria-label={`Hapus tamu ${guest.full_name}`} > <IconTrash size={16} /> </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}
        </Stack>
      </Container>

      {/* --- Modals (Sama) --- */}
      <Modal opened={modalOpened} onClose={handleCloseModal} title={editingGuest ? 'Edit Data Tamu' : 'Tambah Tamu Baru'} centered >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput label="Nama Lengkap" placeholder="Masukkan nama lengkap" required leftSection={<IconUser size={18} stroke={1.5} />} {...form.getInputProps('full_name')} />
            <TextInput label="Email" placeholder="email@tamu.com" required leftSection={<IconMail size={18} stroke={1.5} />} {...form.getInputProps('email')} />
            <TextInput label="Nomor Telepon (Opsional)" placeholder="0812..." leftSection={<IconPhone size={18} stroke={1.5} />} {...form.getInputProps('phone_number')} />
            <Group justify="flex-end" mt="md"> <Button variant="default" onClick={handleCloseModal}> Batal </Button> <Button type="submit" color="blue"> {editingGuest ? 'Update Tamu' : 'Simpan Tamu'} </Button> </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={deleteModalOpened} onClose={handleCloseDeleteModal} title="Konfirmasi Hapus Tamu" centered size="sm" >
        <Stack gap="md"> <Text size="sm"> Apakah Anda yakin ingin menghapus data tamu{' '} <strong>{deleteTarget?.full_name}</strong>? Tindakan ini tidak dapat dibatalkan. </Text> <Group justify="flex-end"> <Button variant="default" onClick={handleCloseDeleteModal} > Batal </Button> <Button color="red" onClick={handleDelete}> Hapus Tamu </Button> </Group> </Stack>
      </Modal>
    </div>
  );
}

// Bungkus dengan ProtectedRoute
export default function ManagerGuestsPage() {
  return (
    <ProtectedRoute requiredRoleName="Hotel Manager">
      <GuestsManagementContent />
    </ProtectedRoute>
  );
}