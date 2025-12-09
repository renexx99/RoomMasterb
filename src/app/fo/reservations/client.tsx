// src/app/fo/reservations/client.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Box, Group, TextInput, Button, MultiSelect, Badge,
  ScrollArea, Card, Avatar, Text, ActionIcon, Menu, SegmentedControl, Stack, Center
} from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import 'dayjs/locale/id';
import '@mantine/dates/styles.css';
import { 
  IconSearch, IconList, IconTimeline,
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

  // --- STYLE KHUSUS SEGMENTED CONTROL ---
  // Kita gunakan inline styles untuk root & indicator, 
  // tapi teks active ditangani oleh CSS class di bawah
  const gradientSegmentedStyles = {
    root: {
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
    },
    indicator: {
      // Gradient Teal ke Biru
      background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
      boxShadow: '0 2px 4px rgba(20, 184, 166, 0.2)',
    },
    label: {
      fontWeight: 500,
      color: 'var(--mantine-color-gray-6)', // Warna default (saat tidak aktif)
      transition: 'color 0.2s ease',
    },
  };

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

  // Handlers
  const handleDragCreate = (roomId: string, startDate: Date, endDate: Date) => {
    setPrefilledData({ room_id: roomId, check_in_date: startDate, check_out_date: endDate });
    setReservationToEdit(null);
    setModalOpened(true);
  };

  const handleEdit = (reservation: ReservationDetails) => {
    setReservationToEdit(reservation);
    setPrefilledData(null);
    setModalOpened(true);
  };

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
          notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
        } else {
          notifications.show({ title: 'Berhasil', message: 'Reservasi berhasil dihapus', color: 'green' });
          router.refresh();
        }
      }
    });
  };

  const handleModalClose = () => {
    setModalOpened(false);
    setReservationToEdit(null);
    setPrefilledData(null);
  };

  const handleBookingSuccess = () => {
    router.refresh();
  };

  if (!hotelId) return null;

  // Calculate stats
  const availableRoomsCount = rooms.filter(r => r.status === 'available').length;

  return (
    <DatesProvider settings={{ locale: 'id', firstDayOfWeek: 1, weekendDays: [0] }}>
      {/* Inject CSS Manual untuk menangani state Active */}
      <style dangerouslySetInnerHTML={{ __html: `
        .fo-segmented-control .mantine-SegmentedControl-label[data-active] {
          color: #ffffff !important;
          font-weight: 600;
        }
        .fo-segmented-control .mantine-SegmentedControl-label:hover {
          color: var(--mantine-color-gray-9);
        }
        .fo-segmented-control .mantine-SegmentedControl-label[data-active]:hover {
          color: #ffffff !important;
        }
      `}} />

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

                  {/* UPDATE: Segmented Control - Timeline/List */}
                  <SegmentedControl
                    value={viewMode}
                    onChange={(val) => setViewMode(val as any)}
                    className="fo-segmented-control" // Class khusus untuk CSS override
                    data={[
                      { 
                        label: (
                          <Center>
                            <Group gap={6} wrap="nowrap">
                              <IconTimeline size={16} />
                              <span>Timeline</span>
                            </Group>
                          </Center>
                        ), 
                        value: 'timeline' 
                      },
                      { 
                        label: (
                          <Center>
                            <Group gap={6} wrap="nowrap">
                              <IconList size={16} />
                              <span>List</span>
                            </Group>
                          </Center>
                        ), 
                        value: 'list' 
                      }
                    ]}
                    size="sm"
                    radius="md"
                    styles={gradientSegmentedStyles}
                  />
                </Group>
                
                <Group gap="xs">
                  <Badge 
                    size="sm" 
                    variant="gradient" 
                    gradient={{ from: '#14b8a6', to: '#0891b2', deg: 135 }}
                  >
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
            
            {/* Panel Mode Switcher - Quick Book / AI */}
            <Box p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
              <SegmentedControl
                value={rightPanelMode}
                onChange={(val) => setRightPanelMode(val as any)}
                className="fo-segmented-control" // Class khusus untuk CSS override
                data={[
                  { label: 'Quick Book', value: 'booking' },
                  { label: 'AI Co-Pilot', value: 'ai' }
                ]}
                fullWidth
                radius="md"
                size="sm"
                styles={gradientSegmentedStyles}
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