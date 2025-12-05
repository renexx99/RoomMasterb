// src/app/fo/reservations/components/QuickBookingPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Stack, Paper, Group, Text, TextInput, Select, Button, ThemeIcon, Divider
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconUser, IconPhone, IconMail, IconBed, IconCalendarEvent, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { GuestOption, RoomWithDetails } from '../page';
import { createReservation, createGuestForReservation } from '../actions';

interface QuickBookingPanelProps {
  hotelId: string;
  guests: GuestOption[];
  rooms: RoomWithDetails[];
  prefilledData?: {
    room_id?: string;
    check_in_date?: Date;
    check_out_date?: Date;
  } | null;
  onSuccess: () => void;
}

export function QuickBookingPanel({ 
  hotelId, 
  guests, 
  rooms, 
  prefilledData,
  onSuccess 
}: QuickBookingPanelProps) {
  const [guestMode, setGuestMode] = useState<'existing' | 'new'>('existing');
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);
  const [guestTitle, setGuestTitle] = useState<string | null>('Mr.');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  // Apply prefilled data
  useEffect(() => {
    if (prefilledData) {
      setSelectedRoom(prefilledData.room_id || null);
      setCheckInDate(prefilledData.check_in_date || null);
      setCheckOutDate(prefilledData.check_out_date || null);
    }
  }, [prefilledData]);

  // Calculate price
  useEffect(() => {
    if (checkInDate && checkOutDate && selectedRoom && checkOutDate > checkInDate) {
      const room = rooms.find(r => r.id === selectedRoom);
      if (room?.room_type) {
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
        const price = nights * room.room_type.price_per_night;
        setCalculatedPrice(price);
      }
    } else {
      setCalculatedPrice(null);
    }
  }, [checkInDate, checkOutDate, selectedRoom, rooms]);

  const handleQuickBook = async () => {
    if (!checkInDate || !checkOutDate || !selectedRoom) {
      notifications.show({
        title: 'Form Tidak Lengkap',
        message: 'Mohon lengkapi tanggal dan kamar',
        color: 'red'
      });
      return;
    }

    if (guestMode === 'existing' && !selectedGuest) {
      notifications.show({
        title: 'Pilih Tamu',
        message: 'Mohon pilih tamu yang sudah ada',
        color: 'red'
      });
      return;
    }

    if (guestMode === 'new' && (!guestName || !guestEmail)) {
      notifications.show({
        title: 'Data Tamu Tidak Lengkap',
        message: 'Mohon lengkapi nama dan email tamu',
        color: 'red'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let finalGuestId = selectedGuest;

      // Create new guest if needed
      if (guestMode === 'new') {
        const guestResult = await createGuestForReservation({
          hotel_id: hotelId,
          title: guestTitle || 'Mr.',
          full_name: guestName,
          email: guestEmail,
          phone_number: guestPhone || undefined,
        });

        if (guestResult.error || !guestResult.guestId) {
          notifications.show({ 
            title: 'Gagal Buat Tamu', 
            message: guestResult.error, 
            color: 'red' 
          });
          return;
        }
        finalGuestId = guestResult.guestId;
      }

      // Create reservation
      const result = await createReservation({
        hotel_id: hotelId,
        guest_id: finalGuestId!,
        room_id: selectedRoom,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        total_price: calculatedPrice || 0,
        payment_status: 'pending',
      });

      if (result.error) {
        notifications.show({
          title: 'Gagal Membuat Reservasi',
          message: result.error,
          color: 'red'
        });
      } else {
        notifications.show({
          title: 'Reservasi Berhasil',
          message: `Booking untuk ${guestMode === 'new' ? guestName : guests.find(g => g.id === selectedGuest)?.full_name} telah dibuat`,
          color: 'teal',
          icon: <IconCheck size={16} />
        });
        
        // Reset form
        setGuestMode('existing');
        setSelectedGuest(null);
        setGuestName('');
        setGuestPhone('');
        setGuestEmail('');
        setGuestTitle('Mr.');
        setCheckInDate(null);
        setCheckOutDate(null);
        setSelectedRoom(null);
        setCalculatedPrice(null);
        
        onSuccess();
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Terjadi kesalahan sistem',
        color: 'red'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableRooms = rooms.filter(r => r.status === 'available');
  const guestOptions = guests.map(g => ({ 
    value: g.id, 
    label: `${g.full_name} (${g.email})` 
  }));

  return (
    <Stack gap="md">
      <Paper p="md" radius="md" withBorder style={{ background: 'white' }}>
        <Group gap="xs" mb="md">
          <ThemeIcon color="teal" variant="light" size="lg">
            <IconUser size={18} />
          </ThemeIcon>
          <Text fw={600} size="sm">Informasi Tamu</Text>
        </Group>
        
        <Stack gap="sm">
          <Group grow mb="xs">
            <Button 
              variant={guestMode === 'existing' ? 'filled' : 'default'} 
              onClick={() => setGuestMode('existing')} 
              color="teal" 
              size="xs"
            >
              Tamu Lama
            </Button>
            <Button 
              variant={guestMode === 'new' ? 'filled' : 'default'} 
              onClick={() => setGuestMode('new')} 
              color="teal" 
              size="xs"
            >
              Tamu Baru
            </Button>
          </Group>

          {guestMode === 'existing' ? (
            <Select
              label="Pilih Tamu"
              placeholder="Cari tamu..."
              data={guestOptions}
              value={selectedGuest}
              onChange={setSelectedGuest}
              searchable
              nothingFoundMessage="Tamu tidak ditemukan"
              leftSection={<IconUser size={16} />}
            />
          ) : (
            <>
              <Select
                label="Title"
                placeholder="Pilih title"
                data={[
                  { value: 'Mr.', label: 'Mr.' },
                  { value: 'Mrs.', label: 'Mrs.' },
                  { value: 'Ms.', label: 'Ms.' },
                  { value: 'Dr.', label: 'Dr.' },
                  { value: 'Prof.', label: 'Prof.' },
                  { value: 'Other', label: 'Other' }
                ]}
                value={guestTitle}
                onChange={setGuestTitle}
              />
              <TextInput
                label="Nama Lengkap"
                placeholder="Nama tamu"
                value={guestName}
                onChange={(e) => setGuestName(e.currentTarget.value)}
                leftSection={<IconUser size={16} />}
                required
              />
              <TextInput
                label="Email"
                placeholder="email@example.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.currentTarget.value)}
                leftSection={<IconMail size={16} />}
                required
              />
              <TextInput
                label="Telepon"
                placeholder="+62 xxx"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.currentTarget.value)}
                leftSection={<IconPhone size={16} />}
              />
            </>
          )}
        </Stack>
      </Paper>

      <Paper p="md" radius="md" withBorder style={{ background: 'white' }}>
        <Group gap="xs" mb="md">
          <ThemeIcon color="cyan" variant="light" size="lg">
            <IconCalendarEvent size={18} />
          </ThemeIcon>
          <Text fw={600} size="sm">Tanggal & Kamar</Text>
        </Group>
        
        <Stack gap="sm">
          <DatePickerInput
            label="Check-in"
            placeholder="Pilih tanggal"
            value={checkInDate}
            onChange={setCheckInDate}
            minDate={new Date()}
            required
          />
          <DatePickerInput
            label="Check-out"
            placeholder="Pilih tanggal"
            value={checkOutDate}
            onChange={setCheckOutDate}
            minDate={checkInDate || new Date()}
            required
          />
          <Select
            label="Pilih Kamar"
            placeholder="Kamar tersedia"
            data={availableRooms.map(r => ({
              value: r.id,
              label: `${r.room_number} - ${r.room_type?.name} (Rp ${r.room_type?.price_per_night.toLocaleString('id-ID')})`
            }))}
            value={selectedRoom}
            onChange={setSelectedRoom}
            leftSection={<IconBed size={16} />}
            searchable
            required
          />
          
          {calculatedPrice && (
            <Paper p="sm" bg="teal.0" radius="md" withBorder>
              <Group justify="space-between">
                <Text size="sm" fw={500}>Total:</Text>
                <Text size="xl" fw={700} c="teal.9">
                  Rp {calculatedPrice.toLocaleString('id-ID')}
                </Text>
              </Group>
            </Paper>
          )}
        </Stack>
      </Paper>

      <Button 
        fullWidth 
        size="md" 
        leftSection={<IconCheck size={18} />}
        onClick={handleQuickBook}
        loading={isSubmitting}
        disabled={!calculatedPrice}
        gradient={{ from: 'teal', to: 'cyan', deg: 90 }}
        variant="gradient"
      >
        Buat Reservasi
      </Button>
    </Stack>
  );
}