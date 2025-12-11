'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal, Stack, TextInput, Select, NumberInput, Textarea, Group, Button, Tabs, Grid, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import '@mantine/dates/styles.css';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { RoomType, RoomStatus, WingType, FurnitureCondition } from '@/core/types/database';
import { createRoomAction, updateRoomAction } from '../actions';
import { RoomWithDetails } from '../page';

// Constants
const WING_TYPES = [
  { value: 'North Wing', label: 'North Wing' },
  { value: 'South Wing', label: 'South Wing' },
  { value: 'East Wing', label: 'East Wing' },
  { value: 'West Wing', label: 'West Wing' },
  { value: 'Central', label: 'Central Building' },
];

const FURNITURE_CONDITIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'needs_replacement', label: 'Needs Replacement' },
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
];

interface Props {
  opened: boolean;
  onClose: () => void;
  hotelId: string;
  itemToEdit: RoomWithDetails | null;
  roomTypes: RoomType[];
}

export function RoomFormModal({ opened, onClose, hotelId, itemToEdit, roomTypes }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roomTypeOptions = useMemo(() => roomTypes.map(rt => ({
    value: rt.id,
    label: `${rt.name} - Rp ${rt.price_per_night.toLocaleString('id-ID')}/night`,
  })), [roomTypes]);

  const form = useForm({
    initialValues: {
      room_number: '',
      room_type_id: '',
      status: 'available' as RoomStatus,
      floor_number: 1,
      wing: '' as WingType | '',
      furniture_condition: 'good' as FurnitureCondition,
      last_renovation_date: null as Date | null,
      special_notes: '',
    },
    validate: {
      room_number: (v) => (!v ? 'Room number is required' : null),
      room_type_id: (v) => (!v ? 'Room type is required' : null),
      status: (v) => (!v ? 'Status is required' : null),
      floor_number: (v) => (v < 1 ? 'Minimum floor is 1' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (itemToEdit) {
        form.setValues({
          room_number: itemToEdit.room_number,
          room_type_id: itemToEdit.room_type_id,
          status: itemToEdit.status,
          floor_number: itemToEdit.floor_number || 1,
          wing: (itemToEdit.wing as WingType) || '',
          furniture_condition: (itemToEdit.furniture_condition as FurnitureCondition) || 'good',
          last_renovation_date: itemToEdit.last_renovation_date ? new Date(itemToEdit.last_renovation_date) : null,
          special_notes: itemToEdit.special_notes || '',
        });
      } else {
        form.reset();
      }
    }
  }, [opened, itemToEdit]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      const payload = {
        hotel_id: hotelId,
        room_number: values.room_number,
        room_type_id: values.room_type_id,
        status: values.status,
        floor_number: values.floor_number,
        wing: (values.wing as WingType) || null,
        furniture_condition: values.furniture_condition,
        last_renovation_date: values.last_renovation_date?.toISOString().split('T')[0] || null,
        special_notes: values.special_notes || null,
      };

      let result;
      if (itemToEdit) {
        result = await updateRoomAction(itemToEdit.id, payload);
      } else {
        result = await createRoomAction(payload);
      }

      if (result.error) {
        notifications.show({ title: 'Failed', message: result.error, color: 'red' });
      } else {
        notifications.show({ 
          title: 'Success', 
          message: `Room ${itemToEdit ? 'updated' : 'created'} successfully`, 
          color: 'green' 
        });
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
      title={<Text fw={700}>{itemToEdit ? 'Edit Room' : 'Add New Room'}</Text>}
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Tabs defaultValue="basic">
          <Tabs.List>
            <Tabs.Tab value="basic">Basic Info</Tabs.Tab>
            <Tabs.Tab value="details">Physical Details</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="basic" pt="md">
            <Stack gap="md">
              <TextInput
                label="Room Number"
                placeholder="e.g. 101, A-15"
                required
                {...form.getInputProps('room_number')}
              />
              <Select
                label="Room Type"
                placeholder="Select type"
                data={roomTypeOptions}
                required
                searchable
                {...form.getInputProps('room_type_id')}
              />
              <Select
                label="Current Status"
                data={STATUS_OPTIONS}
                required
                {...form.getInputProps('status')}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="details" pt="md">
            <Stack gap="md">
              <Grid>
                <Grid.Col span={6}>
                  <NumberInput
                    label="Floor Number"
                    min={1}
                    {...form.getInputProps('floor_number')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Wing/Location"
                    placeholder="Select wing"
                    data={WING_TYPES}
                    clearable
                    {...form.getInputProps('wing')}
                  />
                </Grid.Col>
              </Grid>
              <Select
                label="Furniture Condition"
                data={FURNITURE_CONDITIONS}
                {...form.getInputProps('furniture_condition')}
              />
              <DateInput
                label="Last Renovation"
                placeholder="Select date"
                valueFormat="DD MMMM YYYY"
                clearable
                {...form.getInputProps('last_renovation_date')}
              />
              <Textarea
                label="Special Notes"
                placeholder="Any issues or features..."
                minRows={2}
                {...form.getInputProps('special_notes')}
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={isSubmitting}
            variant="gradient"
            gradient={{ from: '#3b82f6', to: '#2563eb', deg: 135 }}
          >
            Save Room
          </Button>
        </Group>
      </form>
    </Modal>
  );
}