'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Text,
  Paper,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Divider,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { RoomTypeOption } from './page';
import { createTaReservation } from './actions';

interface Props {
  roomTypeOptions: RoomTypeOption[];
  hotelId: string;
  hotelName: string;
  agentId: string;
}

const B2B_DISCOUNT_RATE = 0.20;

const inputStyles = {
  input: {
    background: '#fafafa',
    border: '1px solid #e0e0e0',
    color: '#1a1a1a',
    '&:focus': {
      borderColor: '#1a1a1a',
      boxShadow: '0 0 0 1px #1a1a1a',
    },
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    marginBottom: 4,
  },
};

export default function TaBookRoomClient({ roomTypeOptions, hotelId, hotelName, agentId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill from URL params (coming from Availability page)
  const [title, setTitle] = useState<string | null>('Mr.');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [roomTypeId, setRoomTypeId] = useState(searchParams.get('roomTypeId') || '');
  const [submitting, setSubmitting] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Price Calculation ---
  const selectedType = useMemo(
    () => roomTypeOptions.find(rt => rt.id === roomTypeId),
    [roomTypeOptions, roomTypeId]
  );

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [checkIn, checkOut]);

  const rackRate = selectedType?.price_per_night || 0;
  const contractRate = rackRate * (1 - B2B_DISCOUNT_RATE);
  const totalPrice = contractRate * nights;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title) errs.title = 'Title is required';
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    if (!email.trim()) errs.email = 'Email is required';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Invalid email format';
    if (!checkIn) errs.checkIn = 'Check-in date is required';
    if (!checkOut) errs.checkOut = 'Check-out date is required';
    if (checkIn && checkOut && checkIn >= checkOut) errs.checkOut = 'Check-out must be after check-in';
    if (!roomTypeId) errs.roomTypeId = 'Room type is required';

    if (selectedType && selectedType.availableRoomIds.length === 0) {
      errs.roomTypeId = 'No available rooms for this type';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const roomId = selectedType?.availableRoomIds[0];
    if (!roomId) {
      notifications.show({
        title: 'No Room Available',
        message: 'No available rooms for the selected type.',
        color: 'red',
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await createTaReservation({
        hotelId,
        agentId,
        roomTypeId,
        roomId,
        checkIn,
        checkOut,
        title: title || 'Mr.',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      notifications.show({
        title: 'Reservation Confirmed',
        message: `Booking for ${result.data?.guestName} confirmed — City Ledger (${result.data?.nights} night${(result.data?.nights || 0) > 1 ? 's' : ''}).`,
        color: 'dark',
        icon: <IconCheck size={16} />,
      });

      router.push('/ta/reservations');
    } catch (error: any) {
      console.error('Booking error:', error);
      notifications.show({
        title: 'Booking Failed',
        message: error?.message || 'An error occurred while creating the reservation.',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const roomTypeSelectData = roomTypeOptions.map(rt => ({
    value: rt.id,
    label: `${rt.name} — ${rt.capacity} pax${rt.bed_type ? ` · ${rt.bed_type}` : ''} (${rt.availableRoomIds.length} avail.)`,
  }));

  return (
    <Box p="xl">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* LEFT COLUMN — Guest Information */}
        <Paper
          p="xl"
          radius="md"
          style={{
            border: '1px solid #e5e5e5',
            background: '#ffffff',
          }}
        >
          <Text size="sm" fw={700} mb="md" style={{ color: '#1a1a1a' }}>
            Guest Information
          </Text>

          <Select
            label="Title"
            placeholder="Select title"
            required
            data={['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']}
            value={title}
            onChange={setTitle}
            error={errors.title}
            size="sm"
            radius="md"
            mb="md"
            styles={{
              input: {
                background: '#fafafa',
                border: '1px solid #e0e0e0',
                color: '#1a1a1a',
              },
              label: {
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 4,
              },
            }}
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
            <TextInput
              label="First Name"
              placeholder="John"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.currentTarget.value)}
              error={errors.firstName}
              size="sm"
              radius="md"
              styles={inputStyles}
            />
            <TextInput
              label="Last Name"
              placeholder="Doe"
              required
              value={lastName}
              onChange={(e) => setLastName(e.currentTarget.value)}
              error={errors.lastName}
              size="sm"
              radius="md"
              styles={inputStyles}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Email"
              placeholder="john.doe@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              error={errors.email}
              size="sm"
              radius="md"
              styles={inputStyles}
            />
            <TextInput
              label="Phone Number"
              placeholder="+62 812 3456 7890"
              value={phone}
              onChange={(e) => setPhone(e.currentTarget.value)}
              size="sm"
              radius="md"
              styles={inputStyles}
            />
          </SimpleGrid>
        </Paper>

        {/* RIGHT COLUMN — Stay Details + Pricing */}
        <Stack gap="lg">
          <Paper
            p="xl"
            radius="md"
            style={{
              border: '1px solid #e5e5e5',
              background: '#ffffff',
            }}
          >
            <Text size="sm" fw={700} mb="md" style={{ color: '#1a1a1a' }}>
              Stay Details
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
              <TextInput
                type="date"
                label="Check-in Date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.currentTarget.value)}
                error={errors.checkIn}
                size="sm"
                radius="md"
                styles={inputStyles}
              />
              <TextInput
                type="date"
                label="Check-out Date"
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.currentTarget.value)}
                error={errors.checkOut}
                size="sm"
                radius="md"
                styles={inputStyles}
              />
            </SimpleGrid>

            <Select
              label="Room Type"
              placeholder="Select a room type"
              required
              data={roomTypeSelectData}
              value={roomTypeId}
              onChange={(v) => setRoomTypeId(v || '')}
              error={errors.roomTypeId}
              size="sm"
              radius="md"
              searchable
              styles={{
                input: {
                  background: '#fafafa',
                  border: '1px solid #e0e0e0',
                  color: '#1a1a1a',
                },
                label: {
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 4,
                },
              }}
            />
          </Paper>

          {/* B2B Pricing Summary */}
          {roomTypeId && nights > 0 && (
            <Paper
              p="xl"
              radius="md"
              style={{
                border: '1px solid #e5e5e5',
                background: '#ffffff',
              }}
            >
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm" style={{ letterSpacing: '0.04em' }}>
                B2B Contract Rate Summary
              </Text>
              <Group justify="space-between" mb={4}>
                <Text size="sm" c="dimmed">Rack Rate</Text>
                <Text size="sm" c="dimmed" td="line-through">
                  Rp {rackRate.toLocaleString('id-ID')} / night
                </Text>
              </Group>
              <Group justify="space-between" mb={4}>
                <Text size="sm" fw={600}>Contract Rate (−20%)</Text>
                <Text size="sm" fw={600}>
                  Rp {contractRate.toLocaleString('id-ID')} / night
                </Text>
              </Group>
              <Group justify="space-between" mb={4}>
                <Text size="sm" c="dimmed">Duration</Text>
                <Text size="sm" c="dimmed">
                  {nights} night{nights > 1 ? 's' : ''}
                </Text>
              </Group>
              <Divider my="xs" color="gray.3" />
              <Group justify="space-between">
                <Text size="sm" fw={800} style={{ color: '#1a1a1a' }}>Total</Text>
                <Text size="md" fw={800} style={{ color: '#1a1a1a' }}>
                  Rp {totalPrice.toLocaleString('id-ID')}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mt={4}>
                Payment: City Ledger — Billed to your agency
              </Text>
            </Paper>
          )}

          {/* Submit */}
          <Group justify="flex-end">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => router.back()}
              styles={{ root: { fontWeight: 500 } }}
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="dark"
              radius="md"
              loading={submitting}
              onClick={handleSubmit}
              leftSection={!submitting ? <IconCheck size={16} /> : undefined}
              styles={{
                root: {
                  fontWeight: 600,
                  minWidth: 160,
                },
              }}
            >
              Confirm Reservation
            </Button>
          </Group>
        </Stack>
      </SimpleGrid>
    </Box>
  );
}
