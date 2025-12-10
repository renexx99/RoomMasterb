'use client';

import { useState, useMemo } from 'react';
import {
  Container, Button, Group, Paper, TextInput,
  Select, ActionIcon, Text, Grid, Modal, Stack, Table, Badge, Avatar, Menu, ThemeIcon, Box
} from '@mantine/core';
import { 
  IconPlus, IconSearch, IconUsers, IconDots, IconEdit, IconTrash, 
  IconFilter, IconUserShield 
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { UserFormModal } from './components/UserFormModal';
import { deleteUserAction } from './actions';
import { Profile, Role, Hotel } from '@/core/types/database';

// --- TYPE DEFINITIONS ---
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

  // Data for Selects
  const hotelSelectData = hotels.map(h => ({ value: h.id, label: h.name }));
  const roleSelectData = roles.map(r => ({ value: r.id, label: r.name }));
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
        notifications.show({ title: 'Failed', message: res.error, color: 'red' });
    } else {
        notifications.show({ title: 'Success', message: 'User deleted successfully', color: 'teal' });
        setDeleteModalOpened(false);
    }
  };

  const getRoleColor = (roleName: string | undefined) => {
      if (!roleName) return 'gray';
      const lower = roleName.toLowerCase();
      if (lower.includes('super')) return 'violet';
      if (lower.includes('hotel admin')) return 'indigo';
      if (lower.includes('manager')) return 'blue';
      if (lower.includes('front')) return 'cyan';
      if (lower.includes('housekeeping')) return 'orange';
      return 'gray';
  };

  return (
    <Box style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '2rem' }}>
      <Container size="xl" py="lg">
        
        {/* Clean Toolbar (No Header Text) */}
        <Paper p="md" radius="md" withBorder mb="lg" shadow="sm">
            <Grid align="center" gutter="sm">
              {/* Search Input */}
              <Grid.Col span={{ base: 12, sm: 5 }}>
                <TextInput
                  placeholder="Search name or email..."
                  leftSection={<IconSearch size={16} stroke={1.5} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                  radius="md"
                />
              </Grid.Col>
              
              {/* Filter Select */}
              <Grid.Col span={{ base: 6, sm: 3 }}>
                 <Select 
                   placeholder="Filter by Role"
                   data={roleFilterData}
                   clearable
                   leftSection={<IconFilter size={16} stroke={1.5}/>}
                   value={roleFilter}
                   onChange={setRoleFilter}
                   radius="md"
                 />
              </Grid.Col>

              {/* Actions */}
              <Grid.Col span={{ base: 6, sm: 4 }}>
                <Group justify="flex-end" gap="sm">
                    <Text size="sm" c="dimmed" visibleFrom="md" style={{ whiteSpace: 'nowrap' }}>
                        Total: <Text span fw={700} c="dark">{filteredUsers.length}</Text> Users
                    </Text>
                    <Button 
                        leftSection={<IconPlus size={18} />} 
                        onClick={handleCreate} 
                        style={{
                          background: 'linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)',
                          color: 'white'
                        }}
                        radius="md"
                    >
                      Add User
                    </Button>
                </Group>
              </Grid.Col>
            </Grid>
        </Paper>

        {/* Users Table */}
        <Paper shadow="sm" radius="md" withBorder style={{ overflow: 'hidden' }}>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th>User Profile</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Assigned Hotel</Table.Th>
                  <Table.Th ta="right">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredUsers.length > 0 ? filteredUsers.map((user) => {
                  const activeRole = user.user_roles?.[0]; 
                  const roleName = activeRole?.roles?.name || 'No Role';
                  const hotelName = activeRole?.hotels?.name || 'Global Access';

                  return (
                    <Table.Tr key={user.id}>
                        <Table.Td>
                            <Group gap="sm">
                                <Avatar color="indigo" radius="xl" size="sm" name={user.full_name}>
                                    {user.full_name?.charAt(0)}
                                </Avatar>
                                <div>
                                    <Text size="sm" fw={500}>{user.full_name}</Text>
                                    <Text size="xs" c="dimmed">{user.email}</Text>
                                </div>
                            </Group>
                        </Table.Td>
                        <Table.Td>
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
                            <Group gap={6}>
                                <ThemeIcon variant="transparent" color="gray" size="xs">
                                    {hotelName === 'Global Access' ? <IconUserShield size={14}/> : <IconUsers size={14}/>}
                                </ThemeIcon>
                                <Text size="sm" c={hotelName === 'Global Access' ? 'dimmed' : 'dark'}>
                                    {hotelName}
                                </Text>
                            </Group>
                        </Table.Td>
                        <Table.Td>
                            <Group gap={0} justify="flex-end">
                                <Menu position="bottom-end" shadow="md" withArrow>
                                    <Menu.Target>
                                        <ActionIcon variant="subtle" color="gray" size="sm">
                                            <IconDots size={16} />
                                        </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item leftSection={<IconEdit size={14}/>} onClick={() => handleEdit(user)}>
                                            Edit Details
                                        </Menu.Item>
                                        <Menu.Item color="red" leftSection={<IconTrash size={14}/>} onClick={() => handleDelete(user)}>
                                            Delete User
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
                            No users found matching your filters.
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

      <Modal 
        opened={deleteModalOpened} 
        onClose={() => setDeleteModalOpened(false)} 
        title="Confirm Deletion" 
        centered 
        radius="md"
      >
         <Stack gap="sm">
            <Text size="sm">Are you sure you want to delete user <strong>{deleteTarget?.full_name}</strong>?</Text>
            <Paper p="xs" bg="red.0" c="red.9" withBorder style={{ borderColor: 'var(--mantine-color-red-2)' }}>
                <Text size="xs">⚠️ This will revoke their access immediately and remove all role associations.</Text>
            </Paper>
            <Group justify="flex-end" mt="sm">
                <Button variant="default" onClick={() => setDeleteModalOpened(false)}>Cancel</Button>
                <Button color="red" loading={isSubmitting} onClick={confirmDelete}>Delete User</Button>
            </Group>
         </Stack>
      </Modal>
    </Box>
  );
}