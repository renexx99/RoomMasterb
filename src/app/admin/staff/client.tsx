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
  Box,
  ThemeIcon,
} from '@mantine/core';
import { IconPlus, IconArrowLeft, IconSearch, IconUsers } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
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

  // Konsistensi Layout
  const MAX_WIDTH = 1200;
  
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
        <Paper withBorder p="xl" ta="center" radius="md">
          <Text c="dimmed">Akun Anda belum terhubung dengan Hotel manapun.</Text>
        </Paper>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Ramping */}
      <div style={{ 
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
        padding: '0.75rem 0', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
      }}>
        <Container fluid px="lg">
          <Box maw={MAX_WIDTH} mx="auto">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <ThemeIcon
                  variant="light"
                  color="white"
                  size={34}
                  radius="md"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                >
                  <IconUsers size={18} stroke={1.5} />
                </ThemeIcon>
                <div style={{ lineHeight: 1 }}>
                  <Title order={3} c="white" style={{ fontSize: '1rem', fontWeight: 700 }}>Manajemen Staf</Title>
                  <Text c="white" opacity={0.9} size="xs" mt={2} style={{ fontSize: '0.75rem' }}>Kelola pengguna dan hak akses sistem</Text>
                </div>
              </Group>
              <Button 
                leftSection={<IconPlus size={16} />} 
                onClick={handleOpenCreate} 
                variant="white" 
                color="teal"
                size="xs"
                radius="md"
                fw={600}
              >
                Tambah Staf
              </Button>
            </Group>
          </Box>
        </Container>
      </div>

      {/* Content */}
      <Container fluid px="lg" py="md">
        <Box maw={MAX_WIDTH} mx="auto">
          <Stack gap="md">
            
            {/* Filter Section */}
            <Paper shadow="xs" p="sm" radius="md" withBorder>
              <Grid align="flex-end" gutter="sm">
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <TextInput
                    placeholder="Cari nama, email, atau peran..."
                    leftSection={<IconSearch size={16} stroke={1.5} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                    size="sm"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    placeholder="Urutkan"
                    value={sortBy}
                    onChange={(v) => setSortBy(v || 'name_asc')}
                    data={[
                      { value: 'name_asc', label: 'Nama (A-Z)' },
                      { value: 'name_desc', label: 'Nama (Z-A)' },
                      { value: 'email_asc', label: 'Email (A-Z)' },
                    ]}
                    size="sm"
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Table */}
            <StaffTable 
              data={filteredAndSortedStaff}
              onEdit={handleOpenEdit}
              onAssign={handleOpenAssign}
              onDelete={handleOpenDelete}
            />
          </Stack>
        </Box>
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

      <Modal 
        opened={deleteModalOpened} 
        onClose={() => setDeleteModalOpened(false)} 
        title="Konfirmasi Hapus Akses" 
        centered 
        size="sm"
        radius="md"
      >
        <Stack gap="md">
          <Text size="sm">
             Anda yakin ingin menghapus peran <strong>{deleteTarget?.assignment?.role_name}</strong> untuk staf <strong>{deleteTarget?.full_name}</strong>? 
             Staf tidak akan bisa mengakses dashboard hotel ini lagi.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" size="xs" onClick={() => setDeleteModalOpened(false)} disabled={isSubmitting}>Batal</Button>
            <Button color="red" size="xs" onClick={handleDeleteConfirm} loading={isSubmitting}>Hapus Peran</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}