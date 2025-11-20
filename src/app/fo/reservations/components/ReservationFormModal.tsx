'use client';

import { useEffect, useMemo } from 'react';
import { Modal, Button, Select, NumberInput, Stack, Group, Grid, Divider, Text, Paper } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { upsertReservation } from '../actions'; // Pastikan actions.ts sudah dibuat
import { ReservationDetails, GuestOption, RoomWithDetails } from '../page';
import { PaymentStatus } from '@/core/types/database';

interface Props {
  opened: boolean;
  close: () => void;
  hotelId: string;
  rooms: RoomWithDetails[];
  guests: GuestOption[];
  selectedData?: ReservationDetails | null;
}

export function ReservationFormModal({ opened, close, hotelId, rooms, guests, selectedData }: Props) {
  const form = useForm({
    initialValues: {
      id: '',
      guest_id: '',
      room_id: '',
      // Kita gunakan array date_range agar kompatibel dengan DatePickerInput type="range"
      date_range: [null, null] as [Date | null, Date | null],
      total_price: 0,
      payment_status: 'pending' as PaymentStatus,
    },
    validate: {
      guest_id: (val) => (val ? null : 'Pilih tamu'),
      room_id: (val) => (val ? null : 'Pilih kamar'),
      date_range: (val) => (val[0] && val[1] ? null : 'Pilih tanggal check-in & check-out'),
    },
  });

  // Reset form & Konversi Tanggal saat modal dibuka
  useEffect(() => {
    if (opened) {
      if (selectedData) {
        form.setValues({
          id: selectedData.id,
          guest_id: selectedData.guest_id,
          room_id: selectedData.room_id,
          // [CRITICAL FIX]: Konversi String dari DB ke Date Object
          date_range: [
            new Date(selectedData.check_in_date),
            new Date(selectedData.check_out_date),
          ],
          total_price: selectedData.total_price,
          payment_status: selectedData.payment_status as PaymentStatus,
        });
      } else {
        form.reset();
        form.setFieldValue('id', '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedData, opened]);

  // Kalkulasi harga otomatis (Hanya berjalan jika tanggal valid Date object)
  useEffect(() => {
    if (form.values.room_id && form.values.date_range[0] && form.values.date_range[1]) {
      const room = rooms.find((r) => r.id === form.values.room_id) || (selectedData?.room_id === form.values.room_id ? selectedData?.room : null);
      // @ts-ignore
      const pricePerNight = room?.room_type?.price_per_night || 0;
      
      if (pricePerNight > 0) {
        const checkIn = form.values.date_range[0]!;
        const checkOut = form.values.date_range[1]!;
        
        // Pastikan checkIn dan checkOut adalah instance Date sebelum .getTime()
        if (checkIn instanceof Date && checkOut instanceof Date) {
          const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          form.setFieldValue('total_price', pricePerNight * (diffDays || 1));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.room_id, form.values.date_range]);


  const handleSubmit = async (values: typeof form.values) => {
    const formData = new FormData();
    if (values.id) formData.append('id', values.id);
    
    formData.append('hotel_id', hotelId);
    formData.append('guest_id', values.guest_id);
    formData.append('room_id', values.room_id);
    
    // Konversi Date Object kembali ke String ISO untuk dikirim ke Server Action
    formData.append('check_in_date', values.date_range[0]!.toISOString().split('T')[0]); 
    formData.append('check_out_date', values.date_range[1]!.toISOString().split('T')[0]);
    
    formData.append('total_price', values.total_price.toString());
    formData.append('payment_status', values.payment_status);

    const res = await upsertReservation(null, formData);
    
    if (res?.error) {
      notifications.show({ title: 'Gagal', message: res.error, color: 'red' });
    } else {
      notifications.show({ title: 'Berhasil', message: 'Data reservasi tersimpan', color: 'green' });
      close();
    }
  };

  const guestOptions = useMemo(() => guests.map(g => ({ 
    value: g.id, 
    label: `${g.full_name} (${g.email})` 
  })), [guests]);

  const roomOptions = useMemo(() => rooms.map(r => ({ 
    value: r.id, 
    label: `No. ${r.room_number} (${r.room_type?.name}) - Rp ${r.room_type?.price_per_night.toLocaleString('id-ID')}` 
  })), [rooms]);

  return (
    <Modal 
      opened={opened} 
      onClose={close} 
      title={selectedData ? "Edit Reservasi" : "Buat Reservasi Baru"} 
      centered
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            label="Tamu"
            placeholder="Cari & Pilih Tamu"
            data={guestOptions}
            searchable
            nothingFoundMessage="Tamu tidak ditemukan"
            {...form.getInputProps('guest_id')}
          />

          <Select
            label="Kamar"
            placeholder="Pilih Kamar Tersedia"
            data={roomOptions}
            searchable
            {...form.getInputProps('room_id')}
          />

          <DatePickerInput
            type="range"
            label="Tanggal Menginap"
            placeholder="Check-in — Check-out"
            minDate={new Date()}
            allowSingleDateInRange={false}
            {...form.getInputProps('date_range')}
          />

          <Divider label="Detail Pembayaran" labelPosition="center" />

          <Select
            label="Status Pembayaran"
            data={[
              { value: 'pending', label: 'Pending' },
              { value: 'paid', label: 'Paid' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            {...form.getInputProps('payment_status')}
          />

          <Paper withBorder p="sm" bg="gray.0">
            <Group justify="space-between">
                <Text size="sm" fw={500}>Total Biaya</Text>
                <NumberInput
                    prefix="Rp "
                    thousandSeparator="."
                    decimalSeparator=","
                    variant="unstyled"
                    size="lg"
                    fw={700}
                    styles={{ input: { textAlign: 'right', color: 'var(--mantine-color-teal-7)' } }}
                    {...form.getInputProps('total_price')}
                />
            </Group>
          </Paper>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Batal</Button>
            <Button type="submit" color="teal">Simpan Reservasi</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}