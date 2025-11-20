'use client';

import { useEffect, useState } from 'react';
import { Modal, Stack, TextInput, Button, Group, Select, PasswordInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { createUserAction, updateUserAction, UserFormData } from '../actions';
import { UserWithRoles } from '../client'; // Import tipe lokal

interface Props {
  opened: boolean;
  onClose: () => void;
  itemToEdit: UserWithRoles | null; // Gunakan tipe yang benar
  hotels: { label: string; value: string }[];
  roles: { label: string; value: string }[];
}

export function UserFormModal({ opened, onClose, itemToEdit, hotels, roles }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserFormData>({
    initialValues: {
      email: '',
      full_name: '',
      role_id: '',
      hotel_id: '',
      password: '',
    },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Email tidak valid'),
      full_name: (val) => (val.length < 3 ? 'Nama terlalu pendek' : null),
      role_id: (val) => (!val ? 'Role harus dipilih' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (itemToEdit) {
        // --- LOGIC PENTING: Ambil ID dari array user_roles ---
        const activeAssignment = itemToEdit.user_roles?.[0];
        
        form.setValues({
          email: itemToEdit.email,
          full_name: itemToEdit.full_name,
          // Ambil role_id dari relasi, bukan dari profiles
          role_id: activeAssignment?.role_id || '', 
          // Ambil hotel_id dari relasi
          hotel_id: activeAssignment?.hotel_id || '', 
          password: '',
        });
      } else {
        form.reset();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, itemToEdit]);

  const handleSubmit = async (values: UserFormData) => {
    setIsSubmitting(true);
    try {
      let result;
      if (itemToEdit) {
        result = await updateUserAction(itemToEdit.id, values);
      } else {
        result = await createUserAction(values);
      }

      if (result.error) {
        notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
      } else {
        notifications.show({ title: 'Sukses', message: 'Data user berhasil disimpan', color: 'green' });
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
        title={itemToEdit ? 'Edit User & Role' : 'Tambah User Baru'} 
        centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput label="Nama Lengkap" placeholder="John Doe" required {...form.getInputProps('full_name')} />
          <TextInput label="Email" placeholder="john@example.com" required disabled={!!itemToEdit} {...form.getInputProps('email')} />
          
          {!itemToEdit && (
            <PasswordInput label="Password" placeholder="Rahasia..." required {...form.getInputProps('password')} />
          )}

          <Select 
            label="Role / Jabatan"
            placeholder="Pilih Role"
            data={roles}
            searchable
            required
            {...form.getInputProps('role_id')}
          />

          <Select 
            label="Penempatan Hotel"
            placeholder="Pilih hotel (Opsional)"
            data={hotels}
            searchable
            clearable
            description="Kosongkan jika role adalah Super Admin"
            {...form.getInputProps('hotel_id')}
          />
          
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" color="indigo" loading={isSubmitting}>Simpan</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}