'use client';

import { useEffect, useState } from 'react';
import { Modal, Stack, TextInput, Button, Group, Select, Grid, FileInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUpload } from '@tabler/icons-react';
import { createHotelAction, updateHotelAction } from '../actions';
import { Hotel } from '@/core/types/database';

interface Props {
  opened: boolean;
  onClose: () => void;
  itemToEdit: Hotel | null;
}

export function HotelFormModal({ opened, onClose, itemToEdit }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      code: '',
      address: '',
      status: 'active',
      image: null as File | null,
    },
    validate: {
      name: (value) => (!value ? 'Nama hotel wajib diisi' : null),
      code: (value) => (!value ? 'Kode hotel wajib diisi' : null),
      address: (value) => (!value ? 'Alamat wajib diisi' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (itemToEdit) {
        form.setValues({
          name: itemToEdit.name,
          code: itemToEdit.code || '',
          address: itemToEdit.address,
          status: itemToEdit.status as string,
          image: null, // Reset file input saat edit
        });
      } else {
        form.reset();
      }
    }
  }, [opened, itemToEdit]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('code', values.code);
      formData.append('address', values.address);
      formData.append('status', values.status);
      if (values.image) {
        formData.append('image', values.image);
      }

      let result;
      if (itemToEdit) {
        formData.append('id', itemToEdit.id);
        result = await updateHotelAction(formData);
      } else {
        result = await createHotelAction(formData);
      }

      if (result.error) {
        notifications.show({ title: 'Gagal', message: result.error, color: 'red' });
      } else {
        notifications.show({ title: 'Sukses', message: 'Data hotel berhasil disimpan', color: 'green' });
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
        title={itemToEdit ? 'Edit Hotel' : 'Tambah Hotel Baru'} 
        centered
        size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
             <Grid.Col span={8}>
                <TextInput label="Nama Hotel" placeholder="Contoh: Grand Hotel" required {...form.getInputProps('name')} />
             </Grid.Col>
             <Grid.Col span={4}>
                <TextInput label="Kode" placeholder="H-01" required {...form.getInputProps('code')} />
             </Grid.Col>
          </Grid>

          <TextInput label="Alamat" placeholder="Alamat lengkap" required {...form.getInputProps('address')} />

          <Grid>
            <Grid.Col span={6}>
                <Select
                    label="Status Operasional"
                    data={[
                        { value: 'active', label: 'Active (Buka)' },
                        { value: 'maintenance', label: 'Maintenance' },
                        { value: 'suspended', label: 'Suspended' },
                    ]}
                    required
                    {...form.getInputProps('status')}
                />
            </Grid.Col>
            <Grid.Col span={6}>
                <FileInput 
                    label="Upload Foto Hotel"
                    placeholder={itemToEdit?.image_url ? "Ganti foto..." : "Pilih foto..."}
                    leftSection={<IconUpload size={14} />}
                    accept="image/png,image/jpeg"
                    {...form.getInputProps('image')}
                />
            </Grid.Col>
          </Grid>
          
          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" color="indigo" loading={isSubmitting}>Simpan Hotel</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}