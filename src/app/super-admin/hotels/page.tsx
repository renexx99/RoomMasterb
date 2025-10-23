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
  Anchor,
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconArrowLeft, IconSettings } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { Hotel } from '@/core/types/database';

function HotelManagementContent() {
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Hotel | null>(null);

  const form = useForm({
    initialValues: {
      name: '',
      address: '',
    },
    validate: {
      name: (value) => (!value ? 'Hotel name is required' : null),
      address: (value) => (!value ? 'Address is required' : null),
    },
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch hotels',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (editingHotel) {
        const { error } = await supabase
          .from('hotels')
          .update({
            name: values.name,
            address: values.address,
          })
          .eq('id', editingHotel.id);

        if (error) throw error;

        notifications.show({
          title: 'Success',
          message: 'Hotel updated successfully',
          color: 'green',
        });
      } else {
        const { error } = await supabase
          .from('hotels')
          .insert([
            {
              name: values.name,
              address: values.address,
            },
          ]);

        if (error) throw error;

        notifications.show({
          title: 'Success',
          message: 'Hotel created successfully',
          color: 'green',
        });
      }

      form.reset();
      setModalOpened(false);
      setEditingHotel(null);
      fetchHotels();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save hotel',
        color: 'red',
      });
    }
  };

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    form.setValues({
      name: hotel.name,
      address: hotel.address,
    });
    setModalOpened(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase
        .from('hotels')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      notifications.show({
        title: 'Success',
        message: 'Hotel deleted successfully',
        color: 'green',
      });

      setDeleteModalOpened(false);
      setDeleteTarget(null);
      fetchHotels();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete hotel',
        color: 'red',
      });
    }
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingHotel(null);
    form.reset();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader />
      </div>
    );
  }

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
                  Hotel Management
                </Title>
              </Group>
              <Text c="white" opacity={0.9}>
                Manage all hotels in the system
              </Text>
            </div>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => {
                setEditingHotel(null);
                form.reset();
                setModalOpened(true);
              }}
            >
              Add Hotel
            </Button>
          </Group>
        </Container>
      </div>

      <Container size="lg" py="xl">
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          {hotels.length === 0 ? (
            <Box ta="center" py="xl">
              <Text c="dimmed" mb="md">
                No hotels found. Create one to get started.
              </Text>
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => {
                  setEditingHotel(null);
                  form.reset();
                  setModalOpened(true);
                }}
              >
                Create First Hotel
              </Button>
            </Box>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Hotel Name</Table.Th>
                  <Table.Th>Address</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {hotels.map((hotel) => (
                  <Table.Tr key={hotel.id}>
                    <Table.Td>
                      <Anchor
                        component={Link}
                        href={`/super-admin/hotels/${hotel.id}/manage`}
                        fw={600}
                        c="blue"
                        style={{ textDecoration: 'none' }}
                      >
                        {hotel.name}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>{hotel.address}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconSettings size={14} />}
                          component={Link}
                          href={`/super-admin/hotels/${hotel.id}/manage`}
                        >
                          Kelola
                        </Button>
                        <ActionIcon
                          color="blue"
                          variant="light"
                          onClick={() => handleEdit(hotel)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => {
                            setDeleteTarget(hotel);
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

      {/* Modal untuk Add/Edit Hotel */}
      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={editingHotel ? 'Edit Hotel' : 'Add New Hotel'}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Hotel Name"
              placeholder="Enter hotel name"
              required
              {...form.getInputProps('name')}
            />
            <TextInput
              label="Address"
              placeholder="Enter hotel address"
              required
              {...form.getInputProps('address')}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingHotel ? 'Update Hotel' : 'Create Hotel'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setDeleteTarget(null);
        }}
        title="Delete Hotel"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
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
              Delete Hotel
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

export default function HotelManagementPage() {
  return (
    <ProtectedRoute requiredRole="super_admin">
      <HotelManagementContent />
    </ProtectedRoute>
  );
}