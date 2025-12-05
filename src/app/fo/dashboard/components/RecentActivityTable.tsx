'use client';

import { Table, Badge, Card, Text, Group, Avatar, ActionIcon, Menu, Button } from '@mantine/core';
import { IconDots, IconFileInvoice, IconUser } from '@tabler/icons-react';

// Tipe Data Dummy (Sesuaikan dengan data dari Supabase nanti)
interface Reservation {
  id: string; // ID asli
  product: string; // Room Name
  guest: string; // Full Name
  total: number; // Amount
  payment_method: string;
  status: string; // 'confirmed' | 'pending' | 'shipped' etc from mock
  date: string; // Check-in Date
}

interface Props {
  data: Reservation[];
}

export function RecentActivityTable({ data }: Props) {
  // --- Business Logic Mappers ---
  
  const mapStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'confirmed' || s === 'paid') return 'Paid'; 
    if (s === 'pending') return 'Booked / Tentative';
    if (s === 'checked-in' || s === 'processing') return 'In-House';
    if (s === 'cancelled') return 'Cancelled';
    return 'DP'; // Default fallback or specifically 'shipped' from mock
  };

  const mapStatusColor = (label: string) => {
    switch (label) {
      case 'Paid': return 'green';
      case 'In-House': return 'blue';
      case 'Booked / Tentative': return 'yellow';
      case 'DP': return 'teal';
      case 'Cancelled': return 'red';
      default: return 'gray';
    }
  };

  // Randomizer Title (Mocking Mr/Mrs)
  const getGuestTitle = (name: string) => {
    return Math.random() > 0.5 ? `Mr. ${name}` : `Mrs. ${name}`;
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
            <Table.Th>Guest Folio</Table.Th>
            <Table.Th>Guest Name</Table.Th>
            <Table.Th>Room</Table.Th>
            <Table.Th>Expected Arrival</Table.Th>
            <Table.Th>Payment</Table.Th>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((item) => {
            const displayStatus = mapStatusLabel(item.status);
            const colorStatus = mapStatusColor(displayStatus);
            
            return (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Text fw={500} size="sm">#{item.id.substring(0, 8).toUpperCase()}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Avatar size="sm" radius="xl" color="teal"><IconUser size={14} /></Avatar>
                    <Text size="sm" fw={500}>{getGuestTitle(item.guest || 'Guest')}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{item.product}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">{item.date}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <IconFileInvoice size={14} color="gray" />
                    <Text size="sm">{item.payment_method}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600}>${item.total}</Text> 
                  {/* Gunakan mata uang sesuai mock ($) atau IDR nanti */}
                </Table.Td>
                <Table.Td>
                  <Badge color={colorStatus} variant="light" size="sm">
                    {displayStatus}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Menu position="bottom-end" withArrow>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray"><IconDots size={16} /></ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item>View Folio</Menu.Item>
                      <Menu.Item>Edit Booking</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Card>
  );
}