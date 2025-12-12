'use client';

import { useState, useEffect } from 'react';
import {
  Stack, Paper, Group, Text, TextInput, Select, Button, ThemeIcon, Divider
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconUser, IconPhone, IconMail, IconBed, IconCalendarEvent, IconCheck, IconCreditCard } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { GuestOption, RoomWithDetails, ReservationDetails } from '../page';
import { createReservation, createGuestForReservation } from '../actions';
import { PaymentMethod } from '@/core/types/database';

interface QuickBookingPanelProps {
  hotelId: string;
  guests: GuestOption[];
  rooms: RoomWithDetails[];
  prefilledData?: { room_id?: string; check_in_date?: Date; check_out_date?: Date; } | null;
  onSuccess: (reservation: ReservationDetails) => void;
}

export function QuickBookingPanel({ hotelId, guests, rooms, prefilledData, onSuccess }: QuickBookingPanelProps) {
  const [guestMode, setGuestMode] = useState<'existing' | 'new'>('existing');
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);
  const [guestTitle, setGuestTitle] = useState<string | null>('Mr.');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const start = checkInDate ? new Date(checkInDate) : null;
    const end = checkOutDate ? new Date(checkOutDate) : null;

    if (
      start && end && selectedRoom && 
      !isNaN(start.getTime()) && !isNaN(end.getTime()) && 
      end.getTime() > start.getTime()
    ) {
      const room = rooms.find(r => r.id === selectedRoom);
      if (room?.room_type) {
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        const price = nights * room.room_type.price_per_night;
        setCalculatedPrice(price);
      }
    } else {
      setCalculatedPrice(null);
    }
  }, [checkInDate, checkOutDate, selectedRoom, rooms]);


  const handleQuickBook = async () => {
    if (!checkInDate || !checkOutDate || !selectedRoom) {
      notifications.show({ title: 'Data Kurang', message: 'Lengkapi tanggal dan kamar', color: 'red' });
      return;
    }
    if (guestMode === 'existing' && !selectedGuest) {
      notifications.show({ title: 'Pilih Tamu', message: 'Pilih tamu yang sudah ada', color: 'red' });
      return;
    }
    if (guestMode === 'new' && (!guestName || !guestEmail)) {
      notifications.show({ title: 'Data Tamu Kurang', message: 'Lengkapi nama dan email tamu', color: 'red' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let finalGuestId = selectedGuest;

      if (guestMode === 'new') {
        const guestResult = await createGuestForReservation({
          hotel_id: hotelId,
          title: guestTitle || 'Mr.',
          full_name: guestName,
          email: guestEmail,
          phone_number: guestPhone || undefined,
        });

        if (guestResult.error || !guestResult.guestId) {
          notifications.show({ title: 'Gagal Buat Tamu', message: guestResult.error, color: 'red' });
          setIsSubmitting(false); 
          return;
        }
        finalGuestId = guestResult.guestId;
      }

      const result = await createReservation({
        hotel_id: hotelId,
        guest_id: finalGuestId!,
        room_id: selectedRoom,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        total_price: calculatedPrice || 0,
        payment_status: 'pending', 
        payment_method: (paymentMethod as PaymentMethod) || null, 
      });

      if (result.error) {
        notifications.show({ title: 'Gagal Membuat Reservasi', message: result.error, color: 'red' });
      } else if (result.data) { 
        notifications.show({ title: 'Berhasil', message: 'Booking telah dibuat', color: 'green', icon: <IconCheck size={16} /> });
        
        // Reset Form
        setGuestMode('existing'); setSelectedGuest(null); 
        setGuestName(''); setGuestPhone(''); setGuestEmail('');
        setCheckInDate(null); setCheckOutDate(null); setSelectedRoom(null); 
        setCalculatedPrice(null); setPaymentMethod(null);

        // Panggil onSuccess
        onSuccess(result.data as ReservationDetails);
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Terjadi kesalahan sistem', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableRooms = rooms.filter(r => r.status === 'available');
  const guestOptions = guests.map(g => ({ value: g.id, label: `${g.full_name} (${g.email})` }));

  return (
    <Stack gap="md">
      <Paper p="md" radius="md" withBorder style={{ background: 'white' }}>
        <Group gap="xs" mb="md">
          <ThemeIcon color="teal" variant="light" size="lg"><IconUser size={18} /></ThemeIcon>
          <Text fw={600} size="sm">Guest Folio</Text>
        </Group>
        
        <Stack gap="sm">
          <Group grow mb="xs">
            <Button 
              onClick={() => setGuestMode('existing')} 
              variant={guestMode === 'existing' ? 'gradient' : 'default'}
              gradient={{ from: '#14b8a6', to: '#0891b2', deg: 135 }}
              size="xs"
            >
              Existing Guest
            </Button>
            <Button 
              onClick={() => setGuestMode('new')} 
              variant={guestMode === 'new' ? 'gradient' : 'default'}
              gradient={{ from: '#14b8a6', to: '#0891b2', deg: 135 }}
              size="xs"
            >
              New Guest
            </Button>
          </Group>

          {guestMode === 'existing' ? (
            <Select 
              label="Select Guest" 
              placeholder="Search Guest..." 
              data={guestOptions} 
              value={selectedGuest} 
              onChange={setSelectedGuest} 
              searchable 
              leftSection={<IconUser size={16} />} 
            />
          ) : (
            <>
              <Select 
                label="Title" 
                data={['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']} 
                value={guestTitle} 
                onChange={setGuestTitle} 
              />
              <TextInput 
                label="Full Name" 
                placeholder="Guest Name" 
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
                label="Phone Number" 
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
          <ThemeIcon color="indigo" variant="light" size="lg"><IconCalendarEvent size={18} /></ThemeIcon>
          <Text fw={600} size="sm">Reservation Detail</Text>
        </Group>
        
        <Stack gap="sm">
          <DatePickerInput 
            label="Check-in" 
            placeholder="Select date" 
            value={checkInDate} 
            onChange={(date) => setCheckInDate(date as Date | null)} 
            minDate={new Date()} 
            required 
          />
          <DatePickerInput 
            label="Check-out" 
            placeholder="Select date" 
            value={checkOutDate} 
            onChange={(date) => setCheckOutDate(date as Date | null)} 
            minDate={checkInDate || new Date()} 
            required 
          />
          <Select 
            label="Select Room" 
            placeholder="Room available..." 
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
          
          <Divider my="xs" />

          <Select
            label="Payment Method (Optional)"
            placeholder="Select Method"
            data={[
                { value: 'cash', label: 'Cash' },
                { value: 'transfer', label: 'Bank Transfer' },
                { value: 'qris', label: 'QRIS' },
                { value: 'credit_card', label: 'Credit Card' },
                { value: 'other', label: 'Other' },
            ]}
            value={paymentMethod}
            onChange={setPaymentMethod}
            clearable
            leftSection={<IconCreditCard size={16} />}
          />
          
          {calculatedPrice && (
            <Paper p="sm" bg="teal.0" radius="md" withBorder mt="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Total:</Text>
                <Text size="xl" fw={700} c="teal.9">Rp {calculatedPrice.toLocaleString('id-ID')}</Text>
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
        variant="gradient" 
        gradient={{ from: '#14b8a6', to: '#0891b2', deg: 135 }}
      >
        Make Reservation
      </Button>
    </Stack>
  );
}