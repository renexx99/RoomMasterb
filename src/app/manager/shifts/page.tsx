// src/app/manager/shifts/page.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  ActionIcon,
  Button,
  Table,
  Modal,
  Select,
  ThemeIcon,
  Badge,
  Avatar,
  Grid,
  TextInput,
  Center
} from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconSearch,
  IconCalendarTime,
  IconTrash,
  IconClock,
  IconUser,
  IconFilter,
  IconCalendar
} from '@tabler/icons-react';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { notifications } from '@mantine/notifications';
import 'dayjs/locale/id'; // Opsional, sesuaikan dengan locale project

// --- TYPES ---
interface ShiftItem {
  id: string;
  staffName: string;
  role: string;
  date: Date;
  startTime: string; // "07:00"
  endTime: string;   // "15:00"
  status: 'active' | 'upcoming' | 'completed';
  avatarColor: string;
}

// --- MOCK DATA ---
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const mockShifts: ShiftItem[] = [
  {
    id: 'sh_1',
    staffName: 'Sarah Jenkins',
    role: 'Front Desk Agent',
    date: today,
    startTime: '07:00',
    endTime: '15:00',
    status: 'active',
    avatarColor: 'cyan',
  },
  {
    id: 'sh_2',
    staffName: 'Michael Wong',
    role: 'Housekeeping',
    date: today,
    startTime: '08:00',
    endTime: '16:00',
    status: 'active',
    avatarColor: 'orange',
  },
  {
    id: 'sh_3',
    staffName: 'David Chen',
    role: 'Concierge',
    date: today,
    startTime: '09:00',
    endTime: '17:00',
    status: 'active',
    avatarColor: 'blue',
  },
  {
    id: 'sh_4',
    staffName: 'Jessica Lee',
    role: 'Front Desk Agent',
    date: today,
    startTime: '15:00',
    endTime: '23:00',
    status: 'upcoming',
    avatarColor: 'pink',
  },
  {
    id: 'sh_5',
    staffName: 'Robert Smith',
    role: 'Security',
    date: tomorrow,
    startTime: '23:00',
    endTime: '07:00',
    status: 'upcoming',
    avatarColor: 'gray',
  },
];

const ROLES = ['Front Desk Agent', 'Housekeeping', 'Concierge', 'Security', 'Manager'];

function ShiftsContent() {
  const MAX_WIDTH = 1200;

  // State
  const [shifts, setShifts] = useState<ShiftItem[]>(mockShifts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(today);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const form = useForm<{
    staffName: string;
    role: string;
    date: Date;
    startTime: string;
    endTime: string;
  }>({
    initialValues: {
      staffName: '',
      role: '',
      date: new Date(),
      startTime: '',
      endTime: '',
    },
    validate: {
      staffName: (val) => (val ? null : 'Staff name is required'),
      role: (val) => (val ? null : 'Role is required'),
      date: (val) => (val ? null : 'Date is required'),
      startTime: (val) => (val ? null : 'Start time required'),
      endTime: (val) => (val ? null : 'End time required'),
    },
  });

  // Filter Logic
  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      const matchSearch = shift.staffName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = filterRole ? shift.role === filterRole : true;
      const matchDate = filterDate 
        ? shift.date.toDateString() === filterDate.toDateString() 
        : true;

      return matchSearch && matchRole && matchDate;
    });
  }, [shifts, searchTerm, filterRole, filterDate]);

  // Handlers
  const handleAddShift = (values: typeof form.values) => {
    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      const newShift: ShiftItem = {
        id: Math.random().toString(),
        staffName: values.staffName,
        role: values.role,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        status: 'upcoming',
        avatarColor: 'blue', // Default
      };
      
      setShifts((prev) => [newShift, ...prev]);
      notifications.show({ title: 'Success', message: 'Shift added successfully', color: 'green' });
      setIsSubmitting(false);
      closeModal();
      form.reset();
    }, 600);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this shift?')) {
      setShifts((prev) => prev.filter((s) => s.id !== id));
      notifications.show({ title: 'Deleted', message: 'Shift removed', color: 'gray' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { color: 'green', label: 'Active Now' };
      case 'upcoming': return { color: 'blue', label: 'Upcoming' };
      case 'completed': return { color: 'gray', label: 'Completed' };
      default: return { color: 'gray', label: status };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '2rem' }}>
      
      {/* 1. Header (Clean Style) */}
      <div style={{ 
        background: 'white', 
        borderBottom: '1px solid #e9ecef', 
        padding: '1rem 0' 
      }}>
        <Container size="xl" maw={MAX_WIDTH}>
          <Group justify="space-between">
            <Group gap="sm">
              <ThemeIcon variant="light" color="indigo" size="lg" radius="md">
                <IconCalendarTime size={20} stroke={1.5} />
              </ThemeIcon>
              <div>
                <Title order={4} c="dark.8">Staff Shifts</Title>
                <Text size="xs" c="dimmed">Manage daily schedules and rosters</Text>
              </div>
            </Group>
            <Button 
              leftSection={<IconPlus size={16} />} 
              onClick={openModal}
              color="indigo"
              size="sm"
              radius="md"
            >
              Add Shift
            </Button>
          </Group>
        </Container>
      </div>

      {/* 2. Content */}
      <Container size="xl" maw={MAX_WIDTH} mt="lg">
        <Stack gap="md">
          
          {/* Filters Panel */}
          <Paper p="sm" radius="md" withBorder shadow="sm">
            <Grid align="flex-end" gutter="sm">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Search Staff"
                  placeholder="Name..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <Select
                  label="Role"
                  placeholder="All Roles"
                  data={ROLES}
                  value={filterRole}
                  onChange={setFilterRole}
                  clearable
                  leftSection={<IconFilter size={16} />}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <DatePickerInput
                  type="default"
                  value={filterDate}
                  onChange={(val) => setFilterDate(val)}
                  label="Date"
                  placeholder="Filter by date"
                  clearable
                  leftSection={<IconCalendar size={16} />}
                  valueFormat="DD MMM YYYY"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 2 }}>
                <Button 
                  variant="light" 
                  color="gray" 
                  fullWidth 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRole(null);
                    setFilterDate(today);
                  }}
                >
                  Reset
                </Button>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Data Table */}
          <Paper shadow="sm" radius="md" withBorder>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th>Staff Member</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Shift Time</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th ta="center" style={{ width: 80 }}>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredShifts.length > 0 ? filteredShifts.map((shift) => {
                  const statusInfo = getStatusBadge(shift.status);
                  return (
                    <Table.Tr key={shift.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar color={shift.avatarColor} radius="xl" size="sm">
                            {shift.staffName.charAt(0)}
                          </Avatar>
                          <Text fw={500} size="sm">{shift.staffName}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline" color="gray" size="sm" radius="sm">
                          {shift.role}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6}>
                          <IconClock size={14} color="gray" />
                          <Text size="sm">{shift.startTime} - {shift.endTime}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                         <Text size="sm" c="dimmed">
                            {shift.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                         </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={statusInfo.color} variant="light" size="sm">
                          {statusInfo.label}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon 
                          color="red" 
                          variant="subtle" 
                          onClick={() => handleDelete(shift.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  );
                }) : (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Center py="xl">
                         <Stack align="center" gap="xs">
                            <IconCalendarTime size={40} stroke={1.5} color="var(--mantine-color-gray-5)" />
                            <Text size="sm" c="dimmed">No shifts found for this criteria.</Text>
                         </Stack>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>

        </Stack>
      </Container>

      {/* 3. Modal Form */}
      <Modal 
        opened={modalOpened} 
        onClose={closeModal} 
        title="Add New Shift" 
        centered
        radius="md"
      >
        <form onSubmit={form.onSubmit(handleAddShift)}>
          <Stack gap="md">
            <TextInput
              label="Staff Name"
              placeholder="e.g. John Doe"
              leftSection={<IconUser size={16} />}
              required
              {...form.getInputProps('staffName')}
            />
            <Select
              label="Role"
              placeholder="Select role"
              data={ROLES}
              required
              {...form.getInputProps('role')}
            />
            <DatePickerInput
              label="Date"
              placeholder="Select date"
              minDate={new Date()}
              required
              leftSection={<IconCalendar size={16} />}
              {...form.getInputProps('date')}
            />
            <Group grow>
              <TimeInput 
                label="Start Time" 
                required 
                {...form.getInputProps('startTime')} 
              />
              <TimeInput 
                label="End Time" 
                required 
                {...form.getInputProps('endTime')} 
              />
            </Group>
            
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={closeModal} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" color="indigo" loading={isSubmitting}>Create Shift</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

    </div>
  );
}

export default function ManagerShiftsPage() {
  return (
    <ProtectedRoute requiredRoleName="Hotel Manager">
      <ShiftsContent />
    </ProtectedRoute>
  );
}