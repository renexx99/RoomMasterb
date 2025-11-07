// src/components/ReservationChart/ReservationTapeChart.tsx
'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid'; // Dependensi
import timeGridPlugin from '@fullcalendar/timegrid'; // Dependensi
import { Center, Loader, Paper, Text } from '@mantine/core';

// Tipe data sederhana untuk mock
interface RoomResource {
  id: string;
  title: string; // "title" digunakan oleh FullCalendar untuk resource
}

interface ReservationEvent {
  id: string;
  resourceId: string; // Menghubungkan ke RoomResource.id
  title: string; // Nama tamu
  start: string; // Tgl Check-in
  end: string; // Tgl Check-out
}

/**
 * Komponen ReservationTapeChart
 * Menampilkan timeline reservasi berbasis sumber daya (kamar).
 */
export function ReservationTapeChart() {
  const [resources, setResources] = useState<RoomResource[]>([]);
  const [events, setEvents] = useState<ReservationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [roomsRes, reservationsRes] = await Promise.all([
          fetch('/mocks/pms-rooms.json'),
          fetch('/mocks/pms-reservations.json'),
        ]);

        if (!roomsRes.ok || !reservationsRes.ok) {
          throw new Error('Gagal mengambil data mock');
        }

        const roomsData: RoomResource[] = await roomsRes.json();
        const reservationsData: ReservationEvent[] =
          await reservationsRes.json();

        setResources(roomsData);
        setEvents(reservationsData);
      } catch (err: any) {
        console.error('Error fetching mock data:', err);
        setError(err.message || 'Terjadi kesalahan saat memuat chart');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Center style={{ minHeight: 400 }}>
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Center style={{ minHeight: 400 }}>
        <Text color="red">Error: {error}</Text>
      </Center>
    );
  }

  return (
    <Paper shadow="sm" radius="md" p="md" withBorder>
      {/* Catatan Lisensi:
        'resourceTimeline' adalah fitur premium. 
        FullCalendar menyediakan lisensi GPL untuk proyek open-source.
        Jika proyek Anda bukan open-source, Anda memerlukan lisensi komersial.
      */}
      <FullCalendar
        schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
        plugins={[
          resourceTimelinePlugin,
          interactionPlugin,
          dayGridPlugin,
          timeGridPlugin,
        ]}
        initialView="resourceTimelineWeek"
        
        // Sembunyikan header bawaan seperti yang diminta
        headerToolbar={false}
        
        // Tampilkan 'Kamar' di header area sumber daya
        resourceAreaHeaderContent="Kamar"
        
        // Muat data resources (kamar) dan events (reservasi)
        resources={resources}
        events={events}
        
        // Izinkan event (reservasi) untuk di-drag/drop
        editable={true}
        
        // Pengaturan Tampilan
        aspectRatio={1.8}
        slotMinWidth={100} // Lebar minimum untuk satu hari
        locale="id" // Gunakan bahasa Indonesia
      />
    </Paper>
  );
}

export default ReservationTapeChart;