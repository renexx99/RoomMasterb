// src/app/fo/availability/components/AvailabilityTimeline.tsx
'use client';

import { useState, useMemo, useRef } from 'react';
import { Box, Group, Text, Paper, ThemeIcon, Tooltip, Badge, Avatar, Stack } from '@mantine/core';
import { IconBed } from '@tabler/icons-react';

interface Props {
  rooms: any[];
  reservations: any[];
}

export function AvailabilityTimeline({ rooms, reservations }: Props) {
  // Default range: Hari ini + 6 hari ke depan
  const [scrollDays, setScrollDays] = useState(0);
  
  const dateHeaders = useMemo(() => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = scrollDays; i < scrollDays + 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [scrollDays]);

  const getReservation = (roomId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.find(res => {
      const checkIn = res.check_in_date.split('T')[0];
      const checkOut = res.check_out_date.split('T')[0];
      return res.room_id === roomId && dateStr >= checkIn && dateStr < checkOut;
    });
  };

  return (
    <Box>
      {/* Date Headers */}
      <Group gap={0} mb="xs" wrap="nowrap">
        <Box style={{ width: 100, flexShrink: 0 }} /> {/* Spacer untuk kolom kamar */}
        {dateHeaders.map((date, idx) => {
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <Box 
              key={idx} 
              style={{ 
                flex: 1, 
                textAlign: 'center',
                padding: '8px 4px',
                background: isToday ? 'var(--mantine-color-teal-0)' : 'transparent',
                borderRadius: 6,
                borderBottom: isToday ? '2px solid var(--mantine-color-teal-5)' : 'none'
              }}
            >
              <Text size="xs" fw={700} c={isToday ? 'teal.7' : 'dimmed'} tt="uppercase">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text size="sm" fw={700} c={isToday ? 'teal.9' : 'dark'}>
                {date.getDate()}
              </Text>
            </Box>
          );
        })}
      </Group>

      {/* Room Rows */}
      <Stack gap={6}>
        {rooms.map((room) => (
          <Paper key={room.id} p={0} radius="md" withBorder style={{ overflow: 'hidden' }}>
            <Group gap={0} wrap="nowrap" style={{ minHeight: 50 }}>
              
              {/* Kolom Info Kamar */}
              <Box 
                style={{ 
                  width: 100, 
                  flexShrink: 0, 
                  background: 'var(--mantine-color-gray-0)',
                  borderRight: '1px solid var(--mantine-color-gray-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 8px'
                }}
              >
                <Stack gap={0} align="center">
                  <Text size="sm" fw={700} c="dark.6">{room.room_number}</Text>
                  <Badge 
                    size="xs" 
                    variant="light" 
                    color={room.status === 'available' ? 'teal' : room.status === 'occupied' ? 'blue' : 'gray'}
                    style={{ padding: '0 4px', height: 16, fontSize: 9 }}
                  >
                    {room.status === 'available' ? 'AV' : room.status === 'occupied' ? 'OCC' : 'OOO'}
                  </Badge>
                </Stack>
              </Box>

              {/* Grid Tanggal */}
              {dateHeaders.map((date, idx) => {
                const res = getReservation(room.id, date);
                const isStart = res && res.check_in_date.split('T')[0] === date.toISOString().split('T')[0];
                
                return (
                  <Box
                    key={idx}
                    style={{
                      flex: 1,
                      borderRight: '1px solid var(--mantine-color-gray-1)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'white'
                    }}
                  >
                    {res && (
                      <Tooltip label={`${res.guest?.full_name} (${res.payment_status})`}>
                        <Box
                          style={{
                            position: 'absolute',
                            left: isStart ? 2 : -1, 
                            right: 0,
                            top: 6,
                            bottom: 6,
                            zIndex: 1,
                            backgroundColor: res.payment_status === 'paid' ? 'var(--mantine-color-teal-1)' : 'var(--mantine-color-orange-1)',
                            borderLeft: isStart ? `3px solid ${res.payment_status === 'paid' ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-orange-6)'}` : 'none',
                            borderRadius: isStart ? '4px 0 0 4px' : 0,
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: isStart ? 8 : 0,
                            overflow: 'hidden'
                          }}
                        >
                          {isStart && (
                            <Group gap={4} wrap="nowrap">
                              <Avatar size={16} radius="xl" color={res.payment_status === 'paid' ? 'teal' : 'orange'}>
                                {res.guest?.full_name?.charAt(0)}
                              </Avatar>
                              <Text size="xs" fw={600} truncate c="dark.7">
                                {res.guest?.full_name?.split(' ')[0]}
                              </Text>
                            </Group>
                          )}
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                );
              })}
            </Group>
          </Paper>
        ))}
      </Stack>
      
      <Group justify="center" mt="md">
        <Badge variant="dot" color="teal">Paid</Badge>
        <Badge variant="dot" color="orange">Pending</Badge>
        <Text size="xs" c="dimmed">Use scroll to see more dates</Text>
      </Group>
    </Box>
  );
}