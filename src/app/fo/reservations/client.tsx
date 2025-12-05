// src/app/fo/reservations/client.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Box, Group, TextInput, Select, Button, MultiSelect, Badge,
  ScrollArea, Card, Avatar, Text, ActionIcon, Menu, SegmentedControl, Stack
} from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import 'dayjs/locale/id';
import '@mantine/dates/styles.css';
import { 
  IconSearch, IconCalendarEvent, IconList, IconTimeline,
  IconDots, IconArrowRight, IconPencil, IconTrash
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';

import { ReservationDetails, GuestOption, RoomWithDetails } from './page';
import { TimelineView } from './components/TimelineView';
import { QuickBookingPanel } from './components/QuickBookingPanel';
import { AISuggestionsPanel, AICoPilotPanel } from './components/AISuggestionsPanel';
import { ReservationFormModal } from './components/ReservationFormModal';
import { deleteReservation } from './actions';

interface ClientProps {
  initialReservations: ReservationDetails[];
  guests: GuestOption[];
  rooms: RoomWithDetails[];
  hotelId: string | null;
}

export default function FoReservationsClient({ 
  initialReservations, 
  guests, 
  rooms, 
  hotelId 
}: ClientProps) {
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [rightPanelMode, setRightPanelMode] = useState<'booking' | 'ai'>('booking');
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  
  // Modal states
  const [modalOpened, setModalOpened] = useState(false);
  const [reservationToEdit, setReservationToEdit] = useState<ReservationDetails | null>(null);
  const [prefilledData, setPrefilledData] = useState<{
    room_id?: string;
    check_in_date?: Date;
    check_out_date?: Date;
  } | null>(null);

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return initialReservations.filter(res => {
      const matchesSearch = !searchTerm || 
        res.guest?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.room?.room_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus.length === 0 || 
        filterStatus.includes(res.payment_status);
      
      return matchesSearch && matchesStatus;
    });
  }, [initialReservations, searchTerm, filterStatus]);

  // Handle drag create from timeline
  const handleDragCreate = (roomId: string, startDate: Date, endDate: Date) => {
    setPrefilledData({
      room_id: roomId,
      check_in_date: startDate,
      check_out_date: endDate
    });
    setReservationToEdit(null);
    setModalOpened(true);
  };

  // Handle edit
  const handleEdit = (reservation: ReservationDetails) => {
    setReservationToEdit(reservation);
    setPrefilledData(null);
    setModalOpened(true);
  };

  // Handle delete
  const handleDelete = (reservation: ReservationDetails) => {
    modals.openConfirmModal({
      title: 'Hapus Reservasi',
      children: (
        <Text size="sm">
          Apakah Anda yakin ingin menghapus reservasi untuk <strong>{reservation.guest?.full_name}</strong>?
        </Text>
      ),
      labels: { confirm: 'Hapus', cancel: 'Batal' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const result = await deleteReservation(reservation.id);
        if (result.error) {
          notifications.show({
            title: 'Gagal',
            message: result.error,
            color: 'red'
          });
        } else {
          notifications.show({
            title: 'Berhasil',
            message: 'Reservasi berhasil dihapus',
            color: 'green'
          });
          router.refresh();
        }
      }
    });
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalOpened(false);
    setReservationToEdit(null);
    setPrefilledData(null);
  };

  // Handle booking success
  const handleBookingSuccess = () => {
    router.refresh();
  };

  if (!hotelId) return null;

  // Calculate stats
  const availableRoomsCount = rooms.filter(r => r.status === 'available').length;

  return (
    <DatesProvider settings={{ locale: 'id', firstDayOfWeek: 1, weekendDays: [0] }}>
      <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
        
        {/* Main Content Area - Split View */}
        <Box style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* LEFT PANEL - Main View (68%) */}
          <Box style={{ 
            width: '68%', 
            borderRight: '1px solid #e9ecef',
            display: 'flex',
            flexDirection: 'column',
            background: 'white'
          }}>
            
            {/* Toolbar */}
            <Box p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
              <Group justify="space-between">
                <Group gap="xs">
                  <TextInput
                    placeholder="Cari tamu, nomor kamar..."
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                    style={{ width: 300 }}
                    size="sm"
                  />
                  
                  <MultiSelect
                    placeholder="Status Pembayaran"
                    data={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'paid', label: 'Paid' },
                      { value: 'cancelled', label: 'Cancelled' }
                    ]}
                    value={filterStatus}
                    onChange={setFilterStatus}
                    size="sm"
                    style={{ width: 200 }}
                    clearable
                  />

                  <SegmentedControl
                    value={viewMode}
                    onChange={(val) => setViewMode(val as any)}
                    data={[
                      { 
                        label: (
                          <Group gap={4}>
                            <IconTimeline size={14} />
                            <span>Timeline</span>
                          </Group>
                        ), 
                        value: 'timeline' 
                      },
                      { 
                        label: (
                          <Group gap={4}>
                            <IconList size={14} />
                            <span>List</span>
                          </Group>
                        ), 
                        value: 'list' 
                      }
                    ]}
                    size="xs"
                    color="teal"
                  />
                </Group>
                
                <Group gap="xs">
                  <Badge color="teal" variant="filled" size="sm">
                    {availableRoomsCount} Kamar Tersedia
                  </Badge>
                  <Badge color="blue" variant="light" size="sm">
                    {filteredReservations.length} Reservasi
                  </Badge>
                </Group>
              </Group>
            </Box>

            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <ScrollArea style={{ flex: 1 }} p="md">
                <TimelineView 
                  rooms={rooms}
                  reservations={filteredReservations}
                  onDragCreate={handleDragCreate}
                />
              </ScrollArea>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <ScrollArea style={{ flex: 1 }} p="md">
                <Stack gap="xs">
                  {filteredReservations.map((res) => (
                    <Card key={res.id} padding="md" radius="md" withBorder>
                      <Group justify="space-between">
                        <Group>
                          <Avatar color="teal" radius="xl">
                            {res.guest?.full_name?.charAt(0) || '?'}
                          </Avatar>
                          <div>
                            <Text fw={600}>{res.guest?.full_name || 'N/A'}</Text>
                            <Text size="sm" c="dimmed">Kamar {res.room?.room_number}</Text>
                          </div>
                        </Group>
                        
                        <Group>
                          <Box ta="right">
                            <Text size="sm" c="dimmed">Check-in</Text>
                            <Text size="sm" fw={600}>
                              {new Date(res.check_in_date).toLocaleDateString('id')}
                            </Text>
                          </Box>
                          <IconArrowRight size={16} />
                          <Box ta="right">
                            <Text size="sm" c="dimmed">Check-out</Text>
                            <Text size="sm" fw={600}>
                              {new Date(res.check_out_date).toLocaleDateString('id')}
                            </Text>
                          </Box>
                          
                          <Badge color={res.payment_status === 'paid' ? 'teal' : 'yellow'}>
                            {res.payment_status}
                          </Badge>
                          
                          <Menu>
                            <Menu.Target>
                              <ActionIcon variant="light" color="gray">
                                <IconDots size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item 
                                leftSection={<IconPencil size={14} />}
                                onClick={() => handleEdit(res)}
                              >
                                Edit
                              </Menu.Item>
                              <Menu.Item 
                                color="red" 
                                leftSection={<IconTrash size={14} />}
                                onClick={() => handleDelete(res)}
                              >
                                Hapus
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </ScrollArea>
            )}
          </Box>

          {/* RIGHT PANEL - Action & AI Panel (32%) */}
          <Box style={{ width: '32%', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
            
            {/* Panel Mode Switcher */}
            <Box p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
              <SegmentedControl
                value={rightPanelMode}
                onChange={(val) => setRightPanelMode(val as any)}
                data={[
                  { label: 'Quick Book', value: 'booking' },
                  { label: 'AI Co-Pilot', value: 'ai' }
                ]}
                fullWidth
                color="teal"
              />
            </Box>

            <ScrollArea style={{ flex: 1 }} p="md">
              {rightPanelMode === 'booking' ? (
                <>
                  <QuickBookingPanel 
                    hotelId={hotelId}
                    guests={guests}
                    rooms={rooms}
                    prefilledData={prefilledData}
                    onSuccess={handleBookingSuccess}
                  />
                  <AISuggestionsPanel />
                </>
              ) : (
                <AICoPilotPanel />
              )}
            </ScrollArea>
          </Box>
        </Box>
      </Box>

      {/* Reservation Form Modal */}
      <ReservationFormModal
        opened={modalOpened}
        onClose={handleModalClose}
        hotelId={hotelId}
        reservationToEdit={reservationToEdit}
        prefilledData={prefilledData}
        guests={guests}
        availableRooms={rooms}
      />
    </DatesProvider>
  );
}