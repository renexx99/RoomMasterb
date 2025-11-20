'use client';

import { useState, useMemo } from 'react';
import {
  Container, Title, Button, Group, Paper, TextInput,
  Select, ActionIcon, Text, Grid, Modal, Stack, Table, Badge, Avatar, Menu, ThemeIcon
} from '@mantine/core';
import { IconPlus, IconSearch, IconUsers, IconDots, IconEdit, IconTrash, IconFilter } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { UserFormModal } from './components/UserFormModal';
import { deleteUserAction } from './actions';
import { Profile, Role, Hotel } from '@/core/types/database';

// --- DEFINISI TIPE LOKAL ---
interface UserRoleJoin {
  role_id: string;
  hotel_id: string | null;
  roles: Role | null;
  hotels: Hotel | null;
}

export interface UserWithRoles extends Profile {
  user_roles: UserRoleJoin[];
}

interface ClientProps {
  initialUsers: UserWithRoles[]; 
  hotels: { id: string; name: string }[];
  roles: { id: string; name: string }[];
}

export default function UsersManagementClient({ initialUsers, hotels, roles }: ClientProps) {
  const [modalOpened, setModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  
  const [editingItem, setEditingItem] = useState<UserWithRoles | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserWithRoles | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  // Data untuk Select
  const hotelSelectData = hotels.map(h => ({ value: h.id, label: h.name }));
  // const roleSelectData = roles.map(r => ({ value: r.id, label: r.name.replace(/_/g, ' ').toUpperCase() })); // Hapus format ini agar sesuai value aslinya
  const roleSelectData = roles.map(r => ({ value: r.id, label: r.name })); // Gunakan nama asli dari DB
  
  // Opsi Filter Role
  const roleFilterData = roles.map(r => ({ value: r.name, label: r.name }));

  const filteredUsers = useMemo(() => {
    return initialUsers.filter(user => {
      const roleName = user.user_roles?.[0]?.roles?.name || '';

      const matchSearch = 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchRole = roleFilter ? roleName === roleFilter : true;
      
      return matchSearch && matchRole;
    });
  }, [initialUsers, searchTerm, roleFilter]);

  // Handlers
  const handleCreate = () => { setEditingItem(null); setModalOpened(true); };
  const handleEdit = (item: UserWithRoles) => { setEditingItem(item); setModalOpened(true); };
  const handleDelete = (item: UserWithRoles) => { setDeleteTarget(item); setDeleteModalOpened(true); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    const res = await deleteUserAction(deleteTarget.id);
    setIsSubmitting(false);
    
    if (res.error) {
        notifications.show({ title: 'Gagal', message: res.error, color: 'red' });
    } else {
        notifications.show({ title: 'Sukses', message: 'User dihapus', color: 'green' });
        setDeleteModalOpened(false);
    }
  };

  // --- [UPDATE] Helper Warna Badge Role yang Lebih Lengkap ---
  const getRoleColor = (roleName: string | undefined) => {
      if (!roleName) return 'gray';
      
      const lower = roleName.toLowerCase();
      
      if (lower.includes('super')) return 'violet';           // Super Admin
      if (lower.includes('hotel admin')) return 'indigo';     // Hotel Admin
      if (lower.includes('manager')) return 'blue';           // Hotel Manager
      if (lower.includes('front')) return 'teal';             // Front Office
      if (lower.includes('housekeeping')) return 'orange';    // Housekeeping
      if (lower.includes('finance')) return 'green';          // Finance (Future proof)
      
      return 'gray';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Ramping */}
      <div style={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
          padding: '0.75rem 0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Group gap="xs">
                <ThemeIcon variant="light" color="white" size="lg" radius="md" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                    <IconUsers size={20} stroke={1.5} />
                </ThemeIcon>
                <div>
                    <Title order={4} c="white" style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>
                        Manajemen User
                    </Title>
                    <Text c="white" opacity={0.8} size="xs" mt={2}>
                        Kelola akses user via RBAC
                    </Text>
                </div>
            </Group>
            <Button 
                leftSection={<IconPlus size={16} />} 
                onClick={handleCreate} 
                variant="white" 
                color="indigo" 
                size="xs"
                fw={600}
            >
              Tambah User
            </Button>
          </Group>
        </Container>
      </div>

      {/* Content */}
      <Container size="lg" py="md">
        {/* Filter Bar */}
        <Paper shadow="xs" p="sm" radius="md" withBorder mb="md">
          <Grid gutter="xs">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                placeholder="Cari nama atau email..."
                leftSection={<IconSearch size={14} />}
                size="xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
               <Select 
                 placeholder="Filter Role"
                 data={roleFilterData}
                 clearable
                 leftSection={<IconFilter size={14}/>}
                 size="xs"
                 value={roleFilter}
                 onChange={setRoleFilter}
               />
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Table */}
        <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
            <Table striped highlightOnHover verticalSpacing="xs">
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Hotel</Table.Th>
                  <Table.Th ta="right">Aksi</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredUsers.length > 0 ? filteredUsers.map((user) => {
                  const activeRole = user.user_roles?.[0]; 
                  const roleName = activeRole?.roles?.name || 'No Role';
                  const hotelName = activeRole?.hotels?.name || '-';

                  return (
                    <Table.Tr key={user.id}>
                        <Table.Td>
                            <Group gap="sm">
                                <Avatar color="initials" name={user.full_name} radius="xl" size="sm" />
                                <div>
                                    <Text size="sm" fw={500}>{user.full_name}</Text>
                                    <Text size="xs" c="dimmed">{user.email}</Text>
                                </div>
                            </Group>
                        </Table.Td>
                        <Table.Td>
                            {/* --- [UPDATE] Badge dengan Warna Tema --- */}
                            <Badge 
                                size="sm" 
                                variant="light" 
                                color={getRoleColor(roleName)}
                                radius="sm"
                            >
                                {roleName}
                            </Badge>
                        </Table.Td>
                        <Table.Td>
                            <Text size="sm" c={hotelName === '-' ? 'dimmed' : 'dark'}>{hotelName}</Text>
                        </Table.Td>
                        <Table.Td>
                        <Group gap={0} justify="flex-end">
                            <Menu position="bottom-end" shadow="sm">
                                <Menu.Target>
                                    <ActionIcon variant="subtle" color="gray" size="sm">
                                        <IconDots size={16} />
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Item leftSection={<IconEdit size={14}/>} onClick={() => handleEdit(user)}>
                                        Edit Role & Hotel
                                    </Menu.Item>
                                    <Menu.Item color="red" leftSection={<IconTrash size={14}/>} onClick={() => handleDelete(user)}>
                                        Hapus User
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                        </Table.Td>
                    </Table.Tr>
                  );
                }) : (
                    <Table.Tr>
                        <Table.Td colSpan={4} ta="center" py="xl" c="dimmed">
                            Tidak ada data user ditemukan.
                        </Table.Td>
                    </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
        </Paper>
      </Container>

      {/* Modals */}
      <UserFormModal 
        opened={modalOpened} 
        onClose={() => setModalOpened(false)} 
        itemToEdit={editingItem} 
        hotels={hotelSelectData}
        roles={roleSelectData}
      />

      <Modal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} title="Konfirmasi Hapus" centered size="sm">
         <Stack gap="sm">
            <Text size="sm">Yakin ingin menghapus user <strong>{deleteTarget?.full_name}</strong>?</Text>
            <Text size="xs" c="red">Akses login dan semua data relasi user ini akan dihapus.</Text>
            <Group justify="flex-end" mt="sm">
                <Button variant="default" size="xs" onClick={() => setDeleteModalOpened(false)}>Batal</Button>
                <Button color="red" size="xs" loading={isSubmitting} onClick={confirmDelete}>Hapus</Button>
            </Group>
         </Stack>
      </Modal>
    </div>
  );
}