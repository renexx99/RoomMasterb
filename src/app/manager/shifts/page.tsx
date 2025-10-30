// src/app/manager/shifts/page.tsx
'use client';

import { useState } from 'react'; // Hapus useEffect
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Center,
  Loader,
  ActionIcon,
  Button,
  Table,
  Modal,
  Select,
  // Hapus LoadingOverlay jika tidak perlu simulasi
} from '@mantine/core';
import { DatePicker, DateTimePicker, DatesProvider } from '@mantine/dates';
import 'dayjs/locale/id'; // Impor lokalisasi
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowLeft,
  IconCalendarPlus,
  IconTrash,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
// Hapus import supabase, useAuth, notifications
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

// --- DATA DUMMY (MOCK DATA) ---
// Interface untuk data shift
interface MockShift {
  id: string;
  profile: {
    full_name: string;
  };
  user_roles: {
    role_name: string;
  };
  start_time: string;
  end_time: string;
}

// Interface untuk daftar staf (untuk Select)
interface StaffMember {
  value: string; // user_id
  label: string; // full_name (Role)
  role: string; // role_name
}

// Data dummy untuk staf
const mockStaffList: StaffMember[] = [
  { value: 'user_1', label: 'Andi (Front Office)', role: 'Front Office' },
  { value: 'user_2', label: 'Citra (Front Office)', role: 'Front Office' },
  {
    value: 'user_3',
    label: 'Budi (Housekeeping)',
    role: 'Housekeeping Supervisor',
  },
  {
    value: 'user_4',
    label: 'Dewi (Housekeeping)',
    role: 'Housekeeping Supervisor',
  },
];

// Data dummy untuk shift (gunakan tanggal hari ini)
const today = new Date();
const mockShifts: MockShift[] = [
  {
    id: 'shift_1',
    profile: { full_name: 'Andi' },
    user_roles: { role_name: 'Front Office' },
    start_time: new Date(today.setHours(7, 0, 0, 0)).toISOString(),
    end_time: new Date(today.setHours(15, 0, 0, 0)).toISOString(),
  },
  {
    id: 'shift_2',
    profile: { full_name: 'Budi' },
    user_roles: { role_name: 'Housekeeping' },
    start_time: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
    end_time: new Date(today.setHours(17, 0, 0, 0)).toISOString(),
  },
  {
    id: 'shift_3',
    profile: { full_name: 'Citra' },
    user_roles: { role_name: 'Front Office' },
    start_time: new Date(today.setHours(15, 0, 0, 0)).toISOString(),
    end_time: new Date(today.setHours(23, 0, 0, 0)).toISOString(),
  },
];
// --- AKHIR DATA DUMMY ---

function ShiftsContent() {
  const router = useRouter();
  // State loading untuk simulasi
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  // Form untuk menambah shift baru
  const form = useForm({
    initialValues: {
      user_id: '',
      start_time: new Date(),
      end_time: new Date(new Date().getTime() + 8 * 60 * 60 * 1000), // Default 8 jam
    },
    validate: {
      user_id: (value) => (value ? null : 'Staf harus dipilih'),
      start_time: (value) => (value ? null : 'Waktu mulai harus diisi'),
      end_time: (value, values) =>
        value > values.start_time
          ? null
          : 'Waktu selesai harus setelah waktu mulai',
    },
  });

  // Handler DUMMY untuk menambah shift
  const handleAddShift = (values: typeof form.values) => {
    setLoading(true);
    console.log('Dummy Add Shift:', values);
    // Simulasi loading
    setTimeout(() => {
      setLoading(false);
      closeModal();
      form.reset();
      // Di aplikasi nyata, kita akan refresh data di sini
    }, 750);
  };

  // Handler DUMMY untuk menghapus shift
  const handleDeleteShift = (shiftId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus shift ini? (Demo)')) {
      return;
    }
    setLoading(true);
    console.log('Dummy Delete Shift:', shiftId);
    // Simulasi loading
    setTimeout(() => {
      setLoading(false);
      // Di aplikasi nyata, kita akan refresh data di sini
    }, 750);
  };

  // Render baris tabel dari data dummy
  // Filter shift berdasarkan tanggal yang dipilih (simulasi)
  const shiftRows = mockShifts
    .filter((shift) => {
      if (!selectedDate) return false;
      const shiftDate = new Date(shift.start_time);
      return (
        shiftDate.getDate() === selectedDate.getDate() &&
        shiftDate.getMonth() === selectedDate.getMonth() &&
        shiftDate.getFullYear() === selectedDate.getFullYear()
      );
    })
    .map((shift) => (
      <Table.Tr key={shift.id}>
        <Table.Td>{shift.profile?.full_name || 'Nama Staf'}</Table.Td>
        <Table.Td>{shift.user_roles?.role_name || 'Posisi'}</Table.Td>
        <Table.Td>
          {new Date(shift.start_time).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta',
          })}
        </Table.Td>
        <Table.Td>
          {new Date(shift.end_time).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta',
          })}
        </Table.Td>
        <Table.Td>
          <ActionIcon
            color="red"
            variant="light"
            onClick={() => handleDeleteShift(shift.id)}
            loading={loading}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
    ));

  return (
    // Bungkus dengan DatesProvider untuk lokalisasi kalender
    <DatesProvider settings={{ locale: 'id', firstDayOfWeek: 1, weekendDays: [0] }}>
      {/* Modal Tambah Shift */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title="Tambah Shift Baru"
        centered
      >
        <form onSubmit={form.onSubmit(handleAddShift)}>
          <Stack>
            <Select
              label="Staf"
              placeholder="Pilih staf"
              data={mockStaffList} // Menggunakan data dummy
              searchable
              nothingFoundMessage="Staf tidak ditemukan"
              {...form.getInputProps('user_id')}
            />
            <DateTimePicker
              locale="id"
              label="Waktu Mulai"
              placeholder="Pilih waktu mulai"
              {...form.getInputProps('start_time')}
            />
            <DateTimePicker
              locale="id"
              label="Waktu Selesai"
              placeholder="Pilih waktu selesai"
              {...form.getInputProps('end_time')}
            />
            <Button type="submit" loading={loading} mt="md">
              Simpan Shift
            </Button>
          </Stack>
        </form>
      </Modal>

      {/* Konten Halaman Utama */}
      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
                    onClick={() => router.push('/manager/dashboard')}
                    aria-label="Kembali ke Dashboard Manager"
                  >
                    <IconArrowLeft size={20} />
                  </ActionIcon>
                  <Title order={1} c="white">
                    Manajemen Shift
                  </Title>
                </Group>
                <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
                  Atur jadwal kerja staf Front Office dan Housekeeping.
                </Text>
              </div>
            </Group>
          </Container>
        </div>

        {/* Konten */}
        <Container size="lg" pb="xl">
          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Stack>
              <Group justify="space-between">
                <Title order={3}>Jadwal Shift</Title>
                <Button
                  leftSection={<IconCalendarPlus size={16} />}
                  onClick={openModal}
                  disabled={!selectedDate}
                >
                  Tambah Shift
                </Button>
              </Group>

              <Group align="flex-start" gap="xl">
                <DatePicker
                  value={selectedDate}
                  // onChange={setSelectedDate} // Baris ini MASIH SALAH
                  allowDeselect={false}
                  locale="id" // Gunakan lokalisasi
                />

                <Paper
                  withBorder
                  radius="md"
                  p="md"
                  style={{ flex: 1, position: 'relative' }}
                >
                  <Title order={4} mb="md">
                    Shift untuk:{' '}
                    {selectedDate
                      ? selectedDate.toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '...'}
                  </Title>
                  <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Nama Staf</Table.Th>
                        <Table.Th>Posisi</Table.Th>
                        <Table.Th>Mulai</Table.Th>
                        <Table.Th>Selesai</Table.Th>
                        <Table.Th>Aksi</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {shiftRows.length > 0 ? (
                        shiftRows
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={5}>
                            <Text c="dimmed" ta="center" py="lg">
                              Tidak ada shift pada tanggal ini.
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Paper>
              </Group>
            </Stack>
          </Paper>
        </Container>
      </div>
    </DatesProvider>
  );
}

// Bungkus dengan ProtectedRoute
export default function ManagerShiftsPage() {
  return (
    <ProtectedRoute requiredRoleName="Hotel Manager">
      <ShiftsContent />
    </ProtectedRoute>
  );
}