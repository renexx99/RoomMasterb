// src/app/ta/availability/components/AvailabilityTimeline.tsx
'use client';

import { useMemo } from 'react';
import { Box, Text, Paper, Stack, Group } from '@mantine/core';

interface Props {
  rooms: any[];
  reservations: any[];
  currentDate: Date;
  daysToShow?: number;
}

export function AvailabilityTimeline({ rooms, reservations, currentDate, daysToShow = 14 }: Props) {
  
  const CELL_WIDTH = 70;
  const ROOM_COL_WIDTH = 100;

  // Generate date headers
  const dateHeaders = useMemo(() => {
    const dates = [];
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentDate, daysToShow]);

  const getReservationsForCell = (roomId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.filter(res => {
      if (res.room_id !== roomId) return false;
      const checkIn = res.check_in_date.split('T')[0];
      const checkOut = res.check_out_date.split('T')[0];
      return dateStr >= checkIn && dateStr < checkOut;
    });
  };

  const getCheckoutForCell = (roomId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.find(r => r.room_id === roomId && r.check_out_date.split('T')[0] === dateStr);
  };

  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Box style={{ overflowX: 'auto', position: 'relative' }}>
        <Box style={{ minWidth: ROOM_COL_WIDTH + (daysToShow * CELL_WIDTH) }}>
          
          {/* --- DATE HEADER (Sticky Top) --- */}
          <Group gap={0} wrap="nowrap" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white' }}>
            <Box style={{ 
                width: ROOM_COL_WIDTH, 
                flexShrink: 0, 
                padding: '8px 12px', 
                position: 'sticky', 
                left: 0, 
                zIndex: 20,
                background: 'white',
                borderBottom: '1px solid #e9ecef',
                borderRight: '1px solid #e9ecef'
            }}>
              <Text size="10px" fw={700} c="dimmed" tt="uppercase">ROOM</Text>
            </Box>
            
            {dateHeaders.map((date, idx) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              return (
                <Box 
                  key={idx} 
                  style={{ 
                    width: CELL_WIDTH, 
                    flexShrink: 0,
                    textAlign: 'center',
                    padding: '8px 0',
                    background: isToday ? '#f0fdf4' : (isWeekend ? '#f8f9fa' : 'white'),
                    borderBottom: `2px solid ${isToday ? '#1a1a1a' : '#e9ecef'}`,
                    borderRight: '1px solid #f1f3f5'
                  }}
                >
                  <Text size="10px" fw={700} c={isToday ? 'dark' : 'dimmed'} tt="uppercase">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text size="sm" fw={700} c={isToday ? 'dark' : 'dark'}>
                    {date.getDate()}
                  </Text>
                </Box>
              );
            })}
          </Group>

          {/* --- ROOM ROWS --- */}
          <Stack gap={0}>
            {rooms.map((room) => (
              <Group key={room.id} gap={0} wrap="nowrap" style={{ height: 46, borderBottom: '1px solid #f1f3f5' }}>
                
                {/* Room Info Column (Sticky Left) */}
                <Box 
                  style={{ 
                    width: ROOM_COL_WIDTH, 
                    flexShrink: 0, 
                    background: 'white',
                    borderRight: '1px solid #e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    position: 'sticky',
                    left: 0,
                    zIndex: 5
                  }}
                >
                  <Stack gap={0}>
                    <Text size="xs" fw={700} c="dark.6">{room.room_number}</Text>
                    <Text size="9px" c="dimmed" tt="uppercase" fw={600} lineClamp={1}>
                        {room.room_type?.name}
                    </Text>
                  </Stack>
                </Box>

                {/* Date Cells */}
                {dateHeaders.map((date, idx) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const activeRes = getReservationsForCell(room.id, date);
                  const checkoutRes = getCheckoutForCell(room.id, date);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  let content = null;

                  if (activeRes.length > 0) {
                    const res = activeRes[0];
                    const isStart = res.check_in_date.split('T')[0] === dateStr;
                    
                    const isPaid = res.payment_status === 'paid' || res.payment_status === 'city_ledger';
                    const barBg = isPaid ? '#e5e5e5' : '#fef3c7';
                    const barBorder = isPaid ? '#d4d4d4' : '#fcd34d';
                    
                    if (isStart && checkoutRes) {
                        // Turnover (Checkout + Checkin)
                        content = (
                            <Group gap={0} h="100%" w="100%" align="center">
                                <Box style={{ flex: 1, height: '60%', background: '#f5f5f5', borderRadius: '4px 0 0 4px', border: '1px solid #dee2e6' }} />
                                <Box style={{ flex: 1, height: '60%', background: barBg, border: `1px solid ${barBorder}`, borderRadius: '0 4px 4px 0', borderLeft: 'none' }} />
                            </Group>
                        );
                    } else if (isStart) {
                        // Check-in Only
                        content = (
                            <Box style={{ 
                                width: '90%', marginLeft: '10%', height: '60%', 
                                background: barBg, border: `1px solid ${barBorder}`, borderRadius: '4px 0 0 4px',
                                display: 'flex', alignItems: 'center', paddingLeft: 4
                            }}>
                                <Text size="8px" truncate fw={600} c="dark.5">{res.guest?.full_name}</Text>
                            </Box>
                        );
                    } else {
                         // Full Stay
                         content = (
                            <Box style={{ width: '100%', height: '60%', background: barBg, borderTop: `1px solid ${barBorder}`, borderBottom: `1px solid ${barBorder}` }} />
                         );
                    }
                  } else if (checkoutRes) {
                    // Checkout Only
                    content = (
                        <Box style={{ 
                            width: '40%', marginRight: '60%', height: '60%', 
                            background: '#f5f5f5', border: '1px solid #dee2e6', borderRadius: '0 4px 4px 0'
                        }} />
                    );
                  }

                  return (
                    <Box
                      key={idx}
                      style={{
                        width: CELL_WIDTH,
                        flexShrink: 0,
                        borderRight: '1px solid #f8f9fa',
                        background: isWeekend ? '#fcfcfc' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                        {content}
                    </Box>
                  );
                })}
              </Group>
            ))}
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}
