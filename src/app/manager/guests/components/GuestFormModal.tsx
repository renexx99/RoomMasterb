// src/app/manager/guests/components/GuestFormModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { Modal, Stack, TextInput, Button, Group, Select, TagsInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Guest } from '@/core/types/database';
import { createGuestAction, updateGuestAction } from '../actions';

interface Props {
  opened: boolean;
  onClose: () => void;
  guest: Guest | null;
  hotelId: string;
}

export function GuestFormModal({ opened, onClose, guest, hotelId }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      title: 'Mr.',
      full_name: '',
      email: '',
      phone_number: '',
      loyalty_tier: 'Bronze',
      preferences: [] as string[],
    },
    validate: {
      full_name: (v) => (!v ? 'Name is required' : null),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
    },
  });

  useEffect(() => {
    if (opened) {
      if (guest) {
        form.setValues({
          title: guest.title || 'Mr.',
          full_name: guest.full_name,
          email: guest.email,
          phone_number: guest.phone_number || '',
          loyalty_tier: guest.loyalty_tier || 'Bronze',
          preferences: (guest.preferences as any)?.tags || [],
        });
      } else {
        form.reset();
      }
    }
  }, [opened, guest]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        hotel_id: hotelId,
      };

      let res;
      if (guest) {
        res = await updateGuestAction(guest.id, payload);
      } else {
        res = await createGuestAction(payload);
      }

      if (res.error) {
        notifications.show({ title: 'Failed', message: res.error, color: 'red' });
      } else {
        notifications.show({ title: 'Success', message: 'Guest data saved', color: 'green' });
        onClose();
        window.location.reload();
      }
    } catch (e) {
      notifications.show({ title: 'Error', message: 'System error occurred', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={guest ? 'Edit Guest' : 'New Guest'} centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Group grow>
            <Select 
                label="Title" 
                data={['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']} 
                {...form.getInputProps('title')} 
                style={{ maxWidth: 80 }}
            />
            <TextInput label="Full Name" required {...form.getInputProps('full_name')} />
          </Group>
          
          <TextInput label="Email" required {...form.getInputProps('email')} />
          <TextInput label="Phone Number" {...form.getInputProps('phone_number')} />
          
          <Select 
            label="Loyalty Tier" 
            data={['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']} 
            {...form.getInputProps('loyalty_tier')} 
          />

          <TagsInput
            label="Preferences"
            placeholder="Type and press Enter"
            data={['Non-Smoking', 'High Floor', 'Quiet Room', 'Extra Pillow', 'Near Elevator']}
            clearable
            {...form.getInputProps('preferences')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            {/* Manager Gradient Blue */}
            <Button 
                type="submit" 
                loading={isSubmitting} 
                variant="gradient"
                gradient={{ from: '#3b82f6', to: '#2563eb', deg: 135 }}
            >
                Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}