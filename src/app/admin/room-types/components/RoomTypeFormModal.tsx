'use client';

import { useEffect, useState } from 'react';
import { Modal, Stack, TextInput, Button, Group, NumberInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { RoomType } from '@/core/types/database';
import { createRoomType, updateRoomType } from '../actions';

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
      capacity: 2,
    },
    validate: {
      name: (value) => (!value ? 'Nama wajib diisi' : null),
      price_per_night: (value) => (value <= 0 ? 'Harga harus lebih dari 0' : null),
      capacity: (value) => (value < 1 ? 'Minimal 1 orang' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (itemToEdit) {
        form.setValues({
          name: itemToEdit.name,
          description: itemToEdit.description || '',
          price_per_night: itemToEdit.price_per_night,
          capacity: itemToEdit.capacity,
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
      const payload = {
        hotel_id: hotelId,
        name: values.name,
        description: values.description,
        price_per_night: values.price_per_night,
        capacity: values.capacity,
      };

      let result;
      if (itemToEdit) {
        result = await updateRoomType(itemToEdit.id, payload);
      } else {
        result = await createRoomType(payload);
      }

      if (result.error) {
        notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
      } else {
        notifications.show({ 
          title: 'Sukses', 
          message: `Tipe Kamar berhasil ${itemToEdit ? 'diperbarui' : 'ditambahkan'}`, 
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
        centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput 
            label="Nama Tipe" 
            placeholder="Contoh: Deluxe Room" 
            required 
            {...form.getInputProps('name')} 
          />
          
          <Group grow>
            <NumberInput
                label="Harga per Malam (Rp)"
                placeholder="0"
                required
                min={0}
                hideControls
                thousandSeparator="."
                decimalSeparator=","
                {...form.getInputProps('price_per_night')}
            />
            <NumberInput
                label="Kapasitas (Orang)"
                placeholder="2"
                required
                min={1}
                {...form.getInputProps('capacity')}
            />
          </Group>

          <Textarea 
            label="Deskripsi" 
            placeholder="Fasilitas dan keterangan..." 
            autosize
            minRows={3}
            {...form.getInputProps('description')} 
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" color="teal" loading={isSubmitting}>Simpan</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}