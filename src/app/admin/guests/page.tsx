// src/app/admin/guests/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react'; // Tambahkan useMemo
import {
  Container,
  Title,
  Button,
  Table,
  Group,
  Modal,
  TextInput, // Pastikan ada
  Stack,
  Paper,
  ActionIcon,
  Text,
  Box,
  Loader,
  Center,
  Grid,     // Tambahkan Grid
  Select,   // Tambahkan Select
} from '@mantine/core';
import {
    IconEdit, IconTrash, IconPlus, IconArrowLeft, IconUser, IconMail, IconPhone,
    IconSearch // Tambahkan IconSearch
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Guest } from '@/core/types/database'; // Import Guest type

export default function GuestsManagementPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc'); // Default sort by name A-Z

  const form = useForm({
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
      // phone_number opsional
    },
  });

  useEffect(() => {
    if (profile?.hotel_id) {
      fetchGuests();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.hotel_id]);

  const fetchGuests = async () => {
    if (!profile?.hotel_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('hotel_id', profile.hotel_id);
        // .order('full_name', { ascending: true }); // Hapus sort awal

      if (error) throw error;
      setGuests(data || []);
    } catch (error: any) {
        console.error("Error fetching guests:", error);
      notifications.show({
        title: 'Error Pengambilan Data',
        message: error?.message || 'Gagal mengambil data tamu.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Filter & Sort Logic ---
  const filteredAndSortedGuests = useMemo(() => {
    let result = [...guests];

    // Filter by search term (name, email, phone)
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        result = result.filter(guest =>
            guest.full_name.toLowerCase().includes(lowerSearch) ||
            guest.email.toLowerCase().includes(lowerSearch) ||
            (guest.phone_number && guest.phone_number.includes(searchTerm)) // Phone number exact match or partial
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
        case 'created_at_desc': // Assuming 'created_at' exists in your Guest type
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


  const handleSubmit = async (values: typeof form.values) => {
    // ... (fungsi tetap sama) ...
     if (!profile?.hotel_id) return;
    try {
        const guestData = { hotel_id: profile.hotel_id, full_name: values.full_name, email: values.email, phone_number: values.phone_number || null };
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
    // ... (fungsi tetap sama) ...
    setEditingGuest(guest);
    form.setValues({ full_name: guest.full_name, email: guest.email, phone_number: guest.phone_number || '' });
    setModalOpened(true);
  };

  const handleDelete = async () => {
    // ... (fungsi tetap sama, termasuk cek reservasi) ...
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

  const handleCloseModal = () => {
    // ... (fungsi tetap sama) ...
     setModalOpened(false); setEditingGuest(null); form.reset();
  };

  const handleCloseDeleteModal = () => {
    // ... (fungsi tetap sama) ...
     setDeleteModalOpened(false); setDeleteTarget(null);
  };

  if (loading) {
    // ... (loader tetap sama) ...
     return ( <Center style={{ minHeight: 'calc(100vh - 140px)' }}> <Loader size="xl" /> </Center> );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Gradient */}
      {/* ... (header tetap sama) ... */}
       <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '2rem 0', marginBottom: '2rem', }} >
        <Container size="lg">
          <Group justify="space-between" align="center">
            <div>
              <Group mb="xs">
                <ActionIcon variant="transparent" color="white" onClick={() => router.push('/admin/dashboard')} aria-label="Kembali ke Dashboard Admin" > <IconArrowLeft size={20} /> </ActionIcon>
                <Title order={1} c="white"> Manajemen Tamu </Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}> Kelola data tamu hotel Anda </Text>
            </div>
            <Button leftSection={<IconPlus size={18} />} onClick={() => { setEditingGuest(null); form.reset(); setModalOpened(true); }} variant="white" color="teal" > Tambah Tamu </Button>
          </Group>
        </Container>
      </div>

      <Container size="lg" pb="xl">
        <Stack gap="lg">
            {/* --- Filter & Search Inputs --- */}
             {guests.length > 0 && ( // Tampilkan hanya jika ada data awal
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
             )}


          {/* --- Table --- */}
          {guests.length === 0 && !loading ? (
             // ... (pesan jika tidak ada tamu sama sekali) ...
             <Paper shadow="sm" p="xl" radius="md" withBorder> <Box ta="center"> <Text c="dimmed" mb="md"> Belum ada data tamu. Klik tombol 'Tambah Tamu' di atas. </Text> </Box> </Paper>
          ) : filteredAndSortedGuests.length === 0 ? (
             // Pesan jika filter/search tidak menghasilkan apa-apa
              <Paper shadow="sm" p="lg" radius="md" withBorder>
                   <Text c="dimmed" ta="center" py="xl"> Tidak ada tamu yang cocok dengan pencarian Anda. </Text>
              </Paper>
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
                  {/* Render Filtered & Sorted Guests */}
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

      {/* --- Modals (Tetap Sama) --- */}
      {/* Modal Add/Edit Guest */}
      <Modal opened={modalOpened} onClose={handleCloseModal} title={editingGuest ? 'Edit Data Tamu' : 'Tambah Tamu Baru'} centered >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput label="Nama Lengkap" placeholder="Masukkan nama lengkap" required leftSection={<IconUser size={18} stroke={1.5} />} {...form.getInputProps('full_name')} />
            <TextInput label="Email" placeholder="email@tamu.com" required leftSection={<IconMail size={18} stroke={1.5} />} {...form.getInputProps('email')} />
            <TextInput label="Nomor Telepon (Opsional)" placeholder="0812..." leftSection={<IconPhone size={18} stroke={1.5} />} {...form.getInputProps('phone_number')} />
            <Group justify="flex-end" mt="md"> <Button variant="default" onClick={handleCloseModal}> Batal </Button> <Button type="submit"> {editingGuest ? 'Update Tamu' : 'Simpan Tamu'} </Button> </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal Delete Confirmation */}
      <Modal opened={deleteModalOpened} onClose={handleCloseDeleteModal} title="Konfirmasi Hapus Tamu" centered size="sm" >
        <Stack gap="md"> <Text size="sm"> Apakah Anda yakin ingin menghapus data tamu{' '} <strong>{deleteTarget?.full_name}</strong>? Tindakan ini tidak dapat dibatalkan. </Text> <Group justify="flex-end"> <Button variant="default" onClick={handleCloseDeleteModal} > Batal </Button> <Button color="red" onClick={handleDelete}> Hapus Tamu </Button> </Group> </Stack>
      </Modal>
    </div>
  );
}