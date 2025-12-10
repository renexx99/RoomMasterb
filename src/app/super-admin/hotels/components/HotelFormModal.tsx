'use client';

import { useEffect, useState } from 'react';
import { Modal, Stack, TextInput, Button, Group, Select, Grid, FileInput, Text } from '@mantine/core';
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
      name: (value) => (!value ? 'Hotel name is required' : null),
      code: (value) => (!value ? 'Hotel code is required' : null),
      address: (value) => (!value ? 'Address is required' : null),
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
          image: null, 
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
        notifications.show({ title: 'Failed', message: result.error, color: 'red' });
      } else {
        notifications.show({ title: 'Success', message: 'Hotel data saved successfully', color: 'teal' });
        onClose();
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'System error occurred', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
        opened={opened} 
        onClose={onClose} 
        title={<Text fw={700}>{itemToEdit ? 'Edit Hotel Data' : 'Add New Hotel'}</Text>} 
        centered
        size="lg"
        radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid gutter="md">
             <Grid.Col span={8}>
                <TextInput label="Hotel Name" placeholder="e.g., Grand Hotel Surabaya" required radius="md" {...form.getInputProps('name')} />
             </Grid.Col>
             <Grid.Col span={4}>
                <TextInput label="Unique Code" placeholder="H-001" required radius="md" {...form.getInputProps('code')} />
             </Grid.Col>
          </Grid>

          <TextInput label="Full Address" placeholder="Main Street..." required radius="md" {...form.getInputProps('address')} />

          <Grid gutter="md">
            <Grid.Col span={6}>
                <Select
                    label="Operational Status"
                    data={[
                        { value: 'active', label: 'Active (Open)' },
                        { value: 'maintenance', label: 'Maintenance' },
                        { value: 'suspended', label: 'Suspended' },
                    ]}
                    required
                    radius="md"
                    {...form.getInputProps('status')}
                />
            </Grid.Col>
            <Grid.Col span={6}>
                <FileInput 
                    label="Hotel Photo"
                    placeholder={itemToEdit?.image_url ? "Change photo..." : "Upload photo..."}
                    leftSection={<IconUpload size={16} />}
                    accept="image/png,image/jpeg"
                    radius="md"
                    clearable
                    {...form.getInputProps('image')}
                />
            </Grid.Col>
          </Grid>
          
          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={onClose} disabled={isSubmitting} radius="md">Cancel</Button>
            <Button type="submit" color="indigo" loading={isSubmitting} radius="md">Save</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}