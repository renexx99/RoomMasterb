'use client';

import { useEffect, useState } from 'react';
import { Modal, Stack, TextInput, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUser, IconMail, IconPhone } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Guest } from '@/core/types/database';
import { createGuest, updateGuest } from '../actions';

interface GuestFormModalProps {
  opened: boolean;
  onClose: () => void;
  hotelId: string;
  guestToEdit: Guest | null;
}

export function GuestFormModal({ opened, onClose, hotelId, guestToEdit }: GuestFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      full_name: '',
      email: '',
      phone_number: '',
    },
    validate: {
      full_name: (value) => (!value ? 'Nama lengkap harus diisi' : null),
      email: (value) => {
        if (!value) return 'Email harus diisi';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Format email tidak valid';
        return null;
      },
    },
  });

  // Reset form saat modal dibuka/ditutup atau mode edit berubah
  useEffect(() => {
    if (opened) {
      if (guestToEdit) {
        form.setValues({
          full_name: guestToEdit.full_name,
          email: guestToEdit.email,
          phone_number: guestToEdit.phone_number || '',
        });
      } else {
        form.reset();
      }
    }
  }, [opened, guestToEdit]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      const guestData = {
        hotel_id: hotelId,
        full_name: values.full_name,
        email: values.email,
        phone_number: values.phone_number || null,
      };

      let result;
      if (guestToEdit) {
        result = await updateGuest(guestToEdit.id, guestData);
      } else {
        result = await createGuest(guestData);
      }

      if (result.error) {
        notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
      } else {
        notifications.show({ 
          title: 'Sukses', 
          message: `Tamu berhasil ${guestToEdit ? 'diperbarui' : 'ditambahkan'}`, 
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
      title={guestToEdit ? 'Edit Data Tamu' : 'Tambah Tamu Baru'} 
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput 
            label="Nama Lengkap" 
            placeholder="Masukkan nama lengkap" 
            required 
            leftSection={<IconUser size={18} stroke={1.5} />} 
            {...form.getInputProps('full_name')} 
          />
          <TextInput 
            label="Email" 
            placeholder="email@tamu.com" 
            required 
            leftSection={<IconMail size={18} stroke={1.5} />} 
            {...form.getInputProps('email')} 
          />
          <TextInput 
            label="Nomor Telepon (Opsional)" 
            placeholder="0812..." 
            leftSection={<IconPhone size={18} stroke={1.5} />} 
            {...form.getInputProps('phone_number')} 
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" color="teal" loading={isSubmitting}>
              {guestToEdit ? 'Update Tamu' : 'Simpan Tamu'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}