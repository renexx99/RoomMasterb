// src/app/fo/log/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
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
  TextInput,
  Avatar,
  Box,
  Grid,
  ScrollArea,
  Card,
  Divider,
  Textarea,
  Button,
  Timeline,
}
from '@mantine/core';
import {
  IconArrowLeft,
  IconSearch,
  IconUser,
  IconBed,
  IconCalendarEvent,
  IconMessagePlus,
  IconClock,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/config/supabaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { Reservation, Guest, Room, RoomType } from '@/core/types/database';

// Tipe data gabungan untuk reservasi
interface ReservationDetails extends Reservation {
  guest: Pick<Guest, 'id' | 'full_name' | 'email'>;
  room: Pick<Room, 'id' | 'room_number'> & {
    room_type: Pick<RoomType, 'id' | 'name'>;
  };
}

// Tipe data untuk entri log (Simulasi)
interface LogEntry {
  id: string;
  timestamp: Date;
  entry: string;
  staffName: string;
}

function GuestLogContent() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Daftar tamu in-house
  const [
    inHouseReservations,
    setInHouseReservations,
  ] = useState<ReservationDetails[]>([]);

  // State untuk Log
  const [
    selectedReservation,
    setSelectedReservation,
  ] = useState<ReservationDetails | null>(null);
  const [mockGuestLog, setMockGuestLog] = useState<LogEntry[]>([]);
  const [newLogEntry, setNewLogEntry] = useState('');

  const assignedHotelId = profile?.roles?.find(
    (r) => r.hotel_id && r.role_name === 'Front Office'
  )?.hotel_id;

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!authLoading && assignedHotelId) {
      fetchInHouseReservations();
    } else if (!authLoading && !assignedHotelId) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, assignedHotelId]);

  // Ambil data tamu yang sedang menginap
  const fetchInHouseReservations = async () => {
    if (!assignedHotelId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(
          `*, guest:guests(id, full_name, email), room:rooms(id, room_number, room_type:room_types(id, name))`
        )
        .eq('hotel_id', assignedHotelId)
        .lte('check_in_date', today)
        .gte('check_out_date', today)
        .neq('payment_status', 'cancelled')
        .order('check_in_date', { ascending: true });

      if (error) throw error;
      setInHouseReservations((data as ReservationDetails[]) || []);
    } catch (error: any) {
      console.error('Error fetching in-house reservations:', error);
      notifications.show({
        title: 'Error',
        message:
          error?.message || 'Gagal memuat data reservasi yang sedang aktif.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter tamu in-house berdasarkan pencarian
  const filteredReservations = useMemo(() => {
    if (!searchTerm) return inHouseReservations;
    const lowerSearch = searchTerm.toLowerCase();
    return inHouseReservations.filter(
      (res) =>
        res.guest.full_name.toLowerCase().includes(lowerSearch) ||
        res.room.room_number.toLowerCase().includes(lowerSearch)
    );
  }, [inHouseReservations, searchTerm]);

  // --- Handlers ---
  const handleSelectReservation = (res: ReservationDetails) => {
    setSelectedReservation(res);
    // (Simulasi) Muat log untuk tamu ini
    setMockGuestLog([
      {
        id: 'log1',
        timestamp: new Date(Date.now() - 3600000 * 2), // 2 jam lalu
        entry: 'Tamu meminta tambahan 2 bantal.',
        staffName: 'Andi (FO)',
      },
      {
        id: 'log2',
        timestamp: new Date(Date.now() - 3600000 * 1), // 1 jam lalu
        entry: 'Bantal telah diantarkan oleh Housekeeping.',
        staffName: 'Budi (HK)',
      },
    ]);
    setNewLogEntry(''); // Kosongkan input
  };

  const handleAddNewLog = () => {
    if (!newLogEntry.trim() || !profile) return;

    // (Simulasi) Buat entri baru dan tambahkan ke state
    const newEntry: LogEntry = {
      id: `demo_${Math.random()}`,
      timestamp: new Date(),
      entry: newLogEntry,
      staffName: profile.full_name || 'Front Office',
    };

    // Tambahkan ke atas (paling baru)
    setMockGuestLog((currentLogs) => [newEntry, ...currentLogs]);

    notifications.show({
      title: 'Log Ditambahkan (Demo)',
      message: 'Catatan baru berhasil ditambahkan ke log tamu.',
      color: 'teal',
    });

    setNewLogEntry(''); // Kosongkan textarea
    // Di aplikasi nyata, ini akan menjadi INSERT ke tabel 'guest_logs'
  };

  if (authLoading && !profile) {
    return (
      <Center style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Halaman */}
      <div
        style={{
          background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
          padding: '2rem 0',
          marginBottom: '2rem',
        }}
      >
        <Container size="lg">
          <div>
            <Group mb="xs">
              <ActionIcon
                variant="transparent"
                color="white"
                onClick={() => router.push('/fo/dashboard')}
                aria-label="Kembali ke Dashboard"
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Title order={1} c="white">
                Komunikasi & Log Tamu
              </Title>
            </Group>
            <Text c="white" opacity={0.9} pl={{ base: 0, xs: 36 }}>
              Monitor aktivitas dan permintaan tamu yang sedang menginap.
            </Text>
          </div>
        </Container>
      </div>

      {/* Konten Utama (Layout 2 Kolom) */}
      <Container size="lg" pb="xl">
        <Grid>
          {/* Kolom Kiri: Daftar Tamu In-House */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper shadow="sm" radius="md" withBorder p="md">
              <Stack>
                <TextInput
                  placeholder="Cari tamu atau kamar..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.currentTarget.value)
                  }
                  disabled={loading}
                />
                <Divider label="Tamu In-House" />
                <ScrollArea
                  h="calc(100vh - 340px)"
                  type="auto"
                  offsetScrollbars
                >
                  {loading && (
                    <Center>
                      <Loader />
                    </Center>
                  )}
                  {!loading && filteredReservations.length === 0 && (
                    <Center py="xl">
                      <Text c="dimmed" size="sm" ta="center">
                        {searchTerm
                          ? 'Tamu tidak ditemukan'
                          : 'Tidak ada tamu in-house'}
                      </Text>
                    </Center>
                  )}
                  <Stack gap="xs">
                    {filteredReservations.map((res) => (
                      <Paper
                        key={res.id}
                        p="sm"
                        radius="sm"
                        withBorder
                        onClick={() => handleSelectReservation(res)}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background:
                            selectedReservation?.id === res.id
                              ? 'var(--mantine-color-teal-0)'
                              : 'white',
                          borderColor:
                            selectedReservation?.id === res.id
                              ? 'var(--mantine-color-teal-5)'
                              : 'var(--mantine-color-gray-3)',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedReservation?.id !== res.id)
                            e.currentTarget.style.borderColor =
                              'var(--mantine-color-teal-2)';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedReservation?.id !== res.id)
                            e.currentTarget.style.borderColor =
                              'var(--mantine-color-gray-3)';
                        }}
                      >
                        <Group>
                          <Avatar color="teal" size="md" radius="xl">
                            <IconUser size={18} />
                          </Avatar>
                          <Box style={{ flex: 1 }}>
                            <Text fw={600} size="sm" truncate>
                              {res.guest.full_name}
                            </Text>
                            <Text c="dimmed" size="xs">
                              Kamar {res.room.room_number}
                            </Text>
                          </Box>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </ScrollArea>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Kolom Kanan: Detail Log */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper shadow="sm" radius="md" withBorder p="lg">
              {!selectedReservation ? (
                <Center h="calc(100vh - 280px)">
                  <Stack align="center" gap="xs">
                    <IconMessagePlus size={48} stroke={1.5} color="gray" />
                    <Text c="dimmed" size="lg" fw={500}>
                      Pilih Tamu
                    </Text>
                    <Text c="dimmed" ta="center" maw={300}>
                      Pilih tamu dari daftar di sebelah kiri untuk melihat atau
                      menambah log komunikasi.
                    </Text>
                  </Stack>
                </Center>
              ) : (
                <Stack>
                  {/* Info Tamu Terpilih */}
                  <Card p="md" radius="md" withBorder bg="gray.0">
                    <Group justify="space-between">
                      <Box>
                        <Title order={3}>
                          {selectedReservation.guest.full_name}
                        </Title>
                        <Group gap="md" mt={4}>
                          <Group gap={4}>
                            <IconBed
                              size={16}
                              stroke={1.5}
                              color="var(--mantine-color-gray-7)"
                            />
                            <Text size="sm" c="dimmed">
                              Kamar {selectedReservation.room.room_number} (
                              {selectedReservation.room.room_type.name})
                            </Text>
                          </Group>
                          <Group gap={4}>
                            <IconCalendarEvent
                              size={16}
                              stroke={1.5}
                              color="var(--mantine-color-gray-7)"
                            />
                            <Text size="sm" c="dimmed">
                              {new Date(
                                selectedReservation.check_in_date + 'T00:00:00'
                              ).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                              })}{' '}
                              -{' '}
                              {new Date(
                                selectedReservation.check_out_date + 'T00:00:00'
                              ).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </Text>
                          </Group>
                        </Group>
                      </Box>
                    </Group>
                  </Card>

                  <Divider my="md" label="Tambah Catatan Log Baru" />

                  {/* Input Log Baru */}
                  <Stack>
                    <Textarea
                      placeholder="Masukkan permintaan tamu, keluhan, atau catatan penting..."
                      autosize
                      minRows={3}
                      value={newLogEntry}
                      onChange={(e) => setNewLogEntry(e.currentTarget.value)}
                    />
                    <Button
                      color="teal"
                      leftSection={<IconMessagePlus size={18} />}
                      onClick={handleAddNewLog}
                      disabled={!newLogEntry.trim()}
                    >
                      Simpan Catatan (Demo)
                    </Button>
                  </Stack>

                  <Divider my="md" label="Aktivitas Log" />

                  {/* Timeline Log (Simulasi) */}
                  <ScrollArea
                    h="calc(100vh - 600px)"
                    type="auto"
                    offsetScrollbars
                  >
                    {mockGuestLog.length === 0 ? (
                      <Center py="lg">
                        <Text c="dimmed">Belum ada log untuk tamu ini.</Text>
                      </Center>
                    ) : (
                      <Timeline active={0} bulletSize={16} color="teal">
                        {mockGuestLog.map((log) => (
                          <Timeline.Item
                            key={log.id}
                            bullet={<IconClock size={10} />}
                            title={
                              <Group justify="space-between">
                                <Text fw={500} size="sm">
                                  {log.staffName}
                                </Text>
                                <Text c="dimmed" size="xs">
                                  {log.timestamp.toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                              </Group>
                            }
                          >
                            <Text c="dimmed" size="sm">
                              {log.entry}
                            </Text>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    )}
                  </ScrollArea>
                </Stack>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  );
}

// Bungkus dengan ProtectedRoute
export default function GuestLogPage() {
  return (
    <ProtectedRoute requiredRoleName="Front Office">
      <GuestLogContent />
    </ProtectedRoute>
  );
}