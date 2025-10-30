// src/app/admin/staff/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Container, Title, Button, Table, Group, Modal, TextInput, PasswordInput,
  Stack, Paper, ActionIcon, Text, Box, Loader, Badge, Select, Grid, Center
} from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconArrowLeft, IconSearch, IconUserShield } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/core/config/supabaseClient'; //
import { useAuth, UserRoleAssignmentWithRoleName } from '@/features/auth/hooks/useAuth'; //
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'; //
import { Profile, Role } from '@/core/types/database'; //

// Interface untuk user dengan detail role di hotel ini
interface StaffMember extends Profile {
  assignment?: UserRoleAssignmentWithRoleName; // Informasi role assignment di hotel ini
}

// Komponen utama (diletakkan di dalam fungsi default export)
function StaffManagementContent() {
  const router = useRouter();
  const { profile: currentAdminProfile } = useAuth(); // Profile Hotel Admin yang sedang login
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [hotelRoles, setHotelRoles] = useState<Role[]>([]); // Roles yang bisa diassign (Hotel Admin, Manager, etc.)
  const [loading, setLoading] = useState(true);

  // --- State untuk Modal ---
  const [modalOpened, setModalOpened] = useState(false);
  const [assignModalOpened, setAssignModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffMember | null>(null); // User profile yang diedit
  const [assigningUser, setAssigningUser] = useState<StaffMember | null>(null); // User profile yang diassign role
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null); // User profile yang akan dihapus assignmentnya

  // --- State Filter & Sort ---
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('full_name_asc');
  // Tambahkan filter lain jika perlu (misal filter by role)

  useEffect(() => {
    console.log("Current Admin Profile:", currentAdminProfile);
    console.log("Roles:", currentAdminProfile?.roles);
  }, [currentAdminProfile]);

  const form = useForm({
    // Mirip form super-admin user, tapi tanpa hotel_id
    initialValues: {
      email: '',
      full_name: '',
      password: '',
      role_id: '', // Tambahkan role_id untuk user baru
    },
    validate: {
      email: (value) => (!value || !/^\S+@\S+\.\S+$/.test(value) ? 'Email tidak valid' : null),
      full_name: (value) => (!value ? 'Nama lengkap harus diisi' : null),
      password: (value, values) => {
        // Hanya wajib untuk user baru
        if (!editingUser && !value) return 'Password wajib untuk user baru';
        if (value && value.length < 6) return 'Password minimal 6 karakter';
        return null;
      },
       role_id: (value, values) => (!editingUser && !value ? 'Role harus dipilih untuk user baru' : null),
    },
  });

  const ADMIN_PATH_ROLES = ['Hotel Admin', 'Hotel Manager', 'Front Office'];
  const hotelId = useMemo(() => {
    if (!currentAdminProfile?.roles || currentAdminProfile.roles.length === 0) {
      console.warn("No roles found for current user");
      return null;
    }
    
    const adminRole = currentAdminProfile.roles.find(
      r => r.hotel_id && ADMIN_PATH_ROLES.includes(r.role_name || '')
    );
    
    console.log("Admin role found:", adminRole);
    console.log("Hotel ID extracted:", adminRole?.hotel_id);
    
    return adminRole?.hotel_id || null;
  }, [currentAdminProfile]);

  // --- Fetch Data ---
  useEffect(() => {
    if (hotelId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  const fetchData = async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      // 1. Ambil Roles yang relevan untuk hotel (bukan Super Admin)
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .in('name', ['Hotel Admin', 'Hotel Manager', 'Front Office', 'Housekeeping Supervisor']); //
      if (rolesError) throw rolesError;
      setHotelRoles(rolesData || []);

      // 2. Ambil semua user_roles assignment untuk hotel ini
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_roles')
        .select(`
          *,
          profile:profiles(*),
          role:roles(*)
        `)
        .eq('hotel_id', hotelId);
      if (assignmentsError) throw assignmentsError;

      // 3. Format data untuk ditampilkan
      const staff: StaffMember[] = (assignments || []).map(a => ({
        ...(a.profile as Profile), // Ambil data profile
        assignment: { // Simpan detail assignment & role
          ...a,
          role_name: (a.role as Role)?.name || 'Unknown Role',
        } as UserRoleAssignmentWithRoleName,
      }));

      setStaffList(staff);

    } catch (error: any) {
      console.error("Error fetching staff data:", error);
      notifications.show({ title: 'Error', message: error?.message || 'Gagal mengambil data staf.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  // --- Filter & Sort Logic (Adaptasi dari super-admin/users) ---
  const filteredAndSortedStaff = useMemo(() => {
     let result = [...staffList];
     // ... (Implementasi filter berdasarkan searchTerm) ...
     // ... (Implementasi sort berdasarkan sortBy) ...
     // Contoh sort by name:
     if (sortBy === 'full_name_asc') {
         result.sort((a, b) => a.full_name.localeCompare(b.full_name));
     } else if (sortBy === 'full_name_desc') {
         result.sort((a, b) => b.full_name.localeCompare(a.full_name));
     }
     // Tambahkan case sort lainnya (role, email, created_at)

     // Contoh filter by name/email:
     if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.full_name.toLowerCase().includes(lowerSearch) ||
          user.email.toLowerCase().includes(lowerSearch) ||
          (user.assignment?.role_name && user.assignment.role_name.toLowerCase().includes(lowerSearch))
      );
    }

     return result;
  }, [staffList, searchTerm, sortBy]);


  // --- Handlers ---
  const handleSubmit = async (values: typeof form.values) => {
    console.log("handleSubmit triggered. Hotel ID from context:", hotelId);
    console.log("Values being submitted:", values);
    if (!hotelId) {
      notifications.show({ title: 'Error', message: 'Hotel ID tidak ditemukan. Tidak bisa menyimpan staf.', color: 'red' });
      return; // Hentikan jika hotelId null
    }
    try {
      setLoading(true);
      if (editingUser) {
        // Hanya update profile (nama, mungkin email jika diizinkan)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ full_name: values.full_name /*, email: values.email */ })
          .eq('id', editingUser.id);
        if (updateError) throw updateError;
        notifications.show({ title: 'Sukses', message: 'Profil staf berhasil diperbarui', color: 'green' });
      } else {
        // Buat user baru (auth + profile + role assignment)
        // 1. Buat Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        });
        if (authError) throw authError;
        if (!authData.user) throw new Error('Gagal membuat akun auth');

        // 2. Buat Profile User
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: values.email,
            full_name: values.full_name,
            role: null, // Kolom role lama tidak dipakai lagi
            hotel_id: null, // hotel_id di profile tidak dipakai lagi untuk assignment
          });
        if (profileError) throw profileError; // Mungkin perlu logic rollback auth user jika ini gagal

        // 3. Assign Role ke Hotel Ini
        const { error: assignmentError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role_id: values.role_id,
            hotel_id: hotelId,
          });
        if (assignmentError) throw assignmentError; // Mungkin perlu logic rollback

        notifications.show({ title: 'Sukses', message: 'Staf baru berhasil ditambahkan dan diberi peran', color: 'green'});
      }
      handleCloseModal();
      await fetchData(); // Refresh data
    } catch (error: any) {
        console.error("Error saving staff:", error);
        notifications.show({ title: 'Error', message: error?.message || 'Gagal menyimpan data staf.', color: 'red' });
    } finally { setLoading(false); }
  };

  const handleEdit = (user: StaffMember) => {
     setEditingUser(user);
     // Isi form hanya dengan data profile, bukan role
     form.setValues({ email: user.email, full_name: user.full_name, password: '', role_id: '' });
     setModalOpened(true);
  };

  const handleOpenAssignModal = (user: StaffMember) => {
    setAssigningUser(user);
    setSelectedRoleId(user.assignment?.role_id || null); // Set role yang sekarang
    setAssignModalOpened(true);
  };

  const handleAssignRole = async () => {
    if (!assigningUser || !selectedRoleId || !hotelId) return;
    try {
      setLoading(true);
      // Upsert: update jika sudah ada assignment user-hotel ini, insert jika belum
      // Atau bisa juga delete existing lalu insert baru untuk memastikan hanya 1 role per hotel
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: assigningUser.id,
          hotel_id: hotelId,
          role_id: selectedRoleId,
        }, { onConflict: 'user_id, hotel_id' }); // Asumsi user hanya punya 1 role per hotel

      if (error) throw error;
      notifications.show({ title: 'Sukses', message: `Peran untuk ${assigningUser.full_name} berhasil diubah`, color: 'green' });
      handleCloseAssignModal();
      await fetchData();
    } catch (error: any) {
      console.error("Error assigning role:", error);
      notifications.show({ title: 'Error', message: error?.message || 'Gagal mengubah peran.', color: 'red' });
    } finally { setLoading(false); }
  };

   const handleDeleteAssignment = async () => {
    if (!deleteTarget || !hotelId) return;
    try {
        setLoading(true);
      // Hapus assignment peran user ini HANYA di hotel ini
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deleteTarget.id)
        .eq('hotel_id', hotelId); // Pastikan hanya hapus untuk hotel ini

      if (error) throw error;
      notifications.show({ title: 'Sukses', message: `Peran ${deleteTarget.full_name} di hotel ini berhasil dihapus`, color: 'green' });
      handleCloseDeleteModal();
      await fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error deleting assignment:", error);
      notifications.show({ title: 'Error', message: error?.message || 'Gagal menghapus peran staf.', color: 'red' });
    } finally { setLoading(false); }
  };


  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingUser(null);
    form.reset();
  };
  const handleCloseAssignModal = () => {
    setAssignModalOpened(false);
    setAssigningUser(null);
    setSelectedRoleId(null);
   };
  const handleCloseDeleteModal = () => {
     setDeleteModalOpened(false);
     setDeleteTarget(null);
  };


  // --- Options untuk Select Role ---
  const roleOptions = hotelRoles.map(role => ({
      value: role.id,
      label: role.name
  }));


  // --- Render Logic ---
  if (loading && staffList.length === 0) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
     <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Header (Mirip halaman admin lain) */}
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '2rem 0', marginBottom: '2rem' }}>
             <Container size="lg">
                 <Group justify="space-between" align="center">
                     <div>
                         <Group mb="xs">
                            <ActionIcon variant="transparent" color="white" onClick={() => router.push('/admin/dashboard')}> <IconArrowLeft size={20} /> </ActionIcon>
                            <Title order={1} c="white"> Manajemen Staf </Title>
                         </Group>
                         <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}> Kelola pengguna dan peran di hotel Anda </Text>
                     </div>
                     <Button leftSection={<IconPlus size={18} />} onClick={() => { setEditingUser(null); form.reset(); setModalOpened(true); }} variant="white" color="teal" > Tambah Staf </Button>
                 </Group>
             </Container>
         </div>

         <Container size="lg" pb="xl">
            {/* Filter & Search Inputs (Adaptasi dari super-admin/users) */}
            <Paper shadow="xs" p="md" radius="md" withBorder mb="lg">
              <Grid align="flex-end" gutter="md">
                 <Grid.Col span={{ base: 12, md: 8 }}>
                  <TextInput
                    label="Cari Staf"
                    placeholder="Cari nama, email, atau peran..."
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.currentTarget.value)}
                  />
                </Grid.Col>
                {/* Tambahkan Filter by Role jika perlu */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                   <Select
                        label="Urutkan"
                        value={sortBy}
                        onChange={(value) => setSortBy(value || 'full_name_asc')}
                        data={[
                             { value: 'full_name_asc', label: 'Nama (A-Z)' },
                             { value: 'full_name_desc', label: 'Nama (Z-A)' },
                             // Tambahkan opsi sort lain (role, email, created_at)
                        ]}
                    />
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Table */}
             <Paper shadow="sm" p="lg" radius="md" withBorder>
              {staffList.length === 0 ? (
                <Box ta="center" py="xl"> <Text c="dimmed"> Belum ada staf di hotel ini. </Text> </Box>
              ) : filteredAndSortedStaff.length === 0 ? (
                <Box ta="center" py="xl"> <Text c="dimmed"> Tidak ada staf yang cocok dengan pencarian Anda. </Text> </Box>
              ) : (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Nama Lengkap</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Peran (Role)</Table.Th>
                      <Table.Th>Aksi</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredAndSortedStaff.map((user) => (
                      <Table.Tr key={user.id}>
                        <Table.Td fw={500}>{user.full_name}</Table.Td>
                        <Table.Td>{user.email}</Table.Td>
                        <Table.Td>
                           {user.assignment?.role_name ? (
                             <Badge color="blue" variant="light">{user.assignment.role_name}</Badge>
                           ) : (
                             <Badge color="gray" variant="light">Tanpa Peran</Badge> // Seharusnya tidak terjadi jika fetch benar
                           )}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon color="blue" variant="light" onClick={() => handleEdit(user)} aria-label={`Edit profil ${user.full_name}`}> <IconEdit size={16} /> </ActionIcon>
                            <ActionIcon color="teal" variant="light" onClick={() => handleOpenAssignModal(user)} aria-label={`Ubah peran ${user.full_name}`}> <IconUserShield size={16} /> </ActionIcon>
                            <ActionIcon color="red" variant="light" onClick={() => { setDeleteTarget(user); setDeleteModalOpened(true); }} aria-label={`Hapus peran ${user.full_name} dari hotel`}> <IconTrash size={16} /> </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
         </Container>

        {/* Modal Add/Edit User Profile */}
        <Modal opened={modalOpened} onClose={handleCloseModal} title={editingUser ? 'Edit Profil Staf' : 'Tambah Staf Baru'} centered >
            <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
                <TextInput label="Nama Lengkap" placeholder="Masukkan nama" required {...form.getInputProps('full_name')} />
                <TextInput label="Email" placeholder="Masukkan email" required {...form.getInputProps('email')} />
                <PasswordInput
                  label={editingUser ? 'Password (Kosongkan jika tidak diubah)' : 'Password'}
                  placeholder="Masukkan password"
                  required={!editingUser}
                  {...form.getInputProps('password')}
                />
                 {/* Hanya tampilkan pilihan role saat membuat user baru */}
                 {!editingUser && (
                   <Select
                     label="Peran Awal"
                     placeholder="Pilih peran untuk staf baru"
                     data={roleOptions}
                     required
                     {...form.getInputProps('role_id')}
                   />
                 )}
                <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={handleCloseModal}>Batal</Button>
                <Button type="submit" loading={loading}>{editingUser ? 'Update Profil' : 'Tambah Staf'}</Button>
                </Group>
            </Stack>
            </form>
        </Modal>

        {/* Modal Assign/Change Role */}
         <Modal opened={assignModalOpened} onClose={handleCloseAssignModal} title={`Ubah Peran untuk ${assigningUser?.full_name || ''}`} centered >
           <Stack gap="md">
             <Select
               label="Pilih Peran Baru"
               placeholder="Pilih peran"
               data={roleOptions}
               value={selectedRoleId}
               onChange={setSelectedRoleId}
               required
             />
             <Group justify="flex-end" mt="md">
               <Button variant="default" onClick={handleCloseAssignModal}> Batal </Button>
               <Button onClick={handleAssignRole} loading={loading} disabled={!selectedRoleId || selectedRoleId === assigningUser?.assignment?.role_id}> Simpan Peran </Button>
             </Group>
           </Stack>
         </Modal>

        {/* Modal Delete Confirmation (Hapus Assignment) */}
        <Modal opened={deleteModalOpened} onClose={handleCloseDeleteModal} title="Konfirmasi Hapus Peran" centered size="sm" >
            <Stack gap="md">
            <Text size="sm"> Anda yakin ingin menghapus peran{' '} <strong>{deleteTarget?.assignment?.role_name}</strong> untuk staf{' '} <strong>{deleteTarget?.full_name}</strong> dari hotel ini? Staf tidak akan bisa login ke dashboard hotel ini lagi (kecuali diberi peran kembali). </Text>
            <Group justify="flex-end">
                <Button variant="default" onClick={handleCloseDeleteModal}> Batal </Button>
                <Button color="red" onClick={handleDeleteAssignment} loading={loading}> Hapus Peran </Button>
            </Group>
            </Stack>
        </Modal>
     </div>
  );
}

// Default export dengan ProtectedRoute
export default function StaffManagementPage() {
  return (
    // Sesuaikan requiredRoleName jika Manager juga boleh akses
    <ProtectedRoute requiredRoleName="Hotel Admin">
      <StaffManagementContent />
    </ProtectedRoute>
  );
}