'use client';

import { useEffect } from 'react';
import { Modal, Stack, TextInput, PasswordInput, Button, Group, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { StaffMember } from '../page';
import { Role } from '@/core/types/database';

interface Props {
  opened: boolean;
  onClose: () => void;
  userToEdit: StaffMember | null;
  availableRoles: Role[];
  onSubmit: (values: any) => void;
  isSubmitting: boolean;
}

export function StaffFormModal({ opened, onClose, userToEdit, availableRoles, onSubmit, isSubmitting }: Props) {
  const roleOptions = availableRoles.map(r => ({ value: r.id, label: r.name }));

  const form = useForm({
    initialValues: {
      email: '',
      full_name: '',
      password: '',
      role_id: '',
    },
    validate: {
      email: (value) => (!value || !/^\S+@\S+\.\S+$/.test(value) ? 'Email tidak valid' : null),
      full_name: (value) => (!value ? 'Nama lengkap wajib diisi' : null),
      password: (value) => (!userToEdit && (!value || value.length < 6) ? 'Password minimal 6 karakter' : null),
      role_id: (value) => (!userToEdit && !value ? 'Peran wajib dipilih' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (userToEdit) {
        form.setValues({
          email: userToEdit.email,
          full_name: userToEdit.full_name,
          password: '',
          role_id: '',
        });
      } else {
        form.reset();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, userToEdit]);

  return (
    <Modal opened={opened} onClose={onClose} title={userToEdit ? 'Edit Profil Staf' : 'Tambah Staf Baru'} centered>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput label="Nama Lengkap" placeholder="Nama" required {...form.getInputProps('full_name')} />
          <TextInput label="Email" placeholder="Email" required disabled={!!userToEdit} {...form.getInputProps('email')} />
          
          {!userToEdit && (
             <>
               <PasswordInput label="Password" placeholder="Password" required {...form.getInputProps('password')} />
               <Select 
                 label="Peran Awal" 
                 placeholder="Pilih peran" 
                 data={roleOptions} 
                 required 
                 {...form.getInputProps('role_id')} 
               />
             </>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" loading={isSubmitting} color="teal">
              {userToEdit ? 'Update Profil' : 'Tambah Staf'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}