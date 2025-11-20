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
  Stack,
} from '@mantine/core';
import { IconPlus, IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient'; // Client Supabase untuk Auth
import { StaffMember } from './page';
import { Role } from '@/core/types/database';
import { StaffTable } from './components/StaffTable';
import { StaffFormModal } from './components/StaffFormModal';
import { RoleAssignmentModal } from './components/RoleAssignmentModal';
import { updateStaffProfile, registerStaffInDb, assignStaffRole, removeStaffRole } from './actions';

interface ClientProps {
  initialStaff: StaffMember[];
  availableRoles: Role[];
  hotelId: string | null;
}

export default function StaffManagementClient({ initialStaff, availableRoles, hotelId }: ClientProps) {
  const router = useRouter();
  
  // Data State
  const staffList = initialStaff;

  // UI State
  const [modalOpened, setModalOpened] = useState(false);
  const [assignModalOpened, setAssignModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  
  const [editingUser, setEditingUser] = useState<StaffMember | null>(null);
  const [assigningUser, setAssigningUser] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  // --- Logic Filter & Sort ---
  const filteredAndSortedStaff = useMemo(() => {
    let result = [...staffList];

    // Filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.full_name.toLowerCase().includes(lower) ||
          s.email.toLowerCase().includes(lower) ||
          (s.assignment?.role_name && s.assignment.role_name.toLowerCase().includes(lower))
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
      case 'name_asc':
      default:
        result.sort((a, b) => a.full_name.localeCompare(b.full_name));
        break;
    }

    return result;
  }, [staffList, searchTerm, sortBy]);

  // --- Handlers ---

  // 1. Create / Update Staff
  const handleSubmitForm = async (values: any) => {
    if (!hotelId) return;
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Update Profile (Server Action)
        const result = await updateStaffProfile(editingUser.id, values.full_name);
        if (result.error) throw new Error(result.error);
        notifications.show({ title: 'Sukses', message: 'Profil diperbarui', color: 'green' });
      } else {
        // Create New User
        // Step A: Auth SignUp (Client Side)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        });
        
        if (authError) throw authError;
        if (!authData.user) throw new Error('Gagal membuat akun Auth');

        // Step B: Insert DB Records (Server Action)
        const result = await registerStaffInDb({
          userId: authData.user.id,
          email: values.email,
          fullName: values.full_name,
          roleId: values.role_id,
          hotelId: hotelId,
        });

        if (result.error) throw new Error(result.error);
        
        notifications.show({ title: 'Sukses', message: 'Staf baru berhasil ditambahkan', color: 'green' });
      }

      setModalOpened(false);
      setEditingUser(null);
    } catch (error: any) {
      notifications.show({ title: 'Error', message: error.message || 'Terjadi kesalahan', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Assign Role
  const handleAssignRole = async (roleId: string) => {
    if (!assigningUser || !hotelId) return;
    setIsSubmitting(true);
    try {
      const result = await assignStaffRole(assigningUser.id, roleId, hotelId);
      if (result.error) throw new Error(result.error);
      
      notifications.show({ title: 'Sukses', message: 'Peran berhasil diubah', color: 'green' });
      setAssignModalOpened(false);
      setAssigningUser(null);
    } catch (error: any) {
      notifications.show({ title: 'Error', message: error.message, color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Delete Role Assignment (Revoke)
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !hotelId) return;
    setIsSubmitting(true);
    try {
      const result = await removeStaffRole(deleteTarget.id, hotelId);
      if (result.error) throw new Error(result.error);

      notifications.show({ title: 'Sukses', message: 'Akses staf dicabut', color: 'green' });
      setDeleteModalOpened(false);
      setDeleteTarget(null);
    } catch (error: any) {
      notifications.show({ title: 'Error', message: error.message, color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Openers
  const handleOpenCreate = () => { setEditingUser(null); setModalOpened(true); };
  const handleOpenEdit = (user: StaffMember) => { setEditingUser(user); setModalOpened(true); };
  const handleOpenAssign = (user: StaffMember) => { setAssigningUser(user); setAssignModalOpened(true); };
  const handleOpenDelete = (user: StaffMember) => { setDeleteTarget(user); setDeleteModalOpened(true); };

  if (!hotelId) {
    return (
      <Container size="lg" py="xl">
        <Paper withBorder p="xl" ta="center"><Text c="dimmed">Akun Anda belum terhubung dengan Hotel manapun.</Text></Paper>
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
                <ActionIcon variant="transparent" color="white" onClick={() => router.push('/admin/dashboard')}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Title order={1} c="white">Manajemen Staf</Title>
              </Group>
              <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>Kelola pengguna dan peran di hotel Anda</Text>
            </div>
            <Button leftSection={<IconPlus size={18} />} onClick={handleOpenCreate} variant="white" color="teal">
              Tambah Staf
            </Button>
          </Group>
        </Container>
      </div>

      {/* Content */}
      <Container size="lg" pb="xl">
        <Stack gap="lg">
          <Paper shadow="xs" p="md" radius="md" withBorder>
            <Grid align="flex-end" gutter="md">
              <Grid.Col span={{ base: 12, md: 8 }}>
                <TextInput
                  label="Cari Staf"
                  placeholder="Cari nama, email, atau peran..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  label="Urutkan"
                  value={sortBy}
                  onChange={(v) => setSortBy(v || 'name_asc')}
                  data={[
                    { value: 'name_asc', label: 'Nama (A-Z)' },
                    { value: 'name_desc', label: 'Nama (Z-A)' },
                    { value: 'email_asc', label: 'Email (A-Z)' },
                  ]}
                />
              </Grid.Col>
            </Grid>
          </Paper>

          <StaffTable 
            data={filteredAndSortedStaff}
            onEdit={handleOpenEdit}
            onAssign={handleOpenAssign}
            onDelete={handleOpenDelete}
          />
        </Stack>
      </Container>

      {/* Modals */}
      <StaffFormModal 
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        userToEdit={editingUser}
        availableRoles={availableRoles}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
      />

      <RoleAssignmentModal 
        opened={assignModalOpened}
        onClose={() => setAssignModalOpened(false)}
        user={assigningUser}
        availableRoles={availableRoles}
        onConfirm={handleAssignRole}
        isSubmitting={isSubmitting}
      />

      <Modal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} title="Konfirmasi Hapus Akses" centered size="sm">
        <Stack gap="md">
          <Text size="sm">
             Anda yakin ingin menghapus peran <strong>{deleteTarget?.assignment?.role_name}</strong> untuk staf <strong>{deleteTarget?.full_name}</strong>? 
             Staf tidak akan bisa mengakses dashboard hotel ini lagi.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteModalOpened(false)} disabled={isSubmitting}>Batal</Button>
            <Button color="red" onClick={handleDeleteConfirm} loading={isSubmitting}>Hapus Peran</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}