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
  PasswordInput,
  Stack,
  Paper,
  ActionIcon,
  Text,
  Box,
  Loader,
  Badge,
  Select,
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconArrowLeft, IconCheck } from '@tabler/icons-react';
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
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [assignModalOpened, setAssignModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithHotel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserWithHotel | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserWithHotel | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

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

      // Fetch all hotels
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
        .eq('role', 'hotel_admin')
        .order('created_at', { ascending: false });

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
        message: 'Failed to fetch users',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (editingUser) {
        // Update existing user
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
        // Create new user
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

        notifications.show({
          title: 'Success',
          message: 'User created successfully',
          color: 'green',
        });
      }

      form.reset();
      setModalOpened(false);
      setEditingUser(null);
      fetchData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save user',
        color: 'red',
      });
    }
  };

  const handleEdit = (user: UserWithHotel) => {
    setEditingUser(user);
    form.setValues({
      email: user.email,
      full_name: user.full_name,
      password: '',
    });
    setModalOpened(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      // Delete user profile (this should cascade delete auth user)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteTarget.id);

      if (profileError) throw profileError;

      notifications.show({
        title: 'Success',
        message: 'User deleted successfully',
        color: 'green',
      });

      setDeleteModalOpened(false);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete user',
        color: 'red',
      });
    }
  };

  const handleAssignHotel = async () => {
    if (!assigningUser || !selectedHotelId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          hotel_id: selectedHotelId,
        })
        .eq('id', assigningUser.id);

      if (error) throw error;

      notifications.show({
        title: 'Success',
        message: 'Hotel assigned successfully',
        color: 'green',
      });

      setAssignModalOpened(false);
      setAssigningUser(null);
      setSelectedHotelId(null);
      fetchData();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to assign hotel',
        color: 'red',
      });
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

  const hotelOptions = hotels.map((h) => ({
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
                <ActionIcon
                  variant="transparent"
                  color="white"
                  onClick={() => router.push('/super-admin/dashboard')}
                >
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Title order={1} c="white">
                  User Management
                </Title>
              </Group>
              <Text c="white" opacity={0.9}>
                Manage hotel admins and assignments
              </Text>
            </div>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => {
                setEditingUser(null);
                form.reset();
                setModalOpened(true);
              }}
            >
              Add User
            </Button>
          </Group>
        </Container>
      </div>

      <Container size="lg" py="xl">
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          {users.length === 0 ? (
            <Box ta="center" py="xl">
              <Text c="dimmed" mb="md">
                No users found. Create one to get started.
              </Text>
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => {
                  setEditingUser(null);
                  form.reset();
                  setModalOpened(true);
                }}
              >
                Create First User
              </Button>
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
                {users.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td fw={500}>{user.full_name}</Table.Td>
                    <Table.Td>{user.email}</Table.Td>
                    <Table.Td>
                      {user.hotel_id ? (
                        <Badge color="green" variant="light">
                          <Group gap={4}>
                            <IconCheck size={12} />
                            {user.hotel?.name || 'Unknown Hotel'}
                          </Group>
                        </Badge>
                      ) : (
                        <Badge color="orange" variant="light">
                          Unassigned
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          color="blue"
                          variant="light"
                          onClick={() => handleEdit(user)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        {!user.hotel_id && (
                          <Button
                            size="xs"
                            variant="light"
                            onClick={() => {
                              setAssigningUser(user);
                              setSelectedHotelId(null);
                              setAssignModalOpened(true);
                            }}
                          >
                            Assign
                          </Button>
                        )}
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => {
                            setDeleteTarget(user);
                            setDeleteModalOpened(true);
                          }}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Container>

      {/* Modal untuk Add/Edit User */}
      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={editingUser ? 'Edit User' : 'Add New User'}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Full Name"
              placeholder="Enter full name"
              required
              {...form.getInputProps('full_name')}
            />
            <TextInput
              label="Email"
              placeholder="Enter email"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label={editingUser ? 'Password (Leave blank to keep current)' : 'Password'}
              placeholder="Enter password"
              required={!editingUser}
              {...form.getInputProps('password')}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal untuk Assign Hotel */}
      <Modal
        opened={assignModalOpened}
        onClose={() => {
          setAssignModalOpened(false);
          setAssigningUser(null);
          setSelectedHotelId(null);
        }}
        title="Assign Hotel"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Assign a hotel to <strong>{assigningUser?.full_name}</strong>
          </Text>
          <Select
            label="Select Hotel"
            placeholder="Choose a hotel"
            data={hotelOptions}
            searchable
            value={selectedHotelId}
            onChange={setSelectedHotelId}
            required
          />
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setAssignModalOpened(false);
                setAssigningUser(null);
                setSelectedHotelId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignHotel}
              disabled={!selectedHotelId}
            >
              Assign Hotel
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setDeleteTarget(null);
        }}
        title="Delete User"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete <strong>{deleteTarget?.full_name}</strong>? This action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setDeleteModalOpened(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete}>
              Delete User
            </Button>
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