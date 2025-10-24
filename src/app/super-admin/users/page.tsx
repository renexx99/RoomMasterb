'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Title,
  Button,
  Table,
  Group,
  Modal,
  TextInput,
  PasswordInput,
  Stack,
  Paper,
  ActionIcon,
  Text,
  Box,
  Loader,
  Badge,
  Select,
  Grid,
  SegmentedControl, // Pastikan ini diimpor
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconArrowLeft, IconCheck, IconSearch } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { Profile, Hotel } from '@/core/types/database';

interface UserWithHotel extends Profile {
  hotel?: Hotel;
}

function UserManagementContent() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithHotel[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]); // Masih dibutuhkan untuk modal Assign
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpened, setModalOpened] = useState(false);
  const [assignModalOpened, setAssignModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithHotel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserWithHotel | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserWithHotel | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  // Hapus state filterHotel

  const form = useForm({
    initialValues: {
      email: '',
      full_name: '',
      password: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email';
        return null;
      },
      full_name: (value) => (!value ? 'Full name is required' : null),
      password: (value) => {
        if (!editingUser && !value) return 'Password is required for new users';
        if (value && value.length < 6) return 'Password must be at least 6 characters';
        return null;
      },
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all hotels (tetap diperlukan untuk modal assign)
      const { data: hotelsData, error: hotelsError } = await supabase
        .from('hotels')
        .select('*')
        .order('name', { ascending: true });

      if (hotelsError) throw hotelsError;
      setHotels(hotelsData || []);

      // Fetch all hotel admins
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'hotel_admin');

      if (usersError) throw usersError;

      // Merge hotel data with user data
      const usersWithHotels = (usersData || []).map((user) => ({
        ...user,
        hotel: hotelsData?.find((h) => h.id === user.hotel_id),
      }));

      setUsers(usersWithHotels);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch users or hotels',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

   // --- Logic Filter & Sort (Diperbarui) ---
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filter by search term (name, email, or hotel name)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.full_name.toLowerCase().includes(lowerSearch) ||
          user.email.toLowerCase().includes(lowerSearch) ||
          (user.hotel?.name && user.hotel.name.toLowerCase().includes(lowerSearch))
      );
    }

    // Filter by assignment status
    if (filterStatus === 'assigned') {
      result = result.filter((user) => !!user.hotel_id);
    } else if (filterStatus === 'unassigned') {
      result = result.filter((user) => !user.hotel_id);
    }

    // Hapus filter by specific hotel

    // Sort
    switch (sortBy) {
      case 'name_asc':
        result.sort((a, b) => a.full_name.localeCompare(b.full_name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.full_name.localeCompare(a.full_name));
        break;
      case 'email_asc':
         result.sort((a, b) => a.email.localeCompare(b.email));
        break;
      case 'email_desc':
        result.sort((a, b) => b.email.localeCompare(a.email));
        break;
      case 'hotel_asc':
        // Pastikan unassigned (null hotel) diurutkan terakhir saat ascending
        result.sort((a, b) => {
             if (!a.hotel?.name) return 1;
             if (!b.hotel?.name) return -1;
             return a.hotel.name.localeCompare(b.hotel.name);
        });
        break;
      case 'hotel_desc':
         // Pastikan unassigned (null hotel) diurutkan terakhir saat descending
        result.sort((a, b) => {
             if (!a.hotel?.name) return 1;
             if (!b.hotel?.name) return -1;
             return b.hotel.name.localeCompare(a.hotel.name);
        });
        break;
      case 'status': // Sort by assigned first, then unassigned
         result.sort((a, b) => (a.hotel_id ? -1 : 1) - (b.hotel_id ? -1 : 1));
         break;
      case 'created_at_asc':
         result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
         break;
      case 'created_at_desc':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return result;
  }, [users, searchTerm, sortBy, filterStatus]); // Hapus filterHotel dari dependency


  const handleSubmit = async (values: typeof form.values) => {
    // ... (fungsi tetap sama) ...
     try {
      if (editingUser) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: values.email,
            full_name: values.full_name,
          })
          .eq('id', editingUser.id);

        if (updateError) throw updateError;

        notifications.show({
          title: 'Success',
          message: 'User updated successfully',
          color: 'green',
        });
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: values.email,
            full_name: values.full_name,
            role: 'hotel_admin',
            hotel_id: null,
          });

        if (profileError) throw profileError;
        notifications.show({ title: 'Success', message: 'User created successfully', color: 'green'});
      }
      form.reset();
      setModalOpened(false);
      setEditingUser(null);
      fetchData();
    } catch (error) {
      notifications.show({ title: 'Error', message: error instanceof Error ? error.message : 'Failed to save user', color: 'red' });
    }
  };

  const handleEdit = (user: UserWithHotel) => {
    // ... (fungsi tetap sama) ...
    setEditingUser(user);
    form.setValues({ email: user.email, full_name: user.full_name, password: '' });
    setModalOpened(true);
  };

  const handleDelete = async () => {
    // ... (fungsi tetap sama) ...
     if (!deleteTarget) return;
    try {
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', deleteTarget.id);
      if (profileError) throw profileError;
      notifications.show({ title: 'Success', message: 'User deleted successfully', color: 'green' });
      setDeleteModalOpened(false);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      notifications.show({ title: 'Error', message: error instanceof Error ? error.message : 'Failed to delete user', color: 'red' });
    }
  };

  const handleAssignHotel = async () => {
    // ... (fungsi tetap sama) ...
     if (!assigningUser || !selectedHotelId) return;
    try {
      const { error } = await supabase.from('profiles').update({ hotel_id: selectedHotelId }).eq('id', assigningUser.id);
      if (error) throw error;
      notifications.show({ title: 'Success', message: 'Hotel assigned successfully', color: 'green' });
      setAssignModalOpened(false);
      setAssigningUser(null);
      setSelectedHotelId(null);
      fetchData();
    } catch (error) {
      notifications.show({ title: 'Error', message: error instanceof Error ? error.message : 'Failed to assign hotel', color: 'red' });
    }
  };

  const handleCloseModal = () => {
     setModalOpened(false);
    setEditingUser(null);
    form.reset();
  };

  if (loading) {
     return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader />
      </div>
    );
  }

  // Opsi untuk Select assign hotel di modal (tetap diperlukan)
  const hotelAssignOptions = hotels.map((h) => ({
    value: h.id,
    label: h.name,
  }));


  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
       <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem 0' }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <div>
              <Group mb="xs">
                <ActionIcon variant="transparent" color="white" onClick={() => router.push('/super-admin/dashboard')}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Title order={1} c="white">User Management</Title>
              </Group>
              <Text c="white" opacity={0.9}>Manage hotel admins and assignments</Text>
            </div>
            <Button leftSection={<IconPlus size={18} />} onClick={() => { setEditingUser(null); form.reset(); setModalOpened(true); }}>
              Add User
            </Button>
          </Group>
        </Container>
      </div>

      <Container size="lg" py="xl">
        {/* --- Filter & Search Inputs (Diperbarui) --- */}
        <Paper shadow="xs" p="md" radius="md" withBorder mb="lg">
          <Grid align="flex-end" gutter="md">
            {/* Search Input - Lebarkan */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Cari User"
                placeholder="Cari nama, email, atau hotel..." // Update placeholder
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.currentTarget.value)}
              />
            </Grid.Col>
            {/* Status Filter - Lebarkan */}
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                 <Stack gap={5}> {/* Wrap with Stack for label spacing */}
                     <Text size="sm" fw={500}>Status Assignment</Text>
                     <SegmentedControl
                        value={filterStatus}
                        onChange={(value) => setFilterStatus(value as 'all' | 'assigned' | 'unassigned')}
                        data={[
                            { label: 'Semua', value: 'all' },
                            { label: 'Assigned', value: 'assigned' },
                            { label: 'Unassigned', value: 'unassigned' },
                        ]}
                        fullWidth
                    />
                 </Stack>
            </Grid.Col>
            {/* Filter Hotel Dihapus */}
            {/* Sort Select */}
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Urutkan Berdasarkan"
                value={sortBy}
                onChange={(value) => setSortBy(value || 'created_at_desc')}
                data={[
                  { value: 'created_at_desc', label: 'Terbaru Dibuat' },
                  { value: 'created_at_asc', label: 'Terlama Dibuat' },
                  { value: 'name_asc', label: 'Nama (A-Z)' },
                  { value: 'name_desc', label: 'Nama (Z-A)' },
                  { value: 'email_asc', label: 'Email (A-Z)' },
                  { value: 'email_desc', label: 'Email (Z-A)' },
                  { value: 'hotel_asc', label: 'Hotel (A-Z)' },
                  { value: 'hotel_desc', label: 'Hotel (Z-A)' },
                   { value: 'status', label: 'Status Assignment' },
                ]}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {/* --- Table --- */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          {users.length === 0 ? (
            <Box ta="center" py="xl">
              <Text c="dimmed" mb="md">No users found. Create one to get started.</Text>
              <Button leftSection={<IconPlus size={18} />} onClick={() => { setEditingUser(null); form.reset(); setModalOpened(true); }}>
                Create First User
              </Button>
            </Box>
          ) : filteredAndSortedUsers.length === 0 ? (
             <Box ta="center" py="xl">
              <Text c="dimmed">Tidak ada user yang cocok dengan filter atau pencarian Anda.</Text>
            </Box>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Hotel Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredAndSortedUsers.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td fw={500}>{user.full_name}</Table.Td>
                    <Table.Td>{user.email}</Table.Td>
                    <Table.Td>
                      {user.hotel_id ? (
                        <Badge color="green" variant="light">
                          <Group gap={4} wrap="nowrap">
                            <IconCheck size={12} />
                            <Text size="xs" truncate>{user.hotel?.name || 'Unknown Hotel'}</Text>
                          </Group>
                        </Badge>
                      ) : ( <Badge color="orange" variant="light"> Unassigned </Badge> )}
                    </Table.Td>
                    {/* --- Kolom Actions Diperbarui --- */}
                    <Table.Td>
                      <Group gap="xs" justify="flex-start" wrap="nowrap"> {/* justify="flex-start" */}
                        {/* Tombol Edit dan Delete di Kiri */}
                        <ActionIcon color="blue" variant="light" onClick={() => handleEdit(user)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                         <ActionIcon color="red" variant="light" onClick={() => { setDeleteTarget(user); setDeleteModalOpened(true); }}>
                          <IconTrash size={16} />
                        </ActionIcon>

                        {/* Spacer untuk mendorong tombol Assign/Re-assign ke kanan */}
                        <Box style={{ flexGrow: 1 }} />

                        {/* Tombol Assign/Re-assign di Kanan */}
                        {!user.hotel_id && (
                          <Button size="xs" variant="light" onClick={() => { setAssigningUser(user); setSelectedHotelId(null); setAssignModalOpened(true); }}>
                            Assign
                          </Button>
                        )}
                        {user.hotel_id && (
                             <Button size="xs" variant="outline" color="gray" onClick={() => { setAssigningUser(user); setSelectedHotelId(user.hotel_id); setAssignModalOpened(true); }}>
                                Re-assign
                            </Button>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Container>

      {/* --- Modals (Tetap Sama) --- */}
      {/* Modal Add/Edit User */}
       <Modal opened={modalOpened} onClose={handleCloseModal} title={editingUser ? 'Edit User' : 'Add New User'} centered >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput label="Full Name" placeholder="Enter full name" required {...form.getInputProps('full_name')} />
            <TextInput label="Email" placeholder="Enter email" required {...form.getInputProps('email')} />
            <PasswordInput label={editingUser ? 'Password (Leave blank to keep current)' : 'Password'} placeholder="Enter password" required={!editingUser} {...form.getInputProps('password')} />
            <Group justify="flex-end">
              <Button variant="default" onClick={handleCloseModal}>Cancel</Button>
              <Button type="submit">{editingUser ? 'Update User' : 'Create User'}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal Assign Hotel */}
      <Modal opened={assignModalOpened} onClose={() => { setAssignModalOpened(false); setAssigningUser(null); setSelectedHotelId(null); }} title={assigningUser?.hotel_id ? "Re-assign Hotel" : "Assign Hotel"} centered >
        <Stack gap="md">
          <Text size="sm" c="dimmed"> {assigningUser?.hotel_id ? "Change hotel assignment for" : "Assign a hotel to"} <strong>{assigningUser?.full_name}</strong> </Text>
          <Select label="Select Hotel" placeholder="Choose a hotel" data={hotelAssignOptions} searchable value={selectedHotelId} onChange={setSelectedHotelId} required nothingFoundMessage="Hotel tidak ditemukan" />
            {assigningUser?.hotel_id && (
                 <Button variant="outline" color="orange" onClick={async () => {
                        if (!assigningUser) return;
                        try {
                            const { error } = await supabase.from('profiles').update({ hotel_id: null }).eq('id', assigningUser.id);
                            if (error) throw error;
                             notifications.show({ title: 'Success', message: 'User unassigned successfully', color: 'green' });
                             setAssignModalOpened(false); setAssigningUser(null); setSelectedHotelId(null); fetchData();
                        } catch (error) { notifications.show({ title: 'Error', message: 'Failed to unassign user', color: 'red' }); }
                    }} > Unassign Hotel </Button>
            )}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { setAssignModalOpened(false); setAssigningUser(null); setSelectedHotelId(null); }} > Cancel </Button>
            <Button onClick={handleAssignHotel} disabled={!selectedHotelId || selectedHotelId === assigningUser?.hotel_id} >
              {assigningUser?.hotel_id ? "Update Assignment" : "Assign Hotel"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal opened={deleteModalOpened} onClose={() => { setDeleteModalOpened(false); setDeleteTarget(null); }} title="Delete User" centered >
        <Stack gap="md">
          <Text> Are you sure you want to delete <strong>{deleteTarget?.full_name}</strong>? This action cannot be undone. </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { setDeleteModalOpened(false); setDeleteTarget(null); }} > Cancel </Button>
            <Button color="red" onClick={handleDelete}> Delete User </Button>
          </Group>
        </Stack>
      </Modal>

    </div>
  );
}

export default function UserManagementPage() {
  return (
    <ProtectedRoute requiredRole="super_admin">
      <UserManagementContent />
    </ProtectedRoute>
  );
}