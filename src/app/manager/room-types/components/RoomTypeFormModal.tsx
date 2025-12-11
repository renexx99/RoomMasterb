'use client';

import { useEffect, useState } from 'react';
import { 
  Modal, Stack, TextInput, Textarea, NumberInput, Grid, 
  Select, Switch, MultiSelect, Button, Group, Tabs, Text 
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { RoomType } from '@/core/types/database';
import { createRoomTypeAction, updateRoomTypeAction, RoomTypePayload } from '../actions';

// Constants
const BED_TYPES = [
  { value: 'Single', label: 'Single Bed (90cm)' },
  { value: 'Twin', label: 'Twin Beds (2x 90cm)' },
  { value: 'Double', label: 'Double Bed (140cm)' },
  { value: 'Queen', label: 'Queen Bed (160cm)' },
  { value: 'King', label: 'King Bed (180cm)' },
  { value: 'Super King', label: 'Super King Bed (200cm)' },
];

const VIEW_TYPES = [
  { value: 'City View', label: 'City View' },
  { value: 'Sea View', label: 'Sea View' },
  { value: 'Garden View', label: 'Garden View' },
  { value: 'Pool View', label: 'Pool View' },
  { value: 'Mountain View', label: 'Mountain View' },
  { value: 'No View', label: 'No View' },
];

const COMMON_AMENITIES = [
  'AC', 'TV LED', 'WiFi Gratis', 'Mini Bar', 'Coffee Maker',
  'Safe Box', 'Shower', 'Bathtub', 'Hair Dryer', 'Iron & Board',
  'Telephone', 'Work Desk', 'Sofa', 'Balcony', 'Kitchenette',
  'Microwave', 'Refrigerator'
];

interface Props {
  opened: boolean;
  onClose: () => void;
  hotelId: string;
  itemToEdit: RoomType | null;
}

export function RoomTypeFormModal({ opened, onClose, hotelId, itemToEdit }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      price_per_night: 0,
      capacity: 1,
      size_sqm: 0,
      bed_type: '',
      bed_count: 1,
      view_type: '',
      smoking_allowed: false,
      amenities: [] as string[],
    },
    validate: {
      name: (value) => (!value ? 'Nama tipe kamar harus diisi' : null),
      price_per_night: (value) => (value <= 0 ? 'Harga harus lebih dari 0' : null),
      capacity: (value) => (value <= 0 ? 'Kapasitas minimal 1' : null),
      bed_count: (value) => (value < 1 ? 'Minimal 1 kasur' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (itemToEdit) {
        // Parsing amenities jika disimpan sebagai string JSON di DB lama
        let amenitiesData: string[] = [];
        if (Array.isArray(itemToEdit.amenities)) {
            amenitiesData = itemToEdit.amenities;
        } else if (typeof itemToEdit.amenities === 'string') {
            try { amenitiesData = JSON.parse(itemToEdit.amenities); } catch {}
        }

        form.setValues({
          name: itemToEdit.name,
          description: itemToEdit.description || '',
          price_per_night: itemToEdit.price_per_night,
          capacity: itemToEdit.capacity,
          size_sqm: itemToEdit.size_sqm || 0,
          bed_type: itemToEdit.bed_type || '',
          bed_count: itemToEdit.bed_count || 1,
          view_type: itemToEdit.view_type || '',
          smoking_allowed: itemToEdit.smoking_allowed || false,
          amenities: amenitiesData,
        });
      } else {
        form.reset();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, itemToEdit]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      const payload: RoomTypePayload = {
        hotel_id: hotelId,
        name: values.name,
        description: values.description || null,
        price_per_night: values.price_per_night,
        capacity: values.capacity,
        size_sqm: values.size_sqm || null,
        bed_type: values.bed_type || null,
        bed_count: values.bed_count,
        view_type: values.view_type || null,
        smoking_allowed: values.smoking_allowed,
        amenities: values.amenities.length > 0 ? values.amenities : null,
      };

      let result;
      if (itemToEdit) {
        result = await updateRoomTypeAction(itemToEdit.id, payload);
      } else {
        result = await createRoomTypeAction(payload);
      }

      if (result.error) {
        notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
      } else {
        notifications.show({ 
          title: 'Sukses', 
          message: `Tipe kamar berhasil ${itemToEdit ? 'diperbarui' : 'dibuat'}`, 
          color: 'green' 
        });
        onClose();
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Terjadi kesalahan sistem', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={itemToEdit ? 'Edit Tipe Kamar' : 'Tambah Tipe Kamar'}
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Tabs defaultValue="basic">
          <Tabs.List>
            <Tabs.Tab value="basic">Informasi Dasar</Tabs.Tab>
            <Tabs.Tab value="details">Detail Kamar</Tabs.Tab>
            <Tabs.Tab value="amenities">Fasilitas</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="basic" pt="md">
            <Stack gap="md">
              <TextInput
                label="Nama Tipe Kamar"
                placeholder="Standard, Deluxe, Suite..."
                required
                {...form.getInputProps('name')}
              />
              <Textarea
                label="Deskripsi"
                placeholder="Deskripsi singkat tipe kamar..."
                minRows={3}
                {...form.getInputProps('description')}
              />
              <Grid>
                <Grid.Col span={6}>
                  {/* PERBAIKAN: Menambahkan decimalSeparator="," */}
                  <NumberInput
                    label="Harga/Malam (Rp)"
                    placeholder="500000"
                    required
                    min={1}
                    step={10000}
                    thousandSeparator="."
                    decimalSeparator="," 
                    hideControls
                    {...form.getInputProps('price_per_night')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <NumberInput
                    label="Kapasitas (orang)"
                    required
                    min={1}
                    {...form.getInputProps('capacity')}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="details" pt="md">
            <Stack gap="md">
              <NumberInput
                label="Ukuran Kamar (m²)"
                placeholder="28.5"
                min={0}
                step={0.5}
                decimalScale={1}
                decimalSeparator="," 
                {...form.getInputProps('size_sqm')}
              />
              <Grid>
                <Grid.Col span={8}>
                  <Select
                    label="Tipe Kasur"
                    placeholder="Pilih tipe kasur"
                    data={BED_TYPES}
                    clearable
                    {...form.getInputProps('bed_type')}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Jumlah Kasur"
                    min={1}
                    {...form.getInputProps('bed_count')}
                  />
                </Grid.Col>
              </Grid>
              <Select
                label="Jenis Pemandangan"
                placeholder="Pilih view"
                data={VIEW_TYPES}
                clearable
                {...form.getInputProps('view_type')}
              />
              <Switch
                label="Boleh Merokok"
                {...form.getInputProps('smoking_allowed', { type: 'checkbox' })}
                mt="xs"
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="amenities" pt="md">
            <Stack gap="md">
              <MultiSelect
                label="Fasilitas Kamar"
                placeholder="Pilih fasilitas"
                data={COMMON_AMENITIES}
                searchable
                {...form.getInputProps('amenities')}
              />
              <Text size="xs" c="dimmed">
                Pilih semua fasilitas yang tersedia di tipe kamar ini
              </Text>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {itemToEdit ? 'Update' : 'Simpan'}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}