'use client';

import { useState } from 'react';
import {
  Container, Paper, Tabs, Group, Title, Text, 
  Modal, Stack, Avatar, Button, Badge, Box, ThemeIcon, ActionIcon
} from '@mantine/core';
import '@mantine/dates/styles.css'; 
import { DatePickerInput, DateValue } from '@mantine/dates';
import { 
  IconCalendar, IconLogin, IconLogout, IconUser, IconCheck, IconX, IconArrowLeft
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { ReservationDetails } from './page';
import { CheckInList } from './components/CheckInList';
import { checkInGuest, checkOutGuest } from './actions';

interface ClientProps {
  initialArrivals: ReservationDetails[];
  initialDepartures: ReservationDetails[];
  hotelId: string | null;
  selectedDate: string;
}

export default function CheckInClient({ initialArrivals, initialDepartures, hotelId, selectedDate }: ClientProps) {
  const router = useRouter();
  const CONTAINER_SIZE = "xl"; 

  // UI State
  const [dateValue, setDateValue] = useState<Date | null>(new Date(selectedDate));
  const [checkInModalOpened, setCheckInModalOpened] = useState(false);
  const [checkOutModalOpened, setCheckOutModalOpened] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('arrivals');

  // --- HANDLER TANGGAL ---
  const handleDateChange = (val: DateValue) => {
    if (val instanceof Date) {
      setDateValue(val);
      const offset = val.getTimezoneOffset();
      const localDate = new Date(val.getTime() - (offset * 60 * 1000));
      const dateStr = localDate.toISOString().split('T')[0];
      router.push(`/fo/check-in?date=${dateStr}`);
    } else {
      setDateValue(null);
    }
  };

  // Modal Handlers
  const openCheckIn = (res: ReservationDetails) => { setSelectedReservation(res); setCheckInModalOpened(true); };
  const openCheckOut = (res: ReservationDetails) => { setSelectedReservation(res); setCheckOutModalOpened(true); };
  const closeModals = () => { setCheckInModalOpened(false); setCheckOutModalOpened(false); setSelectedReservation(null); };

  // Actions
  const handleConfirmCheckIn = async () => {
    if (!selectedReservation) return;
    setIsSubmitting(true);
    try {
      const res = await checkInGuest(selectedReservation.id, selectedReservation.room_id);
      if (res.error) {
        notifications.show({ title: 'Failed', message: res.error, color: 'red', icon: <IconX size={16}/> });
      } else {
        notifications.show({ title: 'Success', message: 'Guest checked in', color: 'teal', icon: <IconCheck size={16}/> });
        closeModals();
      }
    } catch {
      notifications.show({ title: 'Error', message: 'System error', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCheckOut = async () => {
    if (!selectedReservation) return;
    setIsSubmitting(true);
    try {
      const res = await checkOutGuest(selectedReservation.id, selectedReservation.room_id);
      if (res.error) {
        notifications.show({ title: 'Failed', message: res.error, color: 'red', icon: <IconX size={16}/> });
      } else {
        notifications.show({ title: 'Success', message: 'Guest checked out', color: 'blue', icon: <IconCheck size={16}/> });
        closeModals();
      }
    } catch {
      notifications.show({ title: 'Error', message: 'System error', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hotelId) return <Container py="xl"><Text c="dimmed" ta="center">No Hotel Assigned</Text></Container>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '2rem' }}>
      
      {/* 1. TOP TOOLBAR (Clean Look) */}
      <div style={{ background: 'white', borderBottom: '1px solid #e9ecef', padding: '1rem 0' }}>
        <Container size={CONTAINER_SIZE}>
          <Group justify="space-between" align="center">
            <Group gap="sm">
                <ThemeIcon variant="light" color="teal" size="lg" radius="md">
                    <IconLogin size={20} stroke={1.5} />
                </ThemeIcon>
                <div>
                    <Title order={4} c="dark.7">Front Desk Operations</Title>
                    <Text c="dimmed" size="xs">Daily arrivals & departures management</Text>
                </div>
            </Group>

            <DatePickerInput
                leftSection={<IconCalendar size={16} stroke={1.5} />}
                placeholder="Select Date"
                value={dateValue}
                onChange={handleDateChange}
                valueFormat="DD MMMM YYYY"
                w={220}
                size="sm"
                radius="md"
                clearable={false}
                styles={{
                    input: {
                        fontWeight: 500,
                        borderColor: '#e9ecef'
                    }
                }}
            />
          </Group>
        </Container>
      </div>

      <Container size={CONTAINER_SIZE} mt="lg">
        {/* CSS Override untuk Tabs Aktif (Gradient Hijau & Text Putih) */}
        <style jsx global>{`
          .checkin-tabs .mantine-Tabs-tab[data-active] {
            background-image: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%);
            color: white;
            border: none;
          }
          .checkin-tabs .mantine-Tabs-tab[data-active] .mantine-Badge-root {
            background-color: rgba(255,255,255,0.2);
            color: white;
          }
          .checkin-tabs .mantine-Tabs-tab {
            background-color: white;
            border: 1px solid #e9ecef;
            transition: all 0.2s ease;
          }
          .checkin-tabs .mantine-Tabs-tab:hover {
            background-color: #f1f3f5;
          }
        `}</style>

        <Stack gap="lg">
          {/* 2. MAIN LIST TABS */}
          {/* Layout Tab dibuat full width dengan style pills */}
          <Tabs 
            value={activeTab} 
            onChange={setActiveTab} 
            variant="pills"
            radius="md"
            className="checkin-tabs"
          >
            <Tabs.List grow mb="lg">
              <Tabs.Tab value="arrivals" py="md">
                {/* Text dan Badge dibuat sejajar (Group) */}
                <Group gap="xs" justify="center">
                    <IconLogin size={18} />
                    <Text fw={600} size="sm">Expected Arrival</Text>
                    <Badge size="sm" circle color="teal" variant="light">{initialArrivals.length}</Badge>
                </Group>
              </Tabs.Tab>
              <Tabs.Tab value="departures" py="md">
                <Group gap="xs" justify="center">
                    <IconLogout size={18} />
                    <Text fw={600} size="sm">Expected Departure</Text>
                    <Badge size="sm" circle color="orange" variant="light">{initialDepartures.length}</Badge>
                </Group>
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="arrivals">
              <CheckInList 
                data={initialArrivals} 
                type="check-in" 
                onAction={openCheckIn} 
              />
            </Tabs.Panel>

            <Tabs.Panel value="departures">
              <CheckInList 
                data={initialDepartures} 
                type="check-out" 
                onAction={openCheckOut} 
              />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>

      {/* --- MODALS --- */}
      <Modal opened={checkInModalOpened} onClose={closeModals} title="Confirm Check-in" centered radius="md">
        <Stack gap="md">
          <Text size="sm">Process check-in for this guest?</Text>
          {selectedReservation && (
            <Paper withBorder p="sm" radius="md" bg="gray.0">
              <Group>
                <Avatar color="teal" radius="xl"><IconUser size={20}/></Avatar>
                <div>
                  <Text fw={600} size="sm">{selectedReservation.guest?.full_name}</Text>
                  <Text c="dimmed" size="xs">Room {selectedReservation.room?.room_number} ({selectedReservation.room?.room_type?.name})</Text>
                </div>
              </Group>
            </Paper>
          )}
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={closeModals}>Cancel</Button>
            <Button color="teal" onClick={handleConfirmCheckIn} loading={isSubmitting}>Check In</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={checkOutModalOpened} onClose={closeModals} title="Confirm Check-out" centered radius="md">
        <Stack gap="md">
          <Text size="sm">Process check-out for this guest?</Text>
          <Text size="xs" c="dimmed">Room status will be changed to <strong>Dirty</strong>.</Text>
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={closeModals}>Cancel</Button>
            <Button color="orange" onClick={handleConfirmCheckOut} loading={isSubmitting}>Check Out</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}