// src/components/ReservationChart/ReservationTapeChart.tsx
'use client';

import { useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { Paper, Text, Badge, Group, Avatar, Tooltip, Box } from '@mantine/core';
// HAPUS import ini:
// import { RoomWithDetails, ReservationDetails } from '@/app/fo/reservations/page';
// GANTI dengan import base type dari database:
import { Room, RoomType, Reservation, Guest } from '@/core/types/database';

// Buat Interface Lokal yang lebih fleksibel (bisa terima null/undefined)
export interface ChartRoom extends Room {
  room_type?: RoomType | null;
}

export interface ChartReservation extends Reservation {
  guest?: Pick<Guest, 'id' | 'full_name' | 'email'> | null;
}

interface Props {
  rooms: ChartRoom[];
  reservations: ChartReservation[];
  onEventClick?: (id: string) => void;
}

const ReservationTapeChart = ({ rooms, reservations, onEventClick }: Props) => {
  const calendarRef = useRef<FullCalendar>(null);

  // 1. Transform Data Rooms ke format FullCalendar Resource
  const resources = useMemo(() => {
    return rooms.map(room => ({
      id: room.id,
      title: room.room_number,
      extendedProps: {
        type: room.room_type?.name,
        price: room.room_type?.price_per_night,
        status: room.status
      }
    }));
  }, [rooms]);

  // 2. Transform Data Reservasi ke format FullCalendar Event
  const events = useMemo(() => {
    return reservations.map(res => {
      let color = '#6366f1'; // Default Indigo
      if (res.payment_status === 'paid') color = '#10b981'; // Green
      if (res.payment_status === 'pending') color = '#f59e0b'; // Orange
      if (res.payment_status === 'cancelled') color = '#ef4444'; // Red

      return {
        id: res.id,
        resourceId: res.room_id,
        title: res.guest?.full_name || 'Unknown Guest',
        start: res.check_in_date, 
        end: res.check_out_date,
        backgroundColor: color,
        extendedProps: {
          status: res.payment_status,
          email: res.guest?.email
        }
      };
    });
  }, [reservations]);

  // 3. Custom Render untuk Label Kamar (Sebelah Kiri)
  const renderResourceLabel = (info: any) => {
    const { type, status } = info.resource.extendedProps;
    const statusColor = status === 'available' ? 'teal' : status === 'dirty' ? 'yellow' : 'red';
    
    return (
      <Group wrap="nowrap" gap="xs" w="100%" justify='space-between'>
        <Box>
            <Text size="sm" fw={700} c="dark.4">{info.resource.title}</Text>
            <Text size="xs" c="dimmed">{type}</Text>
        </Box>
        <Badge size="xs" variant="dot" color={statusColor} />
      </Group>
    );
  };

  // 4. Custom Render untuk Event Bar (Kotak Reservasi)
  const renderEventContent = (info: any) => {
    const guestName = info.event.title;
    
    return (
      <Tooltip label={`${guestName} (${info.event.extendedProps.status})`} withArrow>
        <div style={{ 
            width: '100%', height: '100%', 
            display: 'flex', alignItems: 'center', 
            padding: '0 8px', gap: '6px', overflow: 'hidden' 
        }}>
          <Avatar size="xs" radius="xl" color="white" variant="filled">
            {guestName.charAt(0)}
          </Avatar>
          <Text size="xs" c="white" fw={500} truncate>{guestName}</Text>
        </div>
      </Tooltip>
    );
  };

  return (
    <Paper shadow="sm" radius="md" withBorder p={0} style={{ overflow: 'hidden' }}>
      <style jsx global>{`
        .fc-license-message { display: none; }
        .fc-scrollgrid { border: none !important; }
        .fc-col-header-cell { background: #f9fafb; padding: 8px 0; }
      `}</style>
      
      <FullCalendar
        ref={calendarRef}
        schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
        plugins={[resourceTimelinePlugin, interactionPlugin]}
        initialView="resourceTimelineWeek"
        headerToolbar={{
          left: 'today prev,next',
          center: 'title',
          right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth',
        }}
        views={{
            resourceTimelineDay: { buttonText: 'Harian', slotDuration: '02:00' },
            resourceTimelineWeek: { buttonText: 'Mingguan', slotDuration: '12:00' },
            resourceTimelineMonth: { buttonText: 'Bulanan' }
        }}
        resources={resources}
        events={events}
        resourceAreaWidth="220px"
        resourceAreaHeaderContent="Kamar"
        resourceLabelContent={renderResourceLabel}
        eventContent={renderEventContent}
        eventClick={(info) => onEventClick && onEventClick(info.event.id)}
        height="auto"
        contentHeight="auto"
        aspectRatio={1.8}
        slotMinWidth={50}
        nowIndicator={true}
        stickyHeaderDates={true}
      />
    </Paper>
  );
};

export default ReservationTapeChart;