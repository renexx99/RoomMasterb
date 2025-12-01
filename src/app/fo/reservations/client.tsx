// src/app/fo/reservations/client.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Container, Title, Button, Group, Paper, TextInput, Select,
  Box, ThemeIcon, Tabs, Grid, MultiSelect, Text // <-- PERBAIKAN: Tambahkan Text di sini
} from '@mantine/core';
import { DatePickerInput, DatesProvider, DateValue } from '@mantine/dates';
import 'dayjs/locale/id';
import '@mantine/dates/styles.css';
import { IconPlus, IconArrowLeft, IconSearch, IconCalendarEvent, IconList, IconTimeline } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';

import { ReservationDetails, GuestOption, RoomWithDetails } from './page';
import { ReservationsTable } from './components/ReservationsTable';
import { ReservationFormModal } from './components/ReservationFormModal';
import { deleteReservation } from './actions';
import ReservationTapeChart from '@/components/ReservationChart/ReservationTapeChart';

interface ClientProps {
  initialReservations: ReservationDetails[];
  guests: GuestOption[];
  rooms: RoomWithDetails[];
  hotelId: string | null;
}

export default function FoReservationsClient({ initialReservations, guests, rooms, hotelId }: ClientProps) {
  const router = useRouter();
  const MAX_WIDTH = 1400;

  const [activeTab, setActiveTab] = useState<string | null>('list');
  
  // UI States
  const [modalOpened, setModalOpened] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationDetails | null>(null);
  // State untuk data pre-filled dari timeline
  const [prefilledData, setPrefilledData] = useState<{ room_id?: string, check_in_date?: Date, check_out_date?: Date } | null>(null);

  // Filter Logic
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string[]>([]);
  const [filterDateRange, setFilterDateRange] = useState<[DateValue, DateValue]>([null, null]);

  const filteredReservations = useMemo(() => {
    let result = [...initialReservations];
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(res => res.guest?.full_name.toLowerCase().includes(lower) || res.room?.room_number.includes(lower));
    }
    if (filterPaymentStatus.length > 0) {
        result = result.filter(res => filterPaymentStatus.includes(res.payment_status));
    }
    return result;
  }, [initialReservations, searchTerm, filterPaymentStatus]);

  // --- Handlers ---
  const handleOpenCreate = () => {
    setEditingReservation(null);
    setPrefilledData(null);
    setModalOpened(true);
  };

  const handleOpenEdit = (res: ReservationDetails) => {
    setEditingReservation(res);
    setPrefilledData(null);
    setModalOpened(true);
  };

  // Handler saat user drag di timeline
  const handleTimelineSelect = (selection: { start: Date; end: Date; resourceId: string }) => {
    setEditingReservation(null);
    setPrefilledData({
        room_id: selection.resourceId,
        check_in_date: selection.start,
        check_out_date: selection.end
    });
    setModalOpened(true);
  };

  const handleEventClick = (id: string) => {
      const res = initialReservations.find(r => r.id === id);
      if (res) handleOpenEdit(res);
  };

  if (!hotelId) return null;

  return (
    <DatesProvider settings={{ locale: 'id', firstDayOfWeek: 1, weekendDays: [0] }}>
      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', padding: '0.75rem 0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <Container fluid px="lg">
            <Box maw={MAX_WIDTH} mx="auto">
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon variant="light" color="white" size="lg" radius="md" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                    <IconCalendarEvent size={20} stroke={1.5} />
                  </ThemeIcon>
                  <div>
                    <Title order={4} c="white">Reservasi</Title>
                    {/* Sekarang Text sudah diimpor, error akan hilang */}
                    <Text c="teal.0" size="xs">Kelola booking & jadwal</Text>
                  </div>
                </Group>
                <Group>
                    <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate} variant="white" color="teal" size="xs">
                        Buat Reservasi
                    </Button>
                </Group>
              </Group>
            </Box>
          </Container>
        </div>

        <Container fluid px="lg" py="md">
          <Box maw={MAX_WIDTH} mx="auto">
            
            {/* Tabs View */}
            <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md" color="teal" mb="lg">
                <Tabs.List>
                    <Tabs.Tab value="list" leftSection={<IconList size={16}/>}>List View</Tabs.Tab>
                    <Tabs.Tab value="timeline" leftSection={<IconTimeline size={16}/>}>Timeline View</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="list" pt="md">
                    <Paper shadow="xs" p="sm" radius="md" withBorder mb="md">
                        <Grid align="flex-end">
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <TextInput placeholder="Cari tamu..." leftSection={<IconSearch size={16}/>} value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <MultiSelect placeholder="Status Bayar" data={['paid', 'pending', 'cancelled']} value={filterPaymentStatus} onChange={setFilterPaymentStatus} clearable />
                            </Grid.Col>
                        </Grid>
                    </Paper>
                    <ReservationsTable 
                        data={filteredReservations} 
                        onEdit={handleOpenEdit} 
                        onDelete={() => {}} 
                    />
                </Tabs.Panel>

                <Tabs.Panel value="timeline" pt="md">
                    <Paper shadow="sm" p={0} radius="md" withBorder style={{ overflow: 'hidden' }}>
                        <Box p="xs">
                            <ReservationTapeChart 
                                rooms={rooms} 
                                reservations={filteredReservations}
                                onEventClick={handleEventClick}
                                onDateSelect={handleTimelineSelect}
                            />
                        </Box>
                    </Paper>
                </Tabs.Panel>
            </Tabs>

          </Box>
        </Container>

        <ReservationFormModal 
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          hotelId={hotelId}
          reservationToEdit={editingReservation}
          prefilledData={prefilledData}
          guests={guests}
          availableRooms={rooms}
        />
      </div>
    </DatesProvider>
  );
}