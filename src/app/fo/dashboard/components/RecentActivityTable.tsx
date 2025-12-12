// src/app/fo/dashboard/components/RecentActivityTable.tsx
'use client';

import { Table, Badge, Card, Text, Group, Avatar, ActionIcon, Menu, Button } from '@mantine/core';
import { IconDots, IconFileInvoice, IconUser, IconCalendar } from '@tabler/icons-react';
import { ReservationDetails } from '../../reservations/page';

interface Props {
  data: ReservationDetails[];
  onViewInvoice: (res: ReservationDetails) => void;
}

export function RecentActivityTable({ data, onViewInvoice }: Props) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'orange';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="sm" fw={700}>Recent Activity</Text>
          <Text size="xs" c="dimmed">Latest reservations and check-ins</Text>
        </div>
        <Button variant="light" color="teal" size="sm">View All</Button>
      </Group>

      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Folio ID</Table.Th>
            <Table.Th>Guest</Table.Th>
            <Table.Th>Room</Table.Th>
            <Table.Th>Check-in Date</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td>
                <Text fw={500} size="sm" ff="monospace">#{item.id.substring(0, 8).toUpperCase()}</Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Avatar size="sm" radius="xl" color="teal">
                    {item.guest?.full_name?.charAt(0)}
                  </Avatar>
                  <Text size="sm" fw={500}>{item.guest?.full_name || 'Unknown'}</Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm">
                  {item.room?.room_number || '-'} <Text span size="xs" c="dimmed">({item.room?.room_type?.name})</Text>
                </Text>
              </Table.Td>
              <Table.Td>
                 <Group gap={6}>
                    <IconCalendar size={14} color="gray" />
                    <Text size="sm" c="dimmed">
                        {new Date(item.check_in_date).toLocaleDateString('en-GB')}
                    </Text>
                 </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm" fw={600}>Rp {item.total_price.toLocaleString('id-ID')}</Text>
              </Table.Td>
              <Table.Td>
                <Badge color={getStatusColor(item.payment_status)} variant="light" size="sm" tt="capitalize">
                  {item.payment_status}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Menu position="bottom-end" withArrow>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray"><IconDots size={16} /></ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {/* Mengganti View Folio ke View Invoice */}
                    <Menu.Item leftSection={<IconFileInvoice size={14}/>} onClick={() => onViewInvoice(item)}>
                        View Invoice
                    </Menu.Item>
                    <Menu.Item>Edit Booking</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Table.Td>
            </Table.Tr>
          ))}
          {data.length === 0 && (
            <Table.Tr>
                <Table.Td colSpan={7}>
                    <Text ta="center" c="dimmed" py="md">No recent activity found</Text>
                </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Card>
  );
}