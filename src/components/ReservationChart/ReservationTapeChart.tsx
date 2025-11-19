// src/components/ReservationChart/ReservationTapeChart.tsx
'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { Paper, Title, Loader, Center, Text } from '@mantine/core';

interface RoomResource {
  id: string;
  title: string;
  type?: string;
}

const ReservationTapeChart = () => {
  const [roomData, setRoomData] = useState<RoomResource[]>([]);
  const [eventData, setEventData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [roomRes, eventRes] = await Promise.all([
          fetch('/mocks/pms-rooms.json'),
          fetch('/mocks/pms-reservations.json'),
        ]);

        if (!roomRes.ok || !eventRes.ok) {
          throw new Error('Gagal memuat data mock');
        }

        const rooms = await roomRes.json();
        const events = await eventRes.json();

        setRoomData(rooms);
        setEventData(events);
      } catch (err: any) {
        console.error('Error fetching timeline data:', err);
        setError(err.message || 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Center style={{ minHeight: 200 }}>
          <Loader />
        </Center>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Center style={{ minHeight: 200 }}>
          <Text c="red">Error: {error}</Text>
        </Center>
      </Paper>
    );
  }

  return (
    // --- [MODIFIKASI] ---
    // Bungkus dengan Paper agar konsisten
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Title order={3} mb="md">
        Visual Tape Chart
      </Title>
      <FullCalendar
        schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
        plugins={[resourceTimelinePlugin, interactionPlugin]}
        events={eventData}
        resources={roomData}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'resourceTimelineTenDay,resourceTimelineMonth',
        }}
        initialView="resourceTimelineTenDay"
        views={{
          resourceTimelineTenDay: {
            type: 'resourceTimeline',
            duration: { days: 10 },
            buttonText: '10 Hari',
          },
          resourceTimelineMonth: {
            type: 'resourceTimeline',
            duration: { months: 1 },
            buttonText: 'Bulan',
          },
        }}
        resourceAreaHeaderContent="Kamar"
        editable={true}
        selectable={true}
        // --- [PENAMBAHAN OPTIMASI] ---
        height="auto" // Biarkan tinggi kalender menyesuaikan konten
        stickyHeaderDates={true} // Buat header tanggal menempel saat scroll
        eventDisplay="block" // Tampilkan event sebagai block solid
        eventMinHeight={40} // Tinggi minimal event agar mudah dilihat
        slotMinWidth={60} // Lebar minimal kolom hari
        // --- [AKHIR PENAMBAHAN] ---
      />
    </Paper>
    // --- [AKHIR MODIFIKASI] ---
  );
};

export default ReservationTapeChart;