// src/app/fo/reservations/client.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Container, Title, Button, Group, Paper, TextInput, Select,
  Box, ThemeIcon, Tabs, Grid, MultiSelect, Text, Badge,
  Stack, ActionIcon, Divider, SegmentedControl, Avatar,
  Tooltip, ScrollArea, Card, Textarea, Menu
} from '@mantine/core';
import { DatePickerInput, DatesProvider, DateValue } from '@mantine/dates';
import 'dayjs/locale/id';
import '@mantine/dates/styles.css';
import { 
  IconPlus, IconSearch, IconCalendarEvent, IconList, IconTimeline,
  IconRobot, IconBolt, IconSparkles, IconBed, IconUser,
  IconPhone, IconMail, IconCheck, IconX, IconDots,
  IconArrowRight, IconTrendingUp, IconChevronRight,
  IconSend, IconAlertCircle, IconCircleCheck
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';

import { ReservationDetails, GuestOption, RoomWithDetails } from './page';

interface ClientProps {
  initialReservations: ReservationDetails[];
  guests: GuestOption[];
  rooms: RoomWithDetails[];
  hotelId: string | null;
}

// ============= MOCK DATA =============
const MOCK_ROOMS = [
  { id: '1', number: '101', type: 'Standard', status: 'available', floor: 1 },
  { id: '2', number: '102', type: 'Standard', status: 'available', floor: 1 },
  { id: '3', number: '103', type: 'Deluxe', status: 'occupied', floor: 1 },
  { id: '4', number: '201', type: 'Suite', status: 'available', floor: 2 },
  { id: '5', number: '202', type: 'Suite', status: 'available', floor: 2 },
  { id: '6', number: '203', type: 'Deluxe', status: 'available', floor: 2 },
  { id: '7', number: '301', type: 'Standard', status: 'cleaning', floor: 3 },
  { id: '8', number: '302', type: 'Deluxe', status: 'available', floor: 3 },
];

const MOCK_RESERVATIONS = [
  { id: 'r1', roomId: '3', roomNumber: '103', guest: 'Budi Santoso', checkIn: '2025-12-01', checkOut: '2025-12-05', status: 'confirmed', color: '#14b8a6' },
  { id: 'r2', roomId: '1', roomNumber: '101', guest: 'Siti Nurhaliza', checkIn: '2025-12-03', checkOut: '2025-12-06', status: 'confirmed', color: '#0891b2' },
  { id: 'r3', roomId: '4', roomNumber: '201', guest: 'Ahmad Yani', checkIn: '2025-12-02', checkOut: '2025-12-04', status: 'pending', color: '#f59e0b' },
  { id: 'r4', roomId: '6', roomNumber: '203', guest: 'Dewi Lestari', checkIn: '2025-12-04', checkOut: '2025-12-08', status: 'confirmed', color: '#14b8a6' },
];

const MOCK_AI_SUGGESTIONS = [
  { id: 's1', type: 'upsell', icon: IconTrendingUp, title: 'Upselling Opportunity', message: 'Tawarkan Suite Room dengan diskon 10% untuk tamu VIP hari ini', priority: 'high' },
  { id: 's2', type: 'alert', icon: IconAlertCircle, title: 'Konflik Jadwal', message: 'Kamar 102 memiliki 2 booking overlapping tanggal 5-6 Des', priority: 'urgent' },
  { id: 's3', type: 'tip', icon: IconSparkles, title: 'Smart Tip', message: 'Lantai 3 kosong 60%, ideal untuk grup/keluarga besar', priority: 'low' },
];

export default function FoReservationsClient({ initialReservations, guests, rooms, hotelId }: ClientProps) {
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [rightPanelMode, setRightPanelMode] = useState<'booking' | 'ai'>('booking');
  
  // Booking Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkInDate, setCheckInDate] = useState<DateValue>(null);
  const [checkOutDate, setCheckOutDate] = useState<DateValue>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  
  // AI Chat State
  const [aiMessages, setAiMessages] = useState([
    { role: 'ai', text: 'Halo! Saya AI Assistant. Ketik perintah seperti "Carikan kamar Deluxe untuk 3 malam" atau tanya saya tentang ketersediaan.' }
  ]);
  const [aiInput, setAiInput] = useState('');
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  // Generate Date Headers (7 days from today)
  const dateHeaders = useMemo(() => {
    const dates = [];
    const today = new Date(2025, 11, 1); // Dec 1, 2025
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  const handleQuickBook = () => {
    if (!guestName || !checkInDate || !checkOutDate || !selectedRoom) {
      notifications.show({
        title: 'Form Tidak Lengkap',
        message: 'Mohon lengkapi semua field',
        color: 'red',
        icon: <IconX size={16} />
      });
      return;
    }
    
    notifications.show({
      title: 'Reservasi Berhasil',
      message: `Booking untuk ${guestName} telah dibuat`,
      color: 'teal',
      icon: <IconCheck size={16} />
    });
    
    // Reset form
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setCheckInDate(null);
    setCheckOutDate(null);
    setSelectedRoom(null);
  };

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    
    setAiMessages(prev => [...prev, { role: 'user', text: aiInput }]);
    
    // Mock AI Response
    setTimeout(() => {
      setAiMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'Saya menemukan 3 kamar Deluxe tersedia. Kamar 203 (Lt.2) dengan view taman sangat cocok. Harga: Rp 850.000/malam. Apakah ingin saya buatkan booking?'
      }]);
    }, 800);
    
    setAiInput('');
  };

  const isRoomOccupied = (roomId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return MOCK_RESERVATIONS.some(res => 
      res.roomId === roomId && 
      dateStr >= res.checkIn && 
      dateStr < res.checkOut
    );
  };

  const getReservationAtDate = (roomId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return MOCK_RESERVATIONS.find(res => 
      res.roomId === roomId && 
      dateStr >= res.checkIn && 
      dateStr < res.checkOut
    );
  };

  if (!hotelId) return null;

  return (
    <DatesProvider settings={{ locale: 'id', firstDayOfWeek: 1, weekendDays: [0] }}>
      <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
        
        {/* Compact Header */}
        <Box style={{ 
          background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', 
          padding: '0.75rem 1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Group justify="space-between">
            <Group gap="sm">
              <ThemeIcon size={36} radius="md" variant="light" color="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <IconBolt size={20} />
              </ThemeIcon>
              <div>
                <Title order={4} c="white" style={{ marginBottom: 2 }}>Smart Reservation Desk</Title>
                <Text size="xs" c="teal.0">Powered by AI Co-Pilot</Text>
              </div>
            </Group>
            
            <Group gap="xs">
              <SegmentedControl
                value={viewMode}
                onChange={(val) => setViewMode(val as any)}
                data={[
                  { label: 'Timeline', value: 'timeline' },
                  { label: 'List', value: 'list' }
                ]}
                size="xs"
                color="teal"
                styles={{
                  root: { background: 'rgba(255,255,255,0.15)' },
                  label: { color: 'white' }
                }}
              />
              <Badge color="yellow" variant="filled" size="sm">8 Kamar Tersedia</Badge>
            </Group>
          </Group>
        </Box>

        {/* Main Content Area - Split View */}
        <Box style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* LEFT PANEL - Main View (68%) */}
          <Box style={{ 
            width: '68%', 
            borderRight: '1px solid #e9ecef',
            display: 'flex',
            flexDirection: 'column',
            background: 'white'
          }}>
            
            {/* Toolbar */}
            <Box p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
              <Group justify="space-between">
                <TextInput
                  placeholder="Cari tamu, nomor kamar..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                  style={{ width: 300 }}
                  size="sm"
                />
                
                <Group gap="xs">
                  <MultiSelect
                    placeholder="Filter Status"
                    data={['confirmed', 'pending', 'cancelled']}
                    value={filterStatus}
                    onChange={setFilterStatus}
                    size="sm"
                    style={{ width: 200 }}
                    clearable
                  />
                  <Button size="sm" variant="light" leftSection={<IconCalendarEvent size={16} />}>
                    Hari Ini
                  </Button>
                </Group>
              </Group>
            </Box>

            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <ScrollArea style={{ flex: 1 }} p="md">
                <Box>
                  {/* Date Headers */}
                  <Group gap={0} mb="xs" wrap="nowrap">
                    <Box style={{ width: 120, flexShrink: 0 }} />
                    {dateHeaders.map((date, idx) => (
                      <Box 
                        key={idx} 
                        style={{ 
                          flex: 1, 
                          textAlign: 'center',
                          padding: '8px',
                          background: idx === 0 ? '#e0f2fe' : 'transparent',
                          borderRadius: 6
                        }}
                      >
                        <Text size="xs" fw={600} c={idx === 0 ? 'cyan.7' : 'dimmed'}>
                          {date.toLocaleDateString('id', { weekday: 'short' }).toUpperCase()}
                        </Text>
                        <Text size="lg" fw={700} c={idx === 0 ? 'cyan.8' : 'dark'}>
                          {date.getDate()}
                        </Text>
                      </Box>
                    ))}
                  </Group>

                  {/* Room Rows */}
                  {MOCK_ROOMS.map((room) => (
                    <Paper key={room.id} mb="xs" p="xs" withBorder radius="md" style={{ background: '#fafafa' }}>
                      <Group gap={0} wrap="nowrap">
                        {/* Room Info */}
                        <Box style={{ width: 120, flexShrink: 0 }} pr="sm">
                          <Group gap={6}>
                            <ThemeIcon size={28} radius="md" variant="light" color={room.status === 'available' ? 'teal' : 'gray'}>
                              <IconBed size={16} />
                            </ThemeIcon>
                            <div>
                              <Text size="sm" fw={600}>{room.number}</Text>
                              <Text size="xs" c="dimmed">{room.type}</Text>
                            </div>
                          </Group>
                        </Box>

                        {/* Date Cells */}
                        {dateHeaders.map((date, idx) => {
                          const reservation = getReservationAtDate(room.id, date);
                          const isOccupied = isRoomOccupied(room.id, date);
                          
                          return (
                            <Tooltip 
                              key={idx} 
                              label={reservation ? `${reservation.guest} (${reservation.status})` : 'Tersedia'}
                              disabled={!reservation}
                            >
                              <Box
                                style={{
                                  flex: 1,
                                  height: 48,
                                  background: reservation ? reservation.color : '#e9ecef',
                                  border: '1px solid #dee2e6',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s',
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.02)';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                {reservation && (
                                  <Text size="xs" c="white" fw={600} style={{ 
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    padding: '0 4px'
                                  }}>
                                    {reservation.guest.split(' ')[0]}
                                  </Text>
                                )}
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Group>
                    </Paper>
                  ))}
                </Box>
              </ScrollArea>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <ScrollArea style={{ flex: 1 }} p="md">
                <Stack gap="xs">
                  {MOCK_RESERVATIONS.map((res) => (
                    <Card key={res.id} padding="md" radius="md" withBorder>
                      <Group justify="space-between">
                        <Group>
                          <Avatar color="teal" radius="xl">
                            {res.guest.charAt(0)}
                          </Avatar>
                          <div>
                            <Text fw={600}>{res.guest}</Text>
                            <Text size="sm" c="dimmed">Kamar {res.roomNumber}</Text>
                          </div>
                        </Group>
                        
                        <Group>
                          <Box ta="right">
                            <Text size="sm" c="dimmed">Check-in</Text>
                            <Text size="sm" fw={600}>{new Date(res.checkIn).toLocaleDateString('id')}</Text>
                          </Box>
                          <IconArrowRight size={16} />
                          <Box ta="right">
                            <Text size="sm" c="dimmed">Check-out</Text>
                            <Text size="sm" fw={600}>{new Date(res.checkOut).toLocaleDateString('id')}</Text>
                          </Box>
                          
                          <Badge color={res.status === 'confirmed' ? 'teal' : 'yellow'}>
                            {res.status}
                          </Badge>
                          
                          <Menu>
                            <Menu.Target>
                              <ActionIcon variant="light" color="gray">
                                <IconDots size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item>Edit</Menu.Item>
                              <Menu.Item color="red">Cancel</Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </ScrollArea>
            )}
          </Box>

          {/* RIGHT PANEL - Action & AI Panel (32%) */}
          <Box style={{ width: '32%', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
            
            {/* Panel Mode Switcher */}
            <Box p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
              <SegmentedControl
                value={rightPanelMode}
                onChange={(val) => setRightPanelMode(val as any)}
                data={[
                  { 
                    label: (
                      <Group gap={6}>
                        <IconBolt size={14} />
                        <span>Quick Book</span>
                      </Group>
                    ),
                    value: 'booking' 
                  },
                  { 
                    label: (
                      <Group gap={6}>
                        <IconRobot size={14} />
                        <span>AI Co-Pilot</span>
                      </Group>
                    ),
                    value: 'ai' 
                  }
                ]}
                fullWidth
                color="teal"
              />
            </Box>

            <ScrollArea style={{ flex: 1 }} p="md">
              {/* BOOKING MODE */}
              {rightPanelMode === 'booking' && (
                <Stack gap="md">
                  <Paper p="md" radius="md" withBorder style={{ background: 'white' }}>
                    <Group gap="xs" mb="md">
                      <ThemeIcon color="teal" variant="light" size="lg">
                        <IconUser size={18} />
                      </ThemeIcon>
                      <Text fw={600} size="sm">Informasi Tamu</Text>
                    </Group>
                    
                    <Stack gap="sm">
                      <TextInput
                        label="Nama Lengkap"
                        placeholder="Nama tamu"
                        value={guestName}
                        onChange={(e) => setGuestName(e.currentTarget.value)}
                        leftSection={<IconUser size={16} />}
                        required
                      />
                      <TextInput
                        label="Telepon"
                        placeholder="+62 xxx"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.currentTarget.value)}
                        leftSection={<IconPhone size={16} />}
                      />
                      <TextInput
                        label="Email"
                        placeholder="email@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.currentTarget.value)}
                        leftSection={<IconMail size={16} />}
                      />
                    </Stack>
                  </Paper>

                  <Paper p="md" radius="md" withBorder style={{ background: 'white' }}>
                    <Group gap="xs" mb="md">
                      <ThemeIcon color="cyan" variant="light" size="lg">
                        <IconCalendarEvent size={18} />
                      </ThemeIcon>
                      <Text fw={600} size="sm">Tanggal & Kamar</Text>
                    </Group>
                    
                    <Stack gap="sm">
                      <DatePickerInput
                        label="Check-in"
                        placeholder="Pilih tanggal"
                        value={checkInDate}
                        onChange={setCheckInDate}
                        required
                      />
                      <DatePickerInput
                        label="Check-out"
                        placeholder="Pilih tanggal"
                        value={checkOutDate}
                        onChange={setCheckOutDate}
                        required
                      />
                      <Select
                        label="Pilih Kamar"
                        placeholder="Kamar tersedia"
                        data={MOCK_ROOMS.filter(r => r.status === 'available').map(r => ({
                          value: r.id,
                          label: `${r.number} - ${r.type}`
                        }))}
                        value={selectedRoom}
                        onChange={setSelectedRoom}
                        leftSection={<IconBed size={16} />}
                        required
                      />
                    </Stack>
                  </Paper>

                  <Button 
                    fullWidth 
                    size="md" 
                    leftSection={<IconCheck size={18} />}
                    onClick={handleQuickBook}
                    gradient={{ from: 'teal', to: 'cyan', deg: 90 }}
                    variant="gradient"
                  >
                    Buat Reservasi
                  </Button>

                  <Divider label="Saran AI" labelPosition="center" />

                  {/* AI Suggestions */}
                  <Stack gap="xs">
                    {MOCK_AI_SUGGESTIONS.map((suggestion) => (
                      <Paper 
                        key={suggestion.id} 
                        p="sm" 
                        radius="md" 
                        withBorder
                        style={{ 
                          background: suggestion.priority === 'urgent' ? '#fef3c7' : 
                                     suggestion.priority === 'high' ? '#dbeafe' : 'white',
                          borderLeft: `3px solid ${suggestion.priority === 'urgent' ? '#f59e0b' : 
                                                    suggestion.priority === 'high' ? '#3b82f6' : '#14b8a6'}`
                        }}
                      >
                        <Group gap="xs" align="flex-start">
                          <ThemeIcon 
                            size="sm" 
                            color={suggestion.priority === 'urgent' ? 'yellow' : 
                                   suggestion.priority === 'high' ? 'blue' : 'teal'}
                            variant="light"
                          >
                            <suggestion.icon size={14} />
                          </ThemeIcon>
                          <div style={{ flex: 1 }}>
                            <Text size="xs" fw={600} mb={2}>{suggestion.title}</Text>
                            <Text size="xs" c="dimmed">{suggestion.message}</Text>
                          </div>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              )}

              {/* AI MODE */}
              {rightPanelMode === 'ai' && (
                <Stack gap="md" style={{ height: '100%' }}>
                  <Paper p="md" radius="md" withBorder style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)' }}>
                    <Group gap="xs">
                      <ThemeIcon size="xl" color="white" variant="light" style={{ background: 'rgba(255,255,255,0.2)' }}>
                        <IconRobot size={24} />
                      </ThemeIcon>
                      <div>
                        <Text c="white" fw={600}>AI Reservation Assistant</Text>
                        <Text c="teal.0" size="xs">Ketik perintah dalam bahasa natural</Text>
                      </div>
                    </Group>
                  </Paper>

                  {/* Chat Messages */}
                  <Stack gap="sm" style={{ flex: 1 }}>
                    {aiMessages.map((msg, idx) => (
                      <Paper 
                        key={idx}
                        p="sm"
                        radius="md"
                        style={{
                          background: msg.role === 'ai' ? 'white' : '#e0f2fe',
                          alignSelf: msg.role === 'ai' ? 'flex-start' : 'flex-end',
                          maxWidth: '85%',
                          border: msg.role === 'ai' ? '1px solid #e9ecef' : 'none'
                        }}
                      >
                        <Group gap="xs" align="flex-start">
                          {msg.role === 'ai' && (
                            <ThemeIcon size="sm" color="teal" variant="light">
                              <IconSparkles size={14} />
                            </ThemeIcon>
                          )}
                          <Text size="sm" style={{ flex: 1 }}>{msg.text}</Text>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>

                  {/* Input */}
                  <Group gap="xs" align="flex-end">
                    <Textarea
                      placeholder="Contoh: Carikan kamar view laut untuk 2 malam..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAiSend();
                        }
                      }}
                      autosize
                      minRows={2}
                      maxRows={4}
                      style={{ flex: 1 }}
                    />
                    <ActionIcon 
                      size={36} 
                      color="teal" 
                      variant="filled"
                      onClick={handleAiSend}
                      disabled={!aiInput.trim()}
                    >
                      <IconSend size={18} />
                    </ActionIcon>
                  </Group>
                </Stack>
              )}
            </ScrollArea>
          </Box>
        </Box>
      </Box>
    </DatesProvider>
  );
}