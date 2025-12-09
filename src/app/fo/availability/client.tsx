// src/app/fo/availability/client.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  TextInput, Paper, Select, Box, Badge, ScrollArea, Grid, MultiSelect, Text, Group
} from '@mantine/core';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { AvailabilityTimeline } from './components/AvailabilityTimeline';
import { RoomStatusList } from './components/RoomStatusList';

interface ClientProps {
  initialRooms: any[];
  initialReservations: any[];
  roomTypes: any[];
}

export default function FoAvailabilityClient({ initialRooms, initialReservations, roomTypes }: ClientProps) {
  // State Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  // Filter Logic
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

  // Statistik Cepat untuk Header Panel
  const stats = useMemo(() => ({
    total: filteredRooms.length,
    dirty: filteredRooms.filter(r => r.cleaning_status === 'dirty' && r.status === 'available').length,
    ready: filteredRooms.filter(r => r.cleaning_status === 'clean' && r.status === 'available').length
  }), [filteredRooms]);

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
        {/* Toolbar Kiri */}
        <Box p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
          <Group justify="space-between" mb="xs">
            <Text fw={600} size="lg">Timeline Ketersediaan</Text>
            <Badge variant="light" color="blue">{stats.total} Kamar</Badge>
          </Group>
          <Grid gutter="xs">
            <Grid.Col span={6}>
              <TextInput
                placeholder="Cari nomor kamar..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                size="sm"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                placeholder="Tipe Kamar"
                data={roomTypes.map(rt => ({ value: rt.id, label: rt.name }))}
                value={filterType}
                onChange={setFilterType}
                clearable
                size="sm"
              />
            </Grid.Col>
          </Grid>
        </Box>

        {/* Content Kiri */}
        <ScrollArea style={{ flex: 1 }} p="md">
          <AvailabilityTimeline 
            rooms={filteredRooms} 
            reservations={initialReservations} 
          />
        </ScrollArea>
      </Box>

      {/* --- RIGHT PANEL: STATUS LIST (40%) --- */}
      <Box 
        style={{ 
          width: '40%', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#fafafa' // Sedikit beda warna untuk pemisah visual
        }}
      >
        {/* Toolbar Kanan */}
        <Box p="md" style={{ borderBottom: '1px solid #e9ecef', backgroundColor: 'white' }}>
          <Group justify="space-between" mb="xs">
            <Text fw={600} size="lg">Status Kebersihan</Text>
            <Group gap="xs">
                <Badge color="red" variant="dot" size="sm">{stats.dirty} Dirty</Badge>
                <Badge color="teal" variant="dot" size="sm">{stats.ready} Ready</Badge>
            </Group>
          </Group>
          <MultiSelect
            placeholder="Filter Status (Ready, Dirty, Occupied...)"
            data={[
              { value: 'ready', label: 'Vacant Ready' },
              { value: 'dirty', label: 'Vacant Dirty' },
              { value: 'occupied', label: 'Occupied' },
              { value: 'maintenance', label: 'Maintenance' },
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            leftSection={<IconFilter size={16} />}
            clearable
            size="sm"
          />
        </Box>

        {/* Content Kanan */}
        <ScrollArea style={{ flex: 1 }} p="md">
          <RoomStatusList rooms={filteredRooms} />
        </ScrollArea>
      </Box>

    </Box>
  );
}