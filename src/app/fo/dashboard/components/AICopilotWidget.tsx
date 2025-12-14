// src/app/fo/dashboard/components/AICopilotWidget.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Paper, Group, ThemeIcon, Text, Badge, ActionIcon, ScrollArea, Stack,
  Box, Textarea, Tooltip, Transition, Loader
} from '@mantine/core';
import {
  IconSparkles, IconMaximize, IconMinimize, IconX, IconSend, IconRobot
} from '@tabler/icons-react';
import { chatWithAI } from '../../ai-actions';

interface ChatMessage {
  type: 'ai' | 'user' | 'system';
  content: string;
  timestamp: Date;
}

export function AICopilotWidget() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  
  const viewport = useRef<HTMLDivElement>(null);

  // Auto-scroll saat ada pesan baru
  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory, isWidgetOpen]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || loadingAI) return;

    const userMsg = chatMessage;
    setChatMessage('');
    
    // 1. Update UI Client (Optimistic)
    setChatHistory(prev => [...prev, {
      type: 'user',
      content: userMsg,
      timestamp: new Date(),
    }]);

    setLoadingAI(true);

    try {
      // 2. Siapkan format riwayat chat untuk OpenAI
      // Filter pesan system/error dan mapping type ke role yang sesuai
      const apiHistory = chatHistory
        .filter(msg => msg.type !== 'system')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // 3. Panggil Server Action dengan pesan baru & riwayat
      // @ts-ignore (abaikan warning tipe sementara jika ada ketidakcocokan minor)
      const response = await chatWithAI(userMsg, apiHistory);

      // 4. Update UI dengan balasan AI
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
                    boxShadow: 'var(--mantine-shadow-lg)' // Perbaikan Shadow
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
                {chatHistory.length === 0 && (
                  <Box style={{ textAlign: 'center', opacity: 0.6, marginTop: 40 }}>
                    <ThemeIcon size={60} radius="xl" variant="light" color="gray" mb="sm">
                      <IconRobot size={32} />
                    </ThemeIcon>
                    <Text size="sm">Halo! Saya asisten Front Office Anda.</Text>
                    <Text size="xs">Coba ketik: "Buat reservasi untuk Budi besok"</Text>
                  </Box>
                )}

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
            <Box p="md" style={{ borderTop: '1px solid #e9ecef', background: 'white' }}>
              <Group gap="xs" align="flex-end">
                <Textarea
                  placeholder="Ketik perintah operasional..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  minRows={1}
                  maxRows={3}
                  autosize
                  style={{ flex: 1 }}
                  onKeyDown={handleKeyPress}
                  disabled={loadingAI}
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
              <Text size="xs" c="dimmed" mt={4} ta="center">
                AI dapat melakukan kesalahan. Cek kembali data reservasi.
              </Text>
            </Box>
          </Paper>
        )}
      </Transition>
    </>
  );
}