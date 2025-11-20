'use client';

import { useEffect, useState, useMemo } from 'react';
import { Modal, Stack, TextInput, Button, Group, Select, NumberInput, Paper, Text as MantineText } from '@mantine/core'; // FIX: Alias Text
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconUser, IconMail, IconPhone, IconBed, IconCalendar, IconCash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { PaymentStatus } from '@/core/types/database';
import { ReservationDetails, GuestOption, RoomWithDetails } from '../page';
import { createReservation, updateReservation, createGuestForReservation } from '../actions';

interface Props {
  opened: boolean;
  onClose: () => void;
  hotelId: string;
  reservationToEdit: ReservationDetails | null;
  guests: GuestOption[];
  availableRooms: RoomWithDetails[];
}

export function ReservationFormModal({ opened, onClose, hotelId, reservationToEdit, guests, availableRooms }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestSelectionMode, setGuestSelectionMode] = useState<'select' | 'new'>('select');
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [guestList, setGuestList] = useState<GuestOption[]>(guests);

  // Update guest list ketika props berubah
  useEffect(() => {
    setGuestList(guests);
  }, [guests]);

  const form = useForm({
    initialValues: {
      guest_id: '',
      new_guest_name: '',
      new_guest_email: '',
      new_guest_phone: '',
      room_id: '',
      check_in_date: null as Date | null,
      check_out_date: null as Date | null,
      total_price: 0,
      payment_status: 'pending' as PaymentStatus,
    },
    validate: {
      guest_id: (value) => (guestSelectionMode === 'select' && !value ? 'Pilih tamu' : null),
      new_guest_name: (value) => (guestSelectionMode === 'new' && !value ? 'Nama wajib diisi' : null),
      new_guest_email: (value) => (guestSelectionMode === 'new' && (!value || !/^\S+@\S+\.\S+$/.test(value)) ? 'Email tidak valid' : null),
      room_id: (value) => (!value ? 'Pilih kamar' : null),
      check_in_date: (value) => (!value ? 'Wajib diisi' : null),
      check_out_date: (value, values) => {
        if (!value) return 'Wajib diisi';
        if (values.check_in_date && value <= values.check_in_date) return 'Harus setelah check-in';
        return null;
      },
    },
  });

  // Reset Form & State saat Modal Dibuka
  useEffect(() => {
    if (opened) {
      if (reservationToEdit) {
        setGuestSelectionMode('select');
        form.setValues({
          guest_id: reservationToEdit.guest_id,
          room_id: reservationToEdit.room_id,
          check_in_date: new Date(reservationToEdit.check_in_date),
          check_out_date: new Date(reservationToEdit.check_out_date),
          total_price: reservationToEdit.total_price,
          payment_status: reservationToEdit.payment_status,
          new_guest_name: '',
          new_guest_email: '',
          new_guest_phone: '',
        });
        setCalculatedPrice(reservationToEdit.total_price);
      } else {
        form.reset();
        setGuestSelectionMode('select');
        setCalculatedPrice(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, reservationToEdit]);

  // Kalkulasi Harga Otomatis (Safe Date Check)
  useEffect(() => {
    const { check_in_date, check_out_date, room_id } = form.values;
    
    let pricePerNight = 0;
    const roomFromList = availableRooms.find(r => r.id === room_id);
    
    if (roomFromList?.room_type) {
      pricePerNight = roomFromList.room_type.price_per_night;
    } else if (reservationToEdit && reservationToEdit.room_id === room_id && reservationToEdit.room?.room_type) {
      pricePerNight = reservationToEdit.room.room_type.price_per_night;
    }

    // Pastikan checkIn dan checkOut adalah Date object yang valid
    const checkIn = check_in_date instanceof Date ? check_in_date : null;
    const checkOut = check_out_date instanceof Date ? check_out_date : null;

    if (
      checkIn && 
      checkOut && 
      !isNaN(checkIn.getTime()) && 
      !isNaN(checkOut.getTime()) && 
      checkOut.getTime() > checkIn.getTime() && 
      pricePerNight > 0
    ) {
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
      const price = nights * pricePerNight;
      setCalculatedPrice(price);
      form.setFieldValue('total_price', price);
    } else {
      setCalculatedPrice(null);
    }
  }, [form.values.check_in_date, form.values.check_out_date, form.values.room_id, availableRooms, reservationToEdit]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      let finalGuestId = values.guest_id;

      if (guestSelectionMode === 'new') {
        const guestResult = await createGuestForReservation({
          hotel_id: hotelId,
          full_name: values.new_guest_name,
          email: values.new_guest_email,
          phone_number: values.new_guest_phone || undefined,
        });

        if (guestResult.error || !guestResult.guestId) {
          notifications.show({ title: 'Gagal Buat Tamu', message: guestResult.error, color: 'red' });
          setIsSubmitting(false);
          return;
        }
        finalGuestId = guestResult.guestId;
      }

      const reservationData = {
        hotel_id: hotelId,
        guest_id: finalGuestId,
        room_id: values.room_id,
        check_in_date: values.check_in_date!,
        check_out_date: values.check_out_date!,
        total_price: calculatedPrice || 0,
        payment_status: values.payment_status,
      };

      let result;
      if (reservationToEdit) {
        result = await updateReservation(reservationToEdit.id, reservationData);
      } else {
        result = await createReservation(reservationData);
      }

      if (result.error) {
        notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
      } else {
        notifications.show({ title: 'Sukses', message: 'Data berhasil disimpan', color: 'green' });
        onClose();
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Terjadi kesalahan sistem', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const guestOptions = useMemo(() => guestList.map(g => ({ value: g.id, label: `${g.full_name} (${g.email})` })), [guestList]);
  
  const roomOptions = useMemo(() => {
    const options = availableRooms.map(r => ({
      value: r.id,
      label: `No. ${r.room_number} - ${r.room_type?.name} (Rp ${r.room_type?.price_per_night.toLocaleString()})`
    }));
    
    if (reservationToEdit && !options.find(o => o.value === reservationToEdit.room_id)) {
       options.unshift({
         value: reservationToEdit.room_id,
         label: `No. ${reservationToEdit.room?.room_number} (Kamar Saat Ini)`
       });
    }
    return options;
  }, [availableRooms, reservationToEdit]);

  return (
    <Modal opened={opened} onClose={onClose} title={reservationToEdit ? 'Edit Reservasi' : 'Reservasi Baru (Front Office)'} centered size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Group grow>
            <Button variant={guestSelectionMode === 'select' ? 'filled' : 'outline'} onClick={() => setGuestSelectionMode('select')} color="teal">Pilih Tamu</Button>
            <Button variant={guestSelectionMode === 'new' ? 'filled' : 'outline'} onClick={() => setGuestSelectionMode('new')} color="teal">Tamu Baru</Button>
          </Group>

          {guestSelectionMode === 'select' ? (
            <Select label="Cari Tamu" placeholder="Pilih tamu..." data={guestOptions} searchable {...form.getInputProps('guest_id')} />
          ) : (
            <>
              <TextInput label="Nama Lengkap" placeholder="Nama tamu" required leftSection={<IconUser size={18} />} {...form.getInputProps('new_guest_name')} />
              <TextInput label="Email" placeholder="email@tamu.com" required leftSection={<IconMail size={18} />} {...form.getInputProps('new_guest_email')} />
              <TextInput label="No. HP" placeholder="Opsional" leftSection={<IconPhone size={18} />} {...form.getInputProps('new_guest_phone')} />
            </>
          )}

          <Select label="Pilih Kamar" placeholder="Kamar tersedia" data={roomOptions} searchable required leftSection={<IconBed size={18} />} {...form.getInputProps('room_id')} />
          
          <Group grow>
            <DatePickerInput label="Check-in" placeholder="Tanggal Check-in" minDate={new Date()} leftSection={<IconCalendar size={18} />} {...form.getInputProps('check_in_date')} />
            <DatePickerInput label="Check-out" placeholder="Tanggal Check-out" minDate={form.values.check_in_date || new Date()} leftSection={<IconCalendar size={18} />} {...form.getInputProps('check_out_date')} />
          </Group>

          <Paper withBorder p="xs" bg="gray.0">
            <Group justify="space-between">
              <MantineText size="sm" fw={500}>Total Harga:</MantineText>
              <MantineText size="lg" fw={700} c="teal">{calculatedPrice ? `Rp ${calculatedPrice.toLocaleString('id-ID')}` : '-'}</MantineText>
            </Group>
          </Paper>

          <Select label="Status Pembayaran" data={['pending', 'paid', 'cancelled']} required leftSection={<IconCash size={18} />} {...form.getInputProps('payment_status')} />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" color="teal" loading={isSubmitting} disabled={!calculatedPrice && !reservationToEdit}>Simpan</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}