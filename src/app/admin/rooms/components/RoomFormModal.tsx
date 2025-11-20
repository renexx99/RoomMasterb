'use client';

import { useEffect, useState, useMemo } from 'react';
import { Modal, Stack, TextInput, Button, Group, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { RoomType, RoomStatus } from '@/core/types/database';
import { RoomWithDetails } from '../page';
import { createRoom, updateRoom } from '../actions';

interface Props {
  opened: boolean;
  onClose: () => void;
  hotelId: string;
  itemToEdit: RoomWithDetails | null;
  roomTypes: RoomType[];
}

export function RoomFormModal({ opened, onClose, hotelId, itemToEdit, roomTypes }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const typeOptions = useMemo(() => roomTypes.map(t => ({ value: t.id, label: t.name })), [roomTypes]);

  const form = useForm({
    initialValues: {
      room_number: '',
      room_type_id: '',
      // PERBAIKAN: Hapus initial value floor
      status: 'available' as RoomStatus,
    },
    validate: {
      room_number: (value) => (!value ? 'Nomor kamar harus diisi' : null),
      room_type_id: (value) => (!value ? 'Pilih tipe kamar' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (itemToEdit) {
        form.setValues({
          room_number: itemToEdit.room_number,
          room_type_id: itemToEdit.room_type_id,
          // PERBAIKAN: Hapus set value floor
          status: itemToEdit.status,
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
      // PERBAIKAN: Hapus floor dari payload
      const payload = {
        hotel_id: hotelId,
        room_number: values.room_number,
        room_type_id: values.room_type_id,
        status: values.status,
      };

      let result;
      if (itemToEdit) {
        result = await updateRoom(itemToEdit.id, payload);
      } else {
        result = await createRoom(payload);
      }

      if (result.error) {
        notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
      } else {
        notifications.show({ 
          title: 'Sukses', 
          message: `Kamar berhasil ${itemToEdit ? 'diperbarui' : 'ditambahkan'}`, 
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
      title={itemToEdit ? 'Edit Kamar' : 'Tambah Kamar Baru'} 
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput 
            label="Nomor Kamar" 
            placeholder="Contoh: 101, A-01" 
            required 
            {...form.getInputProps('room_number')} 
          />

          <Select
            label="Tipe Kamar"
            placeholder="Pilih tipe"
            data={typeOptions}
            required
            searchable
            {...form.getInputProps('room_type_id')}
          />
          
          {/* PERBAIKAN: Input Lantai DIHAPUS */}
          
          <Select
              label="Status Awal"
              data={[
                  { value: 'available', label: 'Tersedia' },
                  { value: 'occupied', label: 'Terisi' },
                  { value: 'maintenance', label: 'Perbaikan' },
                  // PERBAIKAN: Hapus 'dirty' karena tidak ada di CHECK constraint database
              ]}
              required
              {...form.getInputProps('status')}
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