'use client';

import { useEffect, useState } from 'react';
import { Modal, Stack, TextInput, Button, Group, Select, PasswordInput, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { createUserAction, updateUserAction, UserFormData } from '../actions';
import { UserWithRoles } from '../client';

interface Props {
  opened: boolean;
  onClose: () => void;
  itemToEdit: UserWithRoles | null;
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
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email address'),
      full_name: (val) => (val.length < 3 ? 'Name is too short' : null),
      role_id: (val) => (!val ? 'Role selection is required' : null),
      password: (val) => (!itemToEdit && val && val.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (itemToEdit) {
        const activeAssignment = itemToEdit.user_roles?.[0];
        
        form.setValues({
          email: itemToEdit.email,
          full_name: itemToEdit.full_name,
          role_id: activeAssignment?.role_id || '', 
          hotel_id: activeAssignment?.hotel_id || '', 
          password: '',
        });
      } else {
        form.reset();
      }
    }
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
        notifications.show({ title: 'Failed', message: result.error, color: 'red' });
      } else {
        notifications.show({ title: 'Success', message: 'User saved successfully', color: 'teal' });
        onClose();
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'An unexpected error occurred', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
        opened={opened} 
        onClose={onClose} 
        title={<Text fw={700}>{itemToEdit ? 'Edit User' : 'Add New User'}</Text>} 
        centered
        radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput 
            label="Full Name" 
            placeholder="e.g. John Doe" 
            required 
            radius="md"
            {...form.getInputProps('full_name')} 
          />
          <TextInput 
            label="Email Address" 
            placeholder="john@example.com" 
            required 
            disabled={!!itemToEdit} 
            radius="md"
            {...form.getInputProps('email')} 
          />
          
          {!itemToEdit && (
            <PasswordInput 
              label="Password" 
              placeholder="Set initial password" 
              required 
              radius="md"
              {...form.getInputProps('password')} 
            />
          )}

          <Select 
            label="System Role"
            placeholder="Select Role"
            data={roles}
            searchable
            required
            radius="md"
            {...form.getInputProps('role_id')}
          />

          <Select 
            label="Assigned Hotel"
            placeholder="Select Hotel (Optional)"
            data={hotels}
            searchable
            clearable
            radius="md"
            description="Leave empty if assigning a Global/Super Admin role"
            {...form.getInputProps('hotel_id')}
          />
          
          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={onClose} disabled={isSubmitting} radius="md">Cancel</Button>
            <Button
              type="submit"
              loading={isSubmitting}
              radius="md"
              style={{
                background: 'linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)',
                color: 'white'
              }}
            >
              Save User
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}