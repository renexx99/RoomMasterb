// src/app/fo/log/components/LogTimeline.tsx
'use client';

import { 
  Paper, Center, Stack, Text, Card, Group, Box, Title, Badge, 
  Divider, Textarea, Button, ScrollArea, Timeline 
} from '@mantine/core';
import { 
  IconMessagePlus, IconBed, IconCalendarEvent, IconClock, IconUser 
} from '@tabler/icons-react';
import { ReservationDetails } from '../page';

// Tipe lokal untuk log (karena belum ada di DB)
export interface LogEntry {
  id: string;
  timestamp: Date;
  entry: string;
  staffName: string;
}

interface Props {
  selectedReservation: ReservationDetails | null;
  logs: LogEntry[];
  newLogEntry: string;
  onNewLogChange: (val: string) => void;
  onAddLog: () => void;
  isSubmitting: boolean;
}

export function LogTimeline({ 
  selectedReservation, 
  logs, 
  newLogEntry, 
  onNewLogChange, 
  onAddLog,
  isSubmitting 
}: Props) {
  
  if (!selectedReservation) {
    return (
      <Paper shadow="sm" radius="md" withBorder p="lg" h="100%">
        <Center h="100%">
          <Stack align="center" gap="xs">
            <IconMessagePlus size={48} stroke={1.5} color="var(--mantine-color-gray-4)" />
            <Text c="dimmed" size="lg" fw={500}>Pilih Tamu</Text>
            <Text c="dimmed" ta="center" maw={300} size="sm">
              Pilih tamu dari daftar di sebelah kiri untuk melihat atau menambah log komunikasi.
            </Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header Info Tamu */}
      <Card p="md" radius="md" withBorder bg="gray.0" mb="md">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Group gap="xs" mb={4}>
                <Title order={4}>{selectedReservation.guest?.full_name}</Title>
                <Badge variant="light" color="teal" size="sm">In-House</Badge>
            </Group>
            <Group gap="md">
              <Group gap={4}>
                <IconBed size={14} color="gray" />
                <Text size="sm" c="dimmed">
                  {selectedReservation.room?.room_number} ({selectedReservation.room?.room_type?.name})
                </Text>
              </Group>
              <Group gap={4}>
                <IconCalendarEvent size={14} color="gray" />
                <Text size="sm" c="dimmed">
                  Check-out: {new Date(selectedReservation.check_out_date).toLocaleDateString('id-ID')}
                </Text>
              </Group>
            </Group>
          </Box>
        </Group>
      </Card>

      {/* Input Log */}
      <Stack gap="xs" mb="md">
        <Text size="sm" fw={500}>Tambah Catatan Baru</Text>
        <Textarea
          placeholder="Masukkan permintaan tamu, keluhan, atau catatan penting..."
          autosize
          minRows={2}
          maxRows={4}
          value={newLogEntry}
          onChange={(e) => onNewLogChange(e.currentTarget.value)}
        />
        <Group justify="flex-end">
            <Button
            size="xs"
            color="teal"
            leftSection={<IconMessagePlus size={16} />}
            onClick={onAddLog}
            loading={isSubmitting}
            disabled={!newLogEntry.trim()}
            >
            Simpan Catatan
            </Button>
        </Group>
      </Stack>

      <Divider label="Riwayat Log" labelPosition="left" mb="md" />

      {/* Timeline Scrollable */}
      <ScrollArea type="auto" offsetScrollbars style={{ flex: 1 }}>
        {logs.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed" size="sm">Belum ada log untuk tamu ini.</Text>
          </Center>
        ) : (
          <Timeline active={0} bulletSize={24} lineWidth={2} color="teal">
            {logs.map((log) => (
              <Timeline.Item
                key={log.id}
                bullet={<IconUser size={12} />}
                title={
                    <Group justify="space-between">
                        <Text size="sm" fw={600}>{log.staffName}</Text>
                        <Group gap={4}>
                            <IconClock size={12} color="gray" />
                            <Text size="xs" c="dimmed">
                                {log.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </Group>
                    </Group>
                }
              >
                <Text c="dark.3" size="sm" mt={4}>{log.entry}</Text>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </ScrollArea>
    </Paper>
  );
}