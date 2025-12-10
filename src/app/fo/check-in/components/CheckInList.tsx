'use client';

import { SimpleGrid, Card, Group, Avatar, Text, Badge, Button, Divider, Stack, ThemeIcon, Center } from '@mantine/core';
import { IconUser, IconBed, IconLogin, IconLogout, IconCreditCard, IconCalendarTime, IconDiamond } from '@tabler/icons-react';
import { ReservationDetails } from '../page';

interface CheckInListProps {
  data: ReservationDetails[];
  type: 'check-in' | 'check-out';
  onAction: (res: ReservationDetails) => void;
  loading?: boolean;
}

export function CheckInList({ data, type, onAction, loading }: CheckInListProps) {
  if (data.length === 0) {
    return (
      <Center py={50}>
        <Stack align="center" gap="xs">
          <ThemeIcon size={60} radius="xl" color="gray" variant="light">
            {type === 'check-in' ? <IconLogin size={30}/> : <IconLogout size={30}/>}
          </ThemeIcon>
          <Text c="dimmed" fw={500}>No {type === 'check-in' ? 'arrivals' : 'departures'} found for this date.</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
      {data.map((res) => {
        // Logika Status Kamar
        const isRoomReady = type === 'check-in' ? res.room?.cleaning_status === 'clean' : true;
        const statusColor = isRoomReady ? 'teal' : 'red';
        const statusLabel = isRoomReady ? 'Ready' : 'Not Ready';

        // Hitung durasi menginap
        const nights = Math.ceil((new Date(res.check_out_date).getTime() - new Date(res.check_in_date).getTime()) / (1000 * 3600 * 24));

        return (
          <Card key={res.id} shadow="xs" padding="md" radius="md" withBorder>
            {/* Header: Kamar & Status */}
            <Group justify="space-between" mb="sm">
              <Group gap="xs">
                <Badge 
                  variant="light" 
                  color={type === 'check-in' ? statusColor : 'gray'} 
                  size="sm"
                  leftSection={type === 'check-in' ? <IconBed size={12}/> : undefined}
                >
                  {type === 'check-in' ? `Room ${res.room?.room_number || '?'} • ${statusLabel}` : `Room ${res.room?.room_number}`}
                </Badge>
              </Group>
              
              <Badge 
                color={res.payment_status === 'paid' ? 'teal' : 'orange'} 
                variant="dot" 
                size="sm"
              >
                {res.payment_status.toUpperCase()}
              </Badge>
            </Group>

            <Divider mb="md" color="gray.1" />

            {/* Guest Info */}
            <Group align="flex-start" wrap="nowrap" mb="md">
              <Avatar color={type === 'check-in' ? 'teal' : 'orange'} radius="md" size="md">
                {res.guest?.full_name?.charAt(0)}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text fw={600} size="sm" lineClamp={1} title={res.guest?.full_name}>
                  {res.guest?.full_name || 'Unknown Guest'}
                </Text>
                <Group gap={6} mt={2}>
                   {res.guest?.loyalty_tier && res.guest.loyalty_tier !== 'Bronze' && (
                      <Badge size="xs" variant="gradient" gradient={{ from: 'violet', to: 'grape' }} leftSection={<IconDiamond size={8}/>}>
                        {res.guest.loyalty_tier}
                      </Badge>
                   )}
                   <Text size="xs" c="dimmed">{res.guest?.email}</Text>
                </Group>
              </div>
            </Group>

            {/* Details Grid */}
            <SimpleGrid cols={2} spacing="xs" mb="lg">
                <Group gap={6} bg="gray.0" p={6} style={{ borderRadius: 6 }}>
                    <IconCalendarTime size={14} color="gray" />
                    <Text size="xs" fw={500}>{nights} Nights</Text>
                </Group>
                <Group gap={6} bg="gray.0" p={6} style={{ borderRadius: 6 }}>
                    <IconCreditCard size={14} color="gray" />
                    <Text size="xs" fw={500}>Rp {res.total_price.toLocaleString()}</Text>
                </Group>
            </SimpleGrid>

            {/* Action Button */}
            <Button 
              fullWidth 
              variant="light"
              color={type === 'check-in' ? 'teal' : 'orange'} 
              size="sm"
              loading={loading}
              onClick={() => onAction(res)}
              disabled={type === 'check-in' && !isRoomReady} // Optional: Prevent check-in if room not ready
            >
              {type === 'check-in' ? 'Check In' : 'Check Out'}
            </Button>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}