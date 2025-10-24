// src/app/admin/guests/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Table,
  Group,
  Modal,
  TextInput,
  Stack,
  Paper,
  ActionIcon,
  Text,
  Box,
  Loader,
  Center,
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconArrowLeft, IconUser, IconMail, IconPhone } from '@tabler/icons-react';
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
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);

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
        .eq('hotel_id', profile.hotel_id)
        .order('full_name', { ascending: true });

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

  const handleSubmit = async (values: typeof form.values) => {
    if (!profile?.hotel_id) return;

    try {
        const guestData = {
            hotel_id: profile.hotel_id,
            full_name: values.full_name,
            email: values.email,
            phone_number: values.phone_number || null, // Pastikan null jika kosong
        };

      if (editingGuest) {
        const { error } = await supabase
          .from('guests')
          .update(guestData)
          .eq('id', editingGuest.id);

        if (error) throw error;
        notifications.show({
          title: 'Sukses',
          message: 'Data tamu berhasil diperbarui',
          color: 'green',
        });
      } else {
        const { error } = await supabase
          .from('guests')
          .insert(guestData);

        if (error) throw error;
        notifications.show({
          title: 'Sukses',
          message: 'Tamu baru berhasil ditambahkan',
          color: 'green',
        });
      }
      handleCloseModal();
      await fetchGuests(); // Refresh data
    } catch (error: any) {
        console.error("Error saving guest:", error);
        // Cek spesifik untuk unique constraint violation
        if (error?.code === '23505' && error?.message?.includes('guests_email_key')) {
             notifications.show({
                title: 'Error Penyimpanan',
                message: 'Email ini sudah terdaftar untuk tamu lain di hotel ini.',
                color: 'orange',
            });
        } else {
             notifications.show({
                title: 'Error Penyimpanan',
                message: error?.message || 'Gagal menyimpan data tamu.',
                color: 'red',
            });
        }
    }
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    form.setValues({
      full_name: guest.full_name,
      email: guest.email,
      phone_number: guest.phone_number || '',
    });
    setModalOpened(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
       // Cek apakah tamu memiliki reservasi
      const { count, error: checkError } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('guest_id', deleteTarget.id);

      if (checkError) throw checkError;

      if (count !== null && count > 0) {
        notifications.show({
          title: 'Gagal Hapus',
          message: `Tidak dapat menghapus tamu karena memiliki ${count} reservasi terkait. Hapus reservasi terlebih dahulu.`,
          color: 'orange',
        });
        setDeleteModalOpened(false);
        setDeleteTarget(null);
        return; // Stop deletion
      }

      // Lanjutkan penghapusan jika tidak ada reservasi
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      notifications.show({
        title: 'Sukses',
        message: 'Data tamu berhasil dihapus',
        color: 'green',
      });
      handleCloseDeleteModal();
      await fetchGuests(); // Refresh data
    } catch (error: any) {
        console.error("Error deleting guest:", error);
      notifications.show({
        title: 'Error Penghapusan',
        message: error?.message || 'Gagal menghapus data tamu.',
        color: 'red',
      });
    }
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingGuest(null);
    form.reset();
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpened(false);
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Gradient */}
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '2rem 0',
          marginBottom: '2rem',
        }}
      >
        <Container size="lg">
          <Group justify="space-between" align="center">
            <div>
              <Group mb="xs">
                <ActionIcon
                  variant="transparent"
                  color="white"
                  onClick={() => router.push('/admin/dashboard')}
                  aria-label="Kembali ke Dashboard Admin"
                >
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Title order={1} c="white">
                  Manajemen Tamu
                </Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                Kelola data tamu hotel Anda
              </Text>
            </div>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => {
                setEditingGuest(null);
                form.reset();
                setModalOpened(true);
              }}
              variant="white"
              color="teal"
            >
              Tambah Tamu
            </Button>
          </Group>
        </Container>
      </div>

      <Container size="lg" pb="xl">
        <Stack gap="lg">
          {guests.length === 0 && !loading ? (
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Box ta="center">
                <Text c="dimmed" mb="md">
                  Belum ada data tamu. Klik tombol 'Tambah Tamu' di atas.
                </Text>
                 {/* Tombol dipindah ke header */}
              </Box>
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
                  {guests.map((guest) => (
                    <Table.Tr key={guest.id}>
                      <Table.Td fw={500}>{guest.full_name}</Table.Td>
                      <Table.Td>{guest.email}</Table.Td>
                      <Table.Td>{guest.phone_number || '-'}</Table.Td>
                      <Table.Td>
                        <Group gap="xs" justify="center">
                          <ActionIcon
                            variant="light" color="blue"
                            onClick={() => handleEdit(guest)}
                            aria-label={`Edit tamu ${guest.full_name}`}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light" color="red"
                            onClick={() => {
                              setDeleteTarget(guest);
                              setDeleteModalOpened(true);
                            }}
                            aria-label={`Hapus tamu ${guest.full_name}`}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
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

      {/* Modal Add/Edit Guest */}
      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={editingGuest ? 'Edit Data Tamu' : 'Tambah Tamu Baru'}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              required
              leftSection={<IconUser size={18} stroke={1.5} />}
              {...form.getInputProps('full_name')}
            />
            <TextInput
              label="Email"
              placeholder="email@tamu.com"
              required
              leftSection={<IconMail size={18} stroke={1.5} />}
              {...form.getInputProps('email')}
            />
            <TextInput
              label="Nomor Telepon (Opsional)"
              placeholder="0812..."
              leftSection={<IconPhone size={18} stroke={1.5} />}
              {...form.getInputProps('phone_number')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={handleCloseModal}>
                Batal
              </Button>
              <Button type="submit">
                {editingGuest ? 'Update Tamu' : 'Simpan Tamu'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal Delete Confirmation */}
      <Modal
        opened={deleteModalOpened}
        onClose={handleCloseDeleteModal}
        title="Konfirmasi Hapus Tamu"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Apakah Anda yakin ingin menghapus data tamu{' '}
            <strong>{deleteTarget?.full_name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={handleCloseDeleteModal}
            >
              Batal
            </Button>
            <Button color="red" onClick={handleDelete}>
              Hapus Tamu
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}