// src/app/manager/dashboard/components/AICopilotWidget.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Paper, Group, ThemeIcon, Text, Badge, ActionIcon, ScrollArea, Stack,
  Box, Textarea, Tooltip, Transition, Loader, Button, SimpleGrid, Card, Divider, Table
} from '@mantine/core';
import {
  IconSparkles, IconMaximize, IconMinimize, IconX, IconSend, IconRobot, 
  IconChartBar, IconUserSearch, IconTrendingUp, IconBed, IconBuildingStore,
  IconHome, IconCoin, IconUser, IconMail, IconPhone
} from '@tabler/icons-react';
import { chatWithManagerAI } from '../../ai-agent/actions'; // Import server action baru

interface ChatMessage {
  type: 'ai' | 'user' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
  responseType?: string;
}

// Prompt khusus Manager
const QUICK_PROMPTS = [
  {
    label: 'Laporan Revenue',
    text: 'Buatkan ringkasan performa hotel (Revenue & Occupancy) untuk periode [Bulan Ini].',
    icon: <IconChartBar size={14} />,
    color: 'blue',
    desc: 'Analisa pendapatan & okupansi'
  },
  {
    label: 'Inspeksi Kamar',
    text: 'Bagaimana status ketersediaan dan kebersihan kamar secara keseluruhan hari ini?',
    icon: <IconBuildingStore size={14} />,
    color: 'indigo',
    desc: 'Cek status properti'
  },
  {
    label: 'Cek Tamu VIP',
    text: 'Cari profil tamu atas nama [Nama Tamu], lihat riwayat transaksi dan preferensinya.',
    icon: <IconUserSearch size={14} />,
    color: 'violet',
    desc: 'Analisis profitabilitas tamu'
  }
];

// --- Sub-Components untuk Data (Menggunakan Tema Biru) ---
function AnalyticsCard({ data }: { data: any }) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ borderColor: '#339af0' }}>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <ThemeIcon color="blue" variant="light" size="lg" radius="md">
            <IconChartBar size={20} />
          </ThemeIcon>
          <div>
            <Text fw={700} size="sm">Laporan Kinerja Manajerial</Text>
            <Text size="xs" c="dimmed">
              {new Date(data.period.start).toLocaleDateString('id-ID')} - {new Date(data.period.end).toLocaleDateString('id-ID')}
            </Text>
          </div>
        </Group>
        <Badge color="blue" variant="filled">{data.period.days} Hari</Badge>
      </Group>

      <SimpleGrid cols={2} spacing="md" mb="md">
        <Card padding="sm" radius="md" withBorder>
          <Group gap={8} mb={4}>
            <IconTrendingUp size={16} color="blue" />
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Revenue</Text>
          </Group>
          <Text size="xl" fw={700} c="blue">Rp {data.revenue.total.toLocaleString('id-ID')}</Text>
          <Text size="xs" c="dimmed">Avg/Booking: Rp {data.revenue.average_per_booking.toLocaleString('id-ID')}</Text>
        </Card>

        <Card padding="sm" radius="md" withBorder>
          <Group gap={8} mb={4}>
            <IconBed size={16} color="indigo" />
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Occupancy</Text>
          </Group>
          <Text size="xl" fw={700} c="indigo">{data.occupancy.rate}%</Text>
          <Text size="xs" c="dimmed">{data.bookings.total} of {data.occupancy.capacity} capacity</Text>
        </Card>
      </SimpleGrid>

      <Table>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>Total Bookings</Table.Td>
            <Table.Td ta="right" fw={600}>{data.bookings.total}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Paid Bookings</Table.Td>
            <Table.Td ta="right" fw={600} c="teal">{data.bookings.paid}</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Card>
  );
}

function GuestProfileCard({ data }: { data: any }) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <ThemeIcon color="violet" variant="light" size="lg" radius="md">
              <IconUser size={20} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm">Profil Tamu</Text>
              <Text size="xs" c="dimmed">{data.guest.name}</Text>
            </div>
          </Group>
          <Badge color="violet" variant="light" tt="uppercase">{data.guest.tier}</Badge>
        </Group>
        <SimpleGrid cols={3} spacing="xs" mb="md">
          <Box ta="center">
            <Text size="xl" fw={700} c="violet">{data.statistics.total_stays}</Text>
            <Text size="xs" c="dimmed">Menginap</Text>
          </Box>
          <Box ta="center">
            <Text size="xl" fw={700} c="blue">Rp {(data.statistics.total_spent / 1000000).toFixed(1)}jt</Text>
            <Text size="xs" c="dimmed">Total Transaksi</Text>
          </Box>
          <Box ta="center">
            <Text size="xs" fw={700} c="indigo">{new Date(data.statistics.last_visit).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</Text>
            <Text size="xs" c="dimmed">Kunjungan Terakhir</Text>
          </Box>
        </SimpleGrid>
      </Card>
    );
}

export function AICopilotWidget() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  
  const viewport = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory, isWidgetOpen]);

  const handleQuickPrompt = (text: string) => {
    setChatMessage(text);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || loadingAI) return;

    const messageToSend = chatMessage;
    setChatMessage('');
    
    setChatHistory(prev => [...prev, {
      type: 'user',
      content: messageToSend,
      timestamp: new Date(),
    }]);

    setLoadingAI(true);

    try {
      const apiHistory = chatHistory
        .filter(msg => msg.type !== 'system')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const response = await chatWithManagerAI(messageToSend, apiHistory as any);

      setChatHistory(prev => [...prev, {
        type: 'ai',
        content: response.content || 'Maaf, saya tidak bisa memproses permintaan itu.',
        timestamp: new Date(),
        data: response.data || null,
        responseType: response.type || 'text'
      }]);

    } catch (e) {
      setChatHistory(prev => [...prev, { type: 'system', content: 'Terjadi kesalahan saat menghubungkan ke AI Agent.', timestamp: new Date() }]);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.responseType === 'analytics' && msg.data) return <AnalyticsCard data={msg.data} />;
    if (msg.responseType === 'guest_profile' && msg.data) return <GuestProfileCard data={msg.data} />;
    // Tampilkan response text biasa jika bukan card
    return (
      <Paper p="xs" radius="md" shadow="xs" withBorder={msg.type !== 'user'}
        bg={msg.type === 'user' ? 'blue' : msg.type === 'system' ? 'red.1' : 'white'}
        c={msg.type === 'user' ? 'white' : 'black'}
      >
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
        <Text size="xs" c={msg.type === 'user' ? 'blue.1' : 'dimmed'} mt={4} ta="right">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </Paper>
    );
  };

  return (
    <>
      {!isWidgetOpen && (
        <Transition transition="slide-up" mounted={!isWidgetOpen}>
          {(styles) => (
            <Tooltip label="Manager AI Assistant" position="left" withArrow>
              <ActionIcon
                style={{ ...styles, position: 'fixed', bottom: 30, right: 30, zIndex: 100, boxShadow: 'var(--mantine-shadow-lg)' }}
                size={60} radius={60} variant="gradient"
                gradient={{ from: 'blue', to: 'indigo', deg: 60 }}
                onClick={() => setIsWidgetOpen(true)}
              >
                <IconSparkles size={32} />
              </ActionIcon>
            </Tooltip>
          )}
        </Transition>
      )}

      <Transition transition="slide-up" mounted={isWidgetOpen}>
        {(styles) => (
          <Paper
            shadow="xl" radius="lg" withBorder
            style={{
              ...styles, position: 'fixed', bottom: isMaximized ? 0 : 30, right: isMaximized ? 0 : 30,
              width: isMaximized ? '100vw' : 450, height: isMaximized ? '100vh' : 650, zIndex: 200,
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            <Box p="sm" bg="blue.7" style={{ color: 'white' }}>
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon variant="light" color="white" size="md" radius="xl"><IconSparkles size={18} /></ThemeIcon>
                  <Box>
                    <Text fw={700} size="sm" c="white">Manager AI Co-pilot</Text>
                    <Group gap={4}>
                      <Badge size="xs" color="green" variant="filled">Online</Badge>
                      <Text size="xs" c="blue.1">Reporting & Analytics</Text>
                    </Group>
                  </Box>
                </Group>
                <Group gap={4}>
                  <ActionIcon variant="transparent" color="white" onClick={() => setIsMaximized(!isMaximized)}>
                    {isMaximized ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
                  </ActionIcon>
                  <ActionIcon variant="transparent" color="white" onClick={() => setIsWidgetOpen(false)}><IconX size={18} /></ActionIcon>
                </Group>
              </Group>
            </Box>

            <ScrollArea viewportRef={viewport} style={{ flex: 1, backgroundColor: '#f8f9fa' }} p="md">
              <Stack gap="md">
                {chatHistory.length === 0 && (
                  <Box mt="xs">
                    <Box style={{ textAlign: 'center', opacity: 0.8, marginBottom: 20 }}>
                      <ThemeIcon size={64} radius="xl" variant="light" color="blue" mb="sm"><IconRobot size={36} /></ThemeIcon>
                      <Text fw={600} size="md">Halo, Manager!</Text>
                      <Text size="xs" c="dimmed">Pilih analisis cepat di bawah ini:</Text>
                    </Box>
                    <Stack gap={8}>
                      {QUICK_PROMPTS.map((prompt, index) => (
                        <Button key={index} variant="default" size="md" radius="md" fullWidth justify="flex-start"
                          leftSection={<ThemeIcon size="sm" color={prompt.color} variant="light">{prompt.icon}</ThemeIcon>}
                          onClick={() => handleQuickPrompt(prompt.text)}
                          styles={(theme) => ({
                            root: { height: 'auto', padding: '8px 12px', '&:hover': { borderColor: theme.colors[prompt.color][4] } },
                            label: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }
                          })}
                        >
                          <Text size="xs" fw={600} c="dark.9">{prompt.label}</Text>
                          <Text size="10px" c="dimmed" fw={400}>{prompt.desc}</Text>
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                )}
                {chatHistory.map((msg, idx) => (
                  <Box key={idx} style={{ alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start', maxWidth: msg.type === 'user' ? '85%' : '100%' }}>
                    {renderMessageContent(msg)}
                  </Box>
                ))}
                {loadingAI && (
                  <Box style={{ alignSelf: 'flex-start' }}>
                    <Paper p="xs" radius="md" bg="white" withBorder>
                      <Group gap="xs"><Loader size="xs" color="blue" /><Text size="xs" c="dimmed">Menganalisis data...</Text></Group>
                    </Paper>
                  </Box>
                )}
              </Stack>
            </ScrollArea>

            <Box p="sm" style={{ borderTop: '1px solid #e9ecef', background: 'white' }}>
              <Group gap="xs" align="flex-end">
                <Textarea
                  ref={inputRef} placeholder="Tanya tentang laporan, okupansi, dll..."
                  value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
                  minRows={1} maxRows={3} autosize style={{ flex: 1 }} onKeyDown={handleKeyPress} disabled={loadingAI} size="sm"
                />
                <ActionIcon size={36} radius="md" variant="gradient" gradient={{ from: 'blue', to: 'indigo' }} onClick={handleSendMessage} loading={loadingAI} disabled={!chatMessage.trim() || loadingAI}>
                  <IconSend size={18} />
                </ActionIcon>
              </Group>
            </Box>
          </Paper>
        )}
      </Transition>
    </>
  );
}