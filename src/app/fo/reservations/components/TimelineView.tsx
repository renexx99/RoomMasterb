// src/app/fo/reservations/components/TimelineView.tsx
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box, Group, Text, Paper, ThemeIcon, Tooltip, ScrollArea, Badge, Stack
} from '@mantine/core';
import { IconBed } from '@tabler/icons-react';
import { ReservationDetails, RoomWithDetails } from '../page';

interface TimelineViewProps {
  rooms: RoomWithDetails[];
  reservations: ReservationDetails[];
  onDragCreate: (roomId: string, startDate: Date, endDate: Date) => void;
}

export function TimelineView({ rooms, reservations, onDragCreate }: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollDays, setScrollDays] = useState(0);
  const [dragStart, setDragStart] = useState<{ roomId: string; dateIndex: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  
  // Generate date headers (7 days visible, scrollable)
  const dateHeaders = useMemo(() => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate dates from scroll offset
    for (let i = scrollDays; i < scrollDays + 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [scrollDays]);

  // Check if room is occupied on a specific date
  const isRoomOccupied = (roomId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.some(res => {
      const checkIn = res.check_in_date.split('T')[0];
      const checkOut = res.check_out_date.split('T')[0];
      return res.room_id === roomId && dateStr >= checkIn && dateStr < checkOut;
    });
  };

  // Get reservation at specific date
  const getReservationAtDate = (roomId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.find(res => {
      const checkIn = res.check_in_date.split('T')[0];
      const checkOut = res.check_out_date.split('T')[0];
      return res.room_id === roomId && dateStr >= checkIn && dateStr < checkOut;
    });
  };

  // Get reservation span info
  const getReservationSpan = (roomId: string, date: Date, reservation: ReservationDetails) => {
    const dateStr = date.toISOString().split('T')[0];
    const checkIn = reservation.check_in_date.split('T')[0];
    const checkOut = reservation.check_out_date.split('T')[0];
    
    const isStart = dateStr === checkIn;
    const isEnd = new Date(dateStr).getTime() === new Date(checkOut).getTime() - 86400000; // Last day before checkout
    
    // Calculate span within visible dates
    let spanDays = 0;
    for (let i = 0; i < dateHeaders.length; i++) {
      const currentDate = dateHeaders[i].toISOString().split('T')[0];
      if (currentDate >= checkIn && currentDate < checkOut) {
        spanDays++;
      }
    }
    
    return { isStart, isEnd, spanDays };
  };

  // Handle drag start
  const handleMouseDown = (roomId: string, dateIndex: number) => {
    const date = dateHeaders[dateIndex];
    if (!isRoomOccupied(roomId, date)) {
      setDragStart({ roomId, dateIndex });
      setDragEnd(dateIndex);
    }
  };

  // Handle drag move
  const handleMouseMove = (dateIndex: number) => {
    if (dragStart) {
      setDragEnd(dateIndex);
    }
  };

  // Handle drag end
  const handleMouseUp = () => {
    if (dragStart && dragEnd !== null) {
      const startIndex = Math.min(dragStart.dateIndex, dragEnd);
      const endIndex = Math.max(dragStart.dateIndex, dragEnd);
      
      const startDate = new Date(dateHeaders[startIndex]);
      const endDate = new Date(dateHeaders[endIndex]);
      endDate.setDate(endDate.getDate() + 1); // Check-out is next day
      
      onDragCreate(dragStart.roomId, startDate, endDate);
    }
    setDragStart(null);
    setDragEnd(null);
  };

  // Check if cell is in drag selection
  const isInDragSelection = (roomId: string, dateIndex: number) => {
    if (!dragStart || dragEnd === null || dragStart.roomId !== roomId) return false;
    const min = Math.min(dragStart.dateIndex, dragEnd);
    const max = Math.max(dragStart.dateIndex, dragEnd);
    return dateIndex >= min && dateIndex <= max;
  };

  // Scroll handlers
  const handleScroll = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setScrollDays(Math.max(scrollDays - 7, -365)); // Can scroll back 1 year
    } else {
      setScrollDays(Math.min(scrollDays + 7, 365)); // Can scroll forward 1 year
    }
  };

  return (
    <Box style={{ position: 'relative' }}>
      {/* Scroll Buttons */}
      <Group justify="space-between" mb="xs">
        <Badge 
          variant="light" 
          color="teal" 
          style={{ cursor: 'pointer' }}
          onClick={() => handleScroll('left')}
        >
          ← Minggu Sebelumnya
        </Badge>
        <Badge 
          variant="light" 
          color="teal" 
          style={{ cursor: 'pointer' }}
          onClick={() => handleScroll('right')}
        >
          Minggu Berikutnya →
        </Badge>
      </Group>

      <Box>
        {/* Date Headers */}
        <Group gap={0} mb="xs" wrap="nowrap">
          <Box style={{ width: 120, flexShrink: 0 }} />
          {dateHeaders.map((date, idx) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <Box 
                key={idx} 
                style={{ 
                  flex: 1, 
                  textAlign: 'center',
                  padding: '8px',
                  background: isToday ? '#e0f2fe' : 'transparent',
                  borderRadius: 6
                }}
              >
                <Text size="xs" fw={600} c={isToday ? 'cyan.7' : 'dimmed'}>
                  {date.toLocaleDateString('id', { weekday: 'short' }).toUpperCase()}
                </Text>
                <Text size="lg" fw={700} c={isToday ? 'cyan.8' : 'dark'}>
                  {date.getDate()}
                </Text>
                <Text size="xs" c="dimmed">
                  {date.toLocaleDateString('id', { month: 'short' })}
                </Text>
              </Box>
            );
          })}
        </Group>

        {/* Room Rows */}
        {rooms.map((room) => (
          <Paper key={room.id} mb="xs" p="xs" withBorder radius="md" style={{ background: '#fafafa' }}>
            <Group gap={0} wrap="nowrap">
              {/* Room Info */}
              <Box style={{ width: 120, flexShrink: 0 }} pr="sm">
                <Group gap={6}>
                  <ThemeIcon 
                    size={28} 
                    radius="md" 
                    variant="light" 
                    color={room.status === 'available' ? 'teal' : room.status === 'occupied' ? 'red' : 'gray'}
                  >
                    <IconBed size={16} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={600}>{room.room_number}</Text>
                    <Text size="xs" c="dimmed">{room.room_type?.name}</Text>
                  </div>
                </Group>
              </Box>

              {/* Date Cells */}
              {dateHeaders.map((date, idx) => {
                const reservation = getReservationAtDate(room.id, date);
                const isOccupied = isRoomOccupied(room.id, date);
                const inDrag = isInDragSelection(room.id, idx);
                
                // Only render reservation on start date to avoid duplicates
                let showReservation = false;
                let reservationSpan = 0;
                if (reservation) {
                  const span = getReservationSpan(room.id, date, reservation);
                  showReservation = span.isStart;
                  reservationSpan = span.spanDays;
                }
                
                return (
                  <Box
                    key={idx}
                    style={{
                      flex: 1,
                      height: 48,
                      position: 'relative',
                      cursor: !isOccupied ? 'crosshair' : 'pointer'
                    }}
                    onMouseDown={() => handleMouseDown(room.id, idx)}
                    onMouseMove={() => handleMouseMove(idx)}
                    onMouseUp={handleMouseUp}
                  >
                    {showReservation && reservation ? (
                      <Tooltip 
                        label={
                          <Stack gap={4}>
                            <Text size="xs" fw={600}>{reservation.guest?.full_name}</Text>
                            <Text size="xs">{new Date(reservation.check_in_date).toLocaleDateString('id')} - {new Date(reservation.check_out_date).toLocaleDateString('id')}</Text>
                            <Text size="xs">Rp {reservation.total_price?.toLocaleString('id-ID')}</Text>
                          </Stack>
                        }
                      >
                        <Box
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: reservationSpan > 1 ? `calc(-${(reservationSpan - 1) * 100}% - ${(reservationSpan - 1) * 4}px)` : 0,
                            top: 0,
                            bottom: 0,
                            background: reservation.payment_status === 'paid' ? '#14b8a6' : 
                                       reservation.payment_status === 'pending' ? '#f59e0b' : '#6b7280',
                            border: '1px solid #dee2e6',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                            transition: 'all 0.2s',
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
                          <Text size="xs" c="white" fw={600} style={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            padding: '0 8px'
                          }}>
                            {reservation.guest?.full_name}
                          </Text>
                        </Box>
                      </Tooltip>
                    ) : !isOccupied && (
                      <Box
                        style={{
                          width: '100%',
                          height: '100%',
                          background: inDrag ? '#bbf7d0' : '#e9ecef',
                          border: '1px solid #dee2e6',
                          borderRadius: 4,
                          transition: 'all 0.2s'
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Group>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}