// src/app/fo/dashboard/components/AICopilotWidget.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Paper, Group, ThemeIcon, Text, Badge, ActionIcon, ScrollArea, Stack,
  Box, Textarea, Tooltip, Transition, Loader, Button
} from '@mantine/core';
import {
  IconSparkles, IconMaximize, IconMinimize, IconX, IconSend, IconRobot, 
  IconUserSearch, IconChartBar, IconBed, IconBulb, IconChevronRight
} from '@tabler/icons-react';
import { chatWithAI } from '../../ai-actions';

interface ChatMessage {
  type: 'ai' | 'user' | 'system';
  content: string;
  timestamp: Date;
}

// [UPDATE] Hapus emoji dari label & text, sesuaikan bahasa agar lebih formal/bersih
const QUICK_PROMPTS = [
  {
    label: 'Walk-in Booking',
    text: 'Booking Walk-in: Tamu [Nama], Tipe [Deluxe], Check-in [Hari ini], [1] malam.',
    icon: <IconBed size={14} />, // Ukuran icon diperkecil
    color: 'teal',
    desc: 'Buat reservasi langsung di tempat'
  },
  {
    label: 'Cek Profil Tamu',
    text: 'Cek profil dan history tamu: [Nama]. Apakah ada preferensi khusus?',
    icon: <IconUserSearch size={14} />,
    color: 'blue',
    desc: 'Lihat riwayat menginap & preferensi'
  },
  {
    label: 'Saran Upselling',
    text: 'Berikan rekomendasi penawaran atau upgrade kamar untuk tamu [Nama Tamu] berdasarkan history menginapnya.',
    icon: <IconBulb size={14} />,
    color: 'grape',
    desc: 'Rekomendasi penawaran untuk tamu'
  },
  {
    label: 'Laporan Revenue',
    text: 'Buatkan ringkasan performa hotel (Revenue & Occupancy) untuk periode [Bulan Ini].',
    icon: <IconChartBar size={14} />,
    color: 'orange',
    desc: 'Analisa pendapatan & okupansi'
  }
];

export function AICopilotWidget() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  
  const viewport = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll saat ada pesan baru
  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory, isWidgetOpen]);

  const handleQuickPrompt = (text: string) => {
    setChatMessage(text);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || loadingAI) return;

    const userMsg = chatMessage;
    setChatMessage('');
    
    setChatHistory(prev => [...prev, {
      type: 'user',
      content: userMsg,
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

      // @ts-ignore
      const response = await chatWithAI(userMsg, apiHistory);

      setChatHistory(prev => [...prev, {
        type: 'ai',
        content: response.content || 'Maaf, saya tidak bisa memproses permintaan itu.',
        timestamp: new Date(),
      }]);

    } catch (e) {
      console.error("Error calling AI:", e);
      setChatHistory(prev => [...prev, {
        type: 'system',
        content: 'Terjadi kesalahan saat menghubungkan ke AI Agent.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      {!isWidgetOpen && (
        <Transition transition="slide-up" mounted={!isWidgetOpen}>
          {(styles) => (
            <Tooltip label="Ask AI Agent" position="left" withArrow>
              <ActionIcon
                style={{ 
                    ...styles, 
                    position: 'fixed', 
                    bottom: 30, 
                    right: 30, 
                    zIndex: 100,
                    boxShadow: 'var(--mantine-shadow-lg)'
                }}
                size={60}
                radius={60}
                variant="gradient"
                gradient={{ from: 'teal', to: 'blue', deg: 60 }}
                onClick={() => setIsWidgetOpen(true)}
              >
                <IconSparkles size={32} />
              </ActionIcon>
            </Tooltip>
          )}
        </Transition>
      )}

      {/* CHAT WINDOW */}
      <Transition transition="slide-up" mounted={isWidgetOpen}>
        {(styles) => (
          <Paper
            shadow="xl"
            radius="lg"
            withBorder
            style={{
              ...styles,
              position: 'fixed',
              bottom: isMaximized ? 0 : 30,
              right: isMaximized ? 0 : 30,
              width: isMaximized ? '100vw' : 400,
              height: isMaximized ? '100vh' : 600,
              zIndex: 200,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* HEADER */}
            <Box p="sm" bg="teal" style={{ color: 'white' }}>
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon variant="light" color="white" size="md" radius="xl">
                    <IconSparkles size={18} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={700} size="sm" c="white">Hotel AI Agent</Text>
                    <Group gap={4}>
                      <Badge size="xs" color="green" variant="filled">Online</Badge>
                      <Text size="xs" c="teal.1">FO Assistant</Text>
                    </Group>
                  </Box>
                </Group>
                <Group gap={4}>
                  <ActionIcon variant="transparent" color="white" onClick={() => setIsMaximized(!isMaximized)}>
                    {isMaximized ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
                  </ActionIcon>
                  <ActionIcon variant="transparent" color="white" onClick={() => setIsWidgetOpen(false)}>
                    <IconX size={18} />
                  </ActionIcon>
                </Group>
              </Group>
            </Box>

            {/* CHAT AREA */}
            <ScrollArea viewportRef={viewport} style={{ flex: 1, backgroundColor: '#f8f9fa' }} p="md">
              <Stack gap="md">
                
                {/* --- ZERO STATE (Menu Awal) --- */}
                {chatHistory.length === 0 && (
                  <Box mt="xs">
                    <Box style={{ textAlign: 'center', opacity: 0.8, marginBottom: 20 }}>
                      <ThemeIcon size={64} radius="xl" variant="light" color="teal" mb="sm">
                        <IconRobot size={36} />
                      </ThemeIcon>
                      <Text fw={600} size="md">Halo, FO Team!</Text>
                      <Text size="xs" c="dimmed">
                        Pilih menu cepat di bawah ini:
                      </Text>
                    </Box>

                    {/* [UPDATE] Layout Stack (Vertical List) */}
                    <Stack gap={8}>
                      {QUICK_PROMPTS.map((prompt, index) => (
                        <Button
                          key={index}
                          variant="default" // Ganti ke default agar lebih clean (putih/abu)
                          size="md"         // Tetap md tapi contentnya kita kecilkan manual lewat styles
                          radius="md"
                          fullWidth
                          justify="space-between" // Icon kiri, text kiri, chevron kanan
                          leftSection={
                            <ThemeIcon size="sm" color={prompt.color} variant="light" radius="sm">
                              {prompt.icon}
                            </ThemeIcon>
                          }
                          rightSection={<IconChevronRight size={14} style={{ opacity: 0.5 }} />}
                          onClick={() => handleQuickPrompt(prompt.text)}
                          styles={(theme) => ({
                            root: {
                              border: `1px solid ${theme.colors.gray[3]}`,
                              height: 'auto', // Auto height agar padding enak
                              paddingTop: 8,
                              paddingBottom: 8,
                              backgroundColor: 'white',
                              '&:hover': {
                                backgroundColor: theme.colors.gray[0],
                                borderColor: theme.colors[prompt.color][4],
                              }
                            },
                            inner: {
                              justifyContent: 'flex-start' // Align content ke kiri
                            },
                            section: {
                              marginRight: 10 // Jarak icon ke text
                            },
                            label: {
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              lineHeight: 1.2
                            }
                          })}
                        >
                          {/* Konten Text dalam Tombol */}
                          <Text size="xs" fw={600} c="dark.9">
                            {prompt.label}
                          </Text>
                          <Text size="10px" c="dimmed" fw={400}>
                            {prompt.desc}
                          </Text>
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* --- CHAT BUBBLES --- */}
                {chatHistory.map((msg, idx) => (
                  <Box
                    key={idx}
                    style={{
                      alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%'
                    }}
                  >
                    <Paper
                      p="xs"
                      radius="md"
                      shadow="xs"
                      withBorder={msg.type !== 'user'}
                      bg={
                        msg.type === 'user' ? 'teal' : 
                        msg.type === 'system' ? 'red.1' : 'white'
                      }
                      c={msg.type === 'user' ? 'white' : 'black'}
                    >
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                      <Text size="xs" c={msg.type === 'user' ? 'white' : 'dimmed'} mt={4} ta="right">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Paper>
                  </Box>
                ))}

                {loadingAI && (
                  <Box style={{ alignSelf: 'flex-start' }}>
                    <Paper p="xs" radius="md" bg="white" withBorder>
                      <Group gap="xs">
                        <Loader size="xs" color="teal" />
                        <Text size="xs" c="dimmed">Sedang memproses...</Text>
                      </Group>
                    </Paper>
                  </Box>
                )}
              </Stack>
            </ScrollArea>

            {/* INPUT AREA */}
            <Box p="sm" style={{ borderTop: '1px solid #e9ecef', background: 'white' }}>
              <Group gap="xs" align="flex-end">
                <Textarea
                  ref={inputRef}
                  placeholder="Ketik perintah operasional..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  minRows={1}
                  maxRows={3}
                  autosize
                  style={{ flex: 1 }}
                  onKeyDown={handleKeyPress}
                  disabled={loadingAI}
                  size="sm"
                />
                <ActionIcon 
                  size={36} 
                  radius="md" 
                  variant="gradient" 
                  gradient={{ from: 'teal', to: 'cyan' }} 
                  onClick={handleSendMessage}
                  loading={loadingAI}
                  disabled={!chatMessage.trim() || loadingAI}
                >
                  <IconSend size={18} />
                </ActionIcon>
              </Group>
              <Text size="10px" c="dimmed" mt={4} ta="center">
                AI dapat melakukan kesalahan. Cek kembali data.
              </Text>
            </Box>
          </Paper>
        )}
      </Transition>
    </>
  );
}