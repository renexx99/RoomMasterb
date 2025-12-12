'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Modal, Stack, TextInput, Button, Group, Select, Paper, Text, Divider, 
  Grid, Badge, ThemeIcon, Box 
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { 
  IconUser, IconMail, IconPhone, IconBed, IconCalendar, IconCash, 
  IconMaximize, IconArmchair, IconEye, IconBuildingSkyscraper, IconAirConditioning 
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { PaymentStatus } from '@/core/types/database';
import { ReservationDetails, GuestOption, RoomWithDetails } from '../page';
import { createReservation, updateReservation, createGuestForReservation } from '../actions';

interface Props {
  opened: boolean;
  onClose: () => void;
  hotelId: string;
  reservationToEdit: ReservationDetails | null;
  prefilledData?: { room_id?: string; check_in_date?: Date; check_out_date?: Date; } | null;
  guests: GuestOption[];
  availableRooms: RoomWithDetails[];
}

export function ReservationFormModal({ 
  opened, onClose, hotelId, reservationToEdit, prefilledData, guests, availableRooms 
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestSelectionMode, setGuestSelectionMode] = useState<'select' | 'new'>('select');
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [guestList, setGuestList] = useState<GuestOption[]>(guests);

  useEffect(() => { setGuestList(guests); }, [guests]);

  const form = useForm({
    initialValues: {
      guest_id: '',
      new_guest_title: 'Mr.' as string,
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
      new_guest_email: (value) => (guestSelectionMode === 'new' && !value ? 'Email wajib diisi' : null),
      room_id: (value) => (!value ? 'Pilih kamar' : null),
      check_in_date: (value) => (!value ? 'Wajib diisi' : null),
      check_out_date: (value, values) => {
        if (!value) return 'Wajib diisi';
        if (values.check_in_date && value <= values.check_in_date) return 'Harus setelah check-in';
        return null;
      },
    },
  });

  // --- LOGIC: Selected Room Details ---
  const selectedRoomDetail = useMemo(() => {
    if (!form.values.room_id) return null;
    return availableRooms.find(r => r.id === form.values.room_id);
  }, [form.values.room_id, availableRooms]);

  // --- LOGIC: Reset Form ---
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
          new_guest_title: 'Mr.', new_guest_name: '', new_guest_email: '', new_guest_phone: '',
        });
        setCalculatedPrice(reservationToEdit.total_price);
      } else if (prefilledData) {
        form.reset();
        form.setValues({
          room_id: prefilledData.room_id || '',
          check_in_date: prefilledData.check_in_date || null,
          check_out_date: prefilledData.check_out_date || null,
          total_price: 0,
          payment_status: 'pending',
          guest_id: '', new_guest_title: 'Mr.', new_guest_name: '', new_guest_email: '', new_guest_phone: '',
        });
        setGuestSelectionMode('select');
        setCalculatedPrice(null);
      } else {
        form.reset();
        setGuestSelectionMode('select');
        setCalculatedPrice(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, reservationToEdit, prefilledData]);

  // --- LOGIC: Calculate Price ---
  useEffect(() => {
    const { check_in_date, check_out_date, room_id } = form.values;
    let pricePerNight = 0;
    
    // Prioritize detail from selected room list
    if (selectedRoomDetail?.room_type) {
      pricePerNight = selectedRoomDetail.room_type.price_per_night;
    } else if (reservationToEdit && reservationToEdit.room_id === room_id && reservationToEdit.room?.room_type) {
      // Fallback for existing reservation (if room not in available list)
      pricePerNight = reservationToEdit.room.room_type.price_per_night;
    }

    const checkIn = check_in_date ? new Date(check_in_date) : null;
    const checkOut = check_out_date ? new Date(check_out_date) : null;

    if (checkIn && checkOut && !isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime()) && checkOut > checkIn && pricePerNight > 0) {
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
      const price = nights * pricePerNight;
      setCalculatedPrice(price);
      form.setFieldValue('total_price', price);
    } else {
      setCalculatedPrice(null);
    }
  }, [form.values.check_in_date, form.values.check_out_date, form.values.room_id, selectedRoomDetail, reservationToEdit]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      let finalGuestId = values.guest_id;

      if (guestSelectionMode === 'new') {
        const guestResult = await createGuestForReservation({
          hotel_id: hotelId,
          title: values.new_guest_title,
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
        notifications.show({ title: 'Sukses', message: 'Reservasi berhasil disimpan', color: 'green' });
        onClose();
        window.location.reload(); 
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Terjadi kesalahan sistem', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const guestOptions = useMemo(() => guestList.map(g => ({ 
    value: g.id, 
    label: `${g.full_name} (${g.email})` 
  })), [guestList]);
  
  const roomOptions = useMemo(() => {
    const options = availableRooms.map(r => ({
      value: r.id,
      label: `No. ${r.room_number} - ${r.room_type?.name} (Rp ${r.room_type?.price_per_night.toLocaleString('id-ID')})`
    }));
    
    // Add currently selected room if editing and it's not in the available list (e.g. it's occupied by this reservation)
    if (reservationToEdit && !options.find(o => o.value === reservationToEdit.room_id)) {
       options.unshift({
         value: reservationToEdit.room_id,
         label: `No. ${reservationToEdit.room?.room_number} (Kamar Saat Ini)`
       });
    }
    return options;
  }, [availableRooms, reservationToEdit]);

  // Helper to safely parse amenities
  const getAmenities = (room: RoomWithDetails) => {
    const am = room.room_type?.amenities;
    if (Array.isArray(am)) return am;
    if (typeof am === 'string') {
        try { return JSON.parse(am); } catch { return []; }
    }
    return [];
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={reservationToEdit ? 'Edit Reservasi' : 'Buat Reservasi Baru'} 
      centered 
      size="lg" 
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* --- SECTION 1: GUEST --- */}
          <Divider label="Data Tamu" labelPosition="center" />
          <Group grow>
            <Button 
              onClick={() => setGuestSelectionMode('select')} 
              variant={guestSelectionMode === 'select' ? 'gradient' : 'default'}
              gradient={{ from: '#3b82f6', to: '#2563eb', deg: 135 }}
              size="xs"
            >
              Pilih Tamu Lama
            </Button>
            <Button 
              onClick={() => setGuestSelectionMode('new')} 
              variant={guestSelectionMode === 'new' ? 'gradient' : 'default'}
              gradient={{ from: '#3b82f6', to: '#2563eb', deg: 135 }}
              size="xs"
            >
              Input Tamu Baru
            </Button>
          </Group>

          {guestSelectionMode === 'select' ? (
            <Select 
              label="Cari Tamu" 
              placeholder="Ketik nama..." 
              data={guestOptions} 
              searchable 
              nothingFoundMessage="Tamu tidak ditemukan" 
              {...form.getInputProps('guest_id')} 
            />
          ) : (
            <Stack gap="xs">
              <Group grow>
                <Select
                  label="Title"
                  placeholder="Pilih"
                  data={['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']}
                  style={{ maxWidth: 80 }}
                  required
                  {...form.getInputProps('new_guest_title')}
                />
                <TextInput 
                  label="Nama Lengkap" 
                  placeholder="Nama tamu" 
                  required 
                  leftSection={<IconUser size={16} />} 
                  {...form.getInputProps('new_guest_name')} 
                />
              </Group>
              <TextInput 
                label="Email" 
                placeholder="email@tamu.com" 
                required 
                leftSection={<IconMail size={16} />} 
                {...form.getInputProps('new_guest_email')} 
              />
              <TextInput 
                label="No. HP" 
                placeholder="0812..." 
                leftSection={<IconPhone size={16} />} 
                {...form.getInputProps('new_guest_phone')} 
              />
            </Stack>
          )}

          {/* --- SECTION 2: ROOM & DATES --- */}
          <Divider label="Detail Kamar & Waktu" labelPosition="center" mt="xs" />
          
          <Select 
            label="Pilih Kamar" 
            placeholder="Cari nomor kamar..." 
            data={roomOptions} 
            searchable 
            required 
            leftSection={<IconBed size={16} />} 
            {...form.getInputProps('room_id')} 
          />

          {/* --- NEW: ROOM DETAILS CARD --- */}
          {selectedRoomDetail && selectedRoomDetail.room_type && (
            <Paper p="sm" bg="blue.0" radius="md" withBorder style={{ borderColor: 'var(--mantine-color-blue-2)' }}>
                <Group justify="space-between" mb={4}>
                    <Text size="sm" fw={700} c="blue.9">
                        Detail Kamar {selectedRoomDetail.room_number}
                    </Text>
                    <Badge size="xs" variant="white" color="blue">
                        {selectedRoomDetail.room_type.name}
                    </Badge>
                </Group>
                
                <Grid gutter="xs">
                    <Grid.Col span={6}>
                        <Stack gap={4}>
                            <Group gap={6}>
                                <ThemeIcon size="xs" variant="transparent" color="blue.6"><IconMaximize size={12}/></ThemeIcon>
                                <Text size="xs" c="dark.6">{selectedRoomDetail.room_type.size_sqm || '-'} m²</Text>
                            </Group>
                            <Group gap={6}>
                                <ThemeIcon size="xs" variant="transparent" color="blue.6"><IconArmchair size={12}/></ThemeIcon>
                                <Text size="xs" c="dark.6">
                                    {selectedRoomDetail.room_type.bed_count}x {selectedRoomDetail.room_type.bed_type}
                                </Text>
                            </Group>
                            <Group gap={6}>
                                <ThemeIcon size="xs" variant="transparent" color="blue.6"><IconBuildingSkyscraper size={12}/></ThemeIcon>
                                <Text size="xs" c="dark.6">
                                    {selectedRoomDetail.wing ? `${selectedRoomDetail.wing}, ` : ''}Lt. {selectedRoomDetail.floor_number}
                                </Text>
                            </Group>
                        </Stack>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Stack gap={4}>
                             <Group gap={6}>
                                <ThemeIcon size="xs" variant="transparent" color="blue.6"><IconEye size={12}/></ThemeIcon>
                                <Text size="xs" c="dark.6">{selectedRoomDetail.room_type.view_type || 'Standar View'}</Text>
                            </Group>
                             <Group gap={6}>
                                <ThemeIcon size="xs" variant="transparent" color="blue.6"><IconAirConditioning size={12}/></ThemeIcon>
                                <Text size="xs" c="dark.6">
                                    {selectedRoomDetail.room_type.smoking_allowed ? 'Smoking Room' : 'Non-Smoking'}
                                </Text>
                            </Group>
                        </Stack>
                    </Grid.Col>
                </Grid>

                {/* Facilities List */}
                {getAmenities(selectedRoomDetail).length > 0 && (
                     <Group gap={4} mt="xs">
                        {getAmenities(selectedRoomDetail).slice(0, 4).map((am: string, i: number) => (
                            <Badge key={i} size="xs" variant="outline" color="blue" radius="sm">{am}</Badge>
                        ))}
                        {getAmenities(selectedRoomDetail).length > 4 && (
                            <Text size="xs" c="dimmed">+{getAmenities(selectedRoomDetail).length - 4} more</Text>
                        )}
                     </Group>
                )}
            </Paper>
          )}
          
          <Group grow>
            <DatePickerInput 
              label="Check-in" 
              placeholder="Pilih tanggal" 
              minDate={new Date()} 
              leftSection={<IconCalendar size={16} />} 
              {...form.getInputProps('check_in_date')} 
            />
            <DatePickerInput 
              label="Check-out" 
              placeholder="Pilih tanggal" 
              minDate={form.values.check_in_date || new Date()} 
              leftSection={<IconCalendar size={16} />} 
              {...form.getInputProps('check_out_date')} 
            />
          </Group>

          {/* --- SECTION 3: PAYMENT --- */}
          <Paper p="sm" bg="gray.0" radius="md" withBorder>
            <Group justify="space-between">
              <Text size="sm" fw={500}>Estimasi Total:</Text>
              <Text size="xl" fw={700} c="blue.7">
                {calculatedPrice ? `Rp ${calculatedPrice.toLocaleString('id-ID')}` : '-'}
              </Text>
            </Group>
          </Paper>

          <Select 
            label="Status Pembayaran" 
            data={[
              { value: 'pending', label: 'Pending (Belum Lunas)' },
              { value: 'paid', label: 'Paid (Lunas)' }
            ]} 
            required 
            leftSection={<IconCash size={16} />} 
            {...form.getInputProps('payment_status')} 
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button 
              type="submit" 
              variant="gradient"
              gradient={{ from: '#3b82f6', to: '#2563eb', deg: 135 }}
              loading={isSubmitting} 
              disabled={!calculatedPrice && !reservationToEdit}
            >
              Simpan Reservasi
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}