// src/app/fo/log/client.tsx
'use client';

import { useState, useMemo } from 'react';
import { Container, Group, Box, ThemeIcon, Title, ActionIcon, Text, Grid } from '@mantine/core';
import { IconArrowLeft, IconBook2 } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ReservationDetails } from './page';
import { GuestListSidebar } from './components/GuestListSidebar';
import { LogTimeline, LogEntry } from './components/LogTimeline';
import { createLogEntry } from './actions';

interface ClientProps {
  initialReservations: ReservationDetails[];
}

export default function GuestLogClient({ initialReservations }: ClientProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const MAX_WIDTH = 1200;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<ReservationDetails | null>(null);
  
  // Mock Logs State (Karena belum ada DB)
  // Pada implementasi nyata, ini akan di-fetch dari DB berdasarkan reservation_id
  const [mockLogs, setMockLogs] = useState<LogEntry[]>([]);
  const [newLogEntry, setNewLogEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter Reservasi
  const filteredReservations = useMemo(() => {
    if (!searchTerm) return initialReservations;
    const lower = searchTerm.toLowerCase();
    return initialReservations.filter(r => 
      r.guest?.full_name?.toLowerCase().includes(lower) ||
      r.room?.room_number?.toLowerCase().includes(lower)
    );
  }, [initialReservations, searchTerm]);

  // Handler Select Tamu
  const handleSelectReservation = (res: ReservationDetails) => {
    setSelectedReservation(res);
    setNewLogEntry('');
    // Reset logs dummy setiap ganti tamu (Simulasi fetch baru)
    setMockLogs([
        { id: '1', timestamp: new Date(Date.now() - 3600000), entry: 'Tamu check-in dan meminta password wifi.', staffName: 'System' },
    ]); 
  };

  // Handler Add Log
  const handleAddLog = async () => {
    if (!selectedReservation || !newLogEntry.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Panggil Server Action (meskipun mock)
      await createLogEntry({
        reservation_id: selectedReservation.id,
        staff_id: profile?.id || 'unknown',
        message: newLogEntry
      });

      // Update UI State
      const newLog: LogEntry = {
        id: Math.random().toString(),
        timestamp: new Date(),
        entry: newLogEntry,
        staffName: profile?.full_name || 'Staff',
      };
      
      setMockLogs(prev => [newLog, ...prev]);
      setNewLogEntry('');
      
      notifications.show({ title: 'Berhasil', message: 'Catatan log ditambahkan', color: 'teal' });
    } catch (error) {
      notifications.show({ title: 'Gagal', message: 'Terjadi kesalahan', color: 'red' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header Ramping */}
      <div style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', padding: '0.75rem 0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <Container fluid px="lg">
          <Box maw={MAX_WIDTH} mx="auto">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <ThemeIcon variant="light" color="white" size="lg" radius="md" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                  <IconBook2 size={20} stroke={1.5} />
                </ThemeIcon>
                <div style={{ lineHeight: 1 }}>
                  <Title order={4} c="white" style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>Log Tamu</Title>
                  <Text c="white" opacity={0.8} size="xs" mt={2}>Pencatatan aktivitas & permintaan tamu</Text>
                </div>
              </Group>
              <ActionIcon variant="white" color="teal" size="lg" radius="md" onClick={() => router.push('/fo/dashboard')} aria-label="Kembali">
                <IconArrowLeft size={20} />
              </ActionIcon>
            </Group>
          </Box>
        </Container>
      </div>

      {/* Konten Utama */}
      <Container fluid px="lg" py="md" h="calc(100vh - 60px)">
        <Box maw={MAX_WIDTH} mx="auto" h="100%">
          <Grid gutter="md" h="100%">
            <Grid.Col span={{ base: 12, md: 4 }} h="100%">
              <GuestListSidebar 
                reservations={filteredReservations}
                selectedId={selectedReservation?.id || null}
                onSelect={handleSelectReservation}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8 }} h="100%">
              <LogTimeline 
                selectedReservation={selectedReservation}
                logs={mockLogs}
                newLogEntry={newLogEntry}
                onNewLogChange={setNewLogEntry}
                onAddLog={handleAddLog}
                isSubmitting={isSubmitting}
              />
            </Grid.Col>
          </Grid>
        </Box>
      </Container>
    </div>
  );
}