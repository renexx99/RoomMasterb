// src/app/fo/availability/client.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  TextInput, Select, Box, Badge, ScrollArea, Grid, MultiSelect, Text, Group, Button, Loader, Center, ActionIcon, Popover
} from '@mantine/core';
// Pastikan import ini benar
import { DatePicker } from '@mantine/dates'; 
import '@mantine/dates/styles.css'; 

import { IconSearch, IconFilter, IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import 'dayjs/locale/id'; 

import { AvailabilityTimeline } from './components/AvailabilityTimeline';
import { RoomStatusList } from './components/RoomStatusList'; 
import { getAvailabilityData } from './actions';
import { notifications } from '@mantine/notifications';

interface ClientProps {
  initialRooms: any[];
  initialReservations: any[];
  roomTypes: any[];
  hotelId: string; 
}

export default function FoAvailabilityClient({ initialRooms, initialReservations, roomTypes, hotelId }: ClientProps) {
  // --- STATE ---
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [dataReservations, setDataReservations] = useState(initialReservations);
  const [loading, setLoading] = useState(false);
  const [calendarOpened, setCalendarOpened] = useState(false); 

  // Filter UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  // --- FETCHING DATA BARU ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const start = new Date(currentDate);
        const end = new Date(currentDate);
        end.setDate(end.getDate() + 30); 

        const res = await getAvailabilityData(
          hotelId,
          start.toISOString().split('T')[0],
          end.toISOString().split('T')[0]
        );
        
        setDataReservations(res.reservations);
      } catch (error) {
        notifications.show({ title: 'Error', message: 'Gagal memuat data timeline', color: 'red' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDate, hotelId]);


  // --- LOGIC FILTER ---
  const filteredRooms = useMemo(() => {
    let result = [...initialRooms];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((r) => r.room_number.toLowerCase().includes(lower));
    }
    if (filterType) {
      result = result.filter((r) => r.room_type_id === filterType);
    }
    if (filterStatus.length > 0) {
      result = result.filter((r) => {
        if (filterStatus.includes('ready') && r.status === 'available' && r.cleaning_status === 'clean') return true;
        if (filterStatus.includes('dirty') && r.status === 'available' && r.cleaning_status === 'dirty') return true;
        if (filterStatus.includes('occupied') && r.status === 'occupied') return true;
        if (filterStatus.includes('maintenance') && r.status === 'maintenance') return true;
        return false;
      });
    }
    return result;
  }, [initialRooms, searchTerm, filterType, filterStatus]);

  // Statistik Cepat
  const stats = useMemo(() => ({
    total: filteredRooms.length,
    dirty: filteredRooms.filter(r => r.cleaning_status === 'dirty' && r.status === 'available').length,
    ready: filteredRooms.filter(r => r.cleaning_status === 'clean' && r.status === 'available').length
  }), [filteredRooms]);

  // Navigasi Tanggal
  const handleNext = (days: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + days);
    setCurrentDate(next);
  };

  const handleDateSelect = (val: Date) => {
    setCurrentDate(val);
    setCalendarOpened(false);
  };

  return (
    <Box style={{ height: 'calc(100vh - 60px)', display: 'flex', background: '#f8f9fa' }}>
      
      {/* --- LEFT PANEL: TIMELINE (60%) --- */}
      <Box 
        style={{ 
          width: '60%', 
          display: 'flex', 
          flexDirection: 'column',
          borderRight: '1px solid #e9ecef',
          backgroundColor: 'white'
        }}
      >
        {/* Toolbar Timeline */}
        <Box p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
          <Group justify="space-between" mb="sm">
             <Text fw={700} size="lg" c="dark.4">Ketersediaan Kamar</Text>
             <Group gap="xs">
               <Badge variant="dot" color="teal">Paid</Badge>
               <Badge variant="dot" color="orange">Pending</Badge>
               <Badge variant="light" color="gray">{stats.total} Rooms</Badge>
             </Group>
          </Group>

          {/* Filter Row */}
          <Grid gutter="xs" align="center">
            <Grid.Col span={4}>
              <TextInput
                placeholder="Cari kamar..."
                leftSection={<IconSearch size={14} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                size="xs"
              />
            </Grid.Col>
            
            <Grid.Col span={4}>
              <Select
                placeholder="Tipe Kamar"
                data={roomTypes.map(rt => ({ value: rt.id, label: rt.name }))}
                value={filterType}
                onChange={setFilterType}
                clearable
                size="xs"
              />
            </Grid.Col>
            
            <Grid.Col span={4}>
               <Group gap={4} wrap="nowrap" justify="flex-end">
                  <ActionIcon variant="default" size="sm" onClick={() => handleNext(-7)} aria-label="Minggu Lalu">
                    <IconChevronLeft size={14}/>
                  </ActionIcon>

                  {/* Popover dengan DatePicker */}
                  <Popover 
                    opened={calendarOpened} 
                    onChange={setCalendarOpened} 
                    position="bottom-end" 
                    withArrow 
                    shadow="md"
                  >
                    <Popover.Target>
                      <ActionIcon 
                        variant="default" 
                        size="sm" 
                        onClick={() => setCalendarOpened((o) => !o)}
                        aria-label="Pilih Tanggal"
                      >
                        <IconCalendar size={14}/>
                      </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown p={0}>
                      {/* PERBAIKAN UTAMA:
                         Menggunakan pengecekan 'instanceof Date' agar TypeScript yakin 
                         bahwa nilai yang dikirim ke handleDateSelect adalah Date.
                         Kita gunakan 'any' pada parameter val untuk menghindari error 'string is not assignable'.
                      */}
                      <DatePicker 
                        value={currentDate}
                        onChange={(val: any) => {
                          if (val instanceof Date) {
                            handleDateSelect(val);
                          }
                        }}
                        locale="id"
                        allowDeselect={false}
                      />
                    </Popover.Dropdown>
                  </Popover>
                  
                  <ActionIcon variant="default" size="sm" onClick={() => handleNext(7)} aria-label="Minggu Depan">
                    <IconChevronRight size={14}/>
                  </ActionIcon>
               </Group>
            </Grid.Col>
          </Grid>
        </Box>

        {/* Content Timeline */}
        <ScrollArea style={{ flex: 1 }} bg="gray.0">
          {loading ? (
             <Center h={400}><Loader size="sm" color="teal" /></Center>
          ) : (
             <Box p="md">
               <AvailabilityTimeline 
                  rooms={filteredRooms} 
                  reservations={dataReservations} 
                  currentDate={currentDate}
               />
             </Box>
          )}
        </ScrollArea>
      </Box>

      {/* --- RIGHT PANEL: STATUS LIST (40%) --- */}
      <Box 
        style={{ 
          width: '40%', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Toolbar Status */}
        <Box p="md" style={{ borderBottom: '1px solid #e9ecef', height: 106 }}> 
          <Group justify="space-between" mb="sm">
            <Text fw={700} size="lg" c="dark.4">Housekeeping</Text>
            <Group gap="xs">
                <Badge color="red" variant="light" size="sm">{stats.dirty} Dirty</Badge>
                <Badge color="teal" variant="light" size="sm">{stats.ready} Ready</Badge>
            </Group>
          </Group>
          <MultiSelect
            placeholder="Filter Status (Ready, Dirty...)"
            data={[
              { value: 'ready', label: 'Vacant Ready' },
              { value: 'dirty', label: 'Vacant Dirty' },
              { value: 'occupied', label: 'Occupied' },
              { value: 'maintenance', label: 'Maintenance' },
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            leftSection={<IconFilter size={14} />}
            clearable
            size="xs"
          />
        </Box>

        {/* Content Status List */}
        <ScrollArea style={{ flex: 1 }} p="md" bg="gray.0">
          <RoomStatusList rooms={filteredRooms} />
        </ScrollArea>
      </Box>

    </Box>
  );
}