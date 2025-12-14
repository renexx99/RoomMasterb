// src/app/fo/reservations/components/AISuggestionsPanel.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Stack, Paper, Group, Text, ThemeIcon, Divider, Textarea, ActionIcon,
  Box, Loader, ScrollArea
} from '@mantine/core';
import { 
  IconTrendingUp, IconAlertCircle, IconSparkles, IconSend, IconRobot 
} from '@tabler/icons-react';
import { chatWithAI } from '../../ai-actions'; // Import Server Action yang sama dengan Widget

// --- Tipe Data untuk Chat ---
interface ChatMessage {
  type: 'ai' | 'user' | 'system';
  content: string;
  timestamp: Date;
}

const MOCK_AI_SUGGESTIONS = [
  { 
    id: 's1', 
    type: 'upsell', 
    icon: IconTrendingUp, 
    title: 'Peluang Upselling', 
    message: 'Tawarkan Suite Room dengan diskon 10% untuk tamu VIP hari ini', 
    priority: 'high' 
  },
  { 
    id: 's2', 
    type: 'alert', 
    icon: IconAlertCircle, 
    title: 'Konflik Jadwal', 
    message: 'Terdapat potensi konflik booking pada tanggal yang sama', 
    priority: 'urgent' 
  },
  { 
    id: 's3', 
    type: 'tip', 
    icon: IconSparkles, 
    title: 'Info Pintar', 
    message: 'Lantai 3 memiliki ketersediaan tinggi, cocok untuk grup atau keluarga besar', 
    priority: 'low' 
  },
];

export function AISuggestionsPanel() {
  return (
    <Stack gap="xs">
      <Divider label="Saran AI" labelPosition="center" />
      
      {MOCK_AI_SUGGESTIONS.map((suggestion) => (
        <Paper 
          key={suggestion.id} 
          p="sm" 
          radius="md" 
          withBorder
          style={{ 
            background: suggestion.priority === 'urgent' ? '#fef3c7' : 
                       suggestion.priority === 'high' ? '#dbeafe' : 'white',
            borderLeft: `3px solid ${
              suggestion.priority === 'urgent' ? '#f59e0b' : 
              suggestion.priority === 'high' ? '#3b82f6' : '#14b8a6'
            }`
          }}
        >
          <Group gap="xs" align="flex-start">
            <ThemeIcon 
              size="sm" 
              color={
                suggestion.priority === 'urgent' ? 'yellow' : 
                suggestion.priority === 'high' ? 'blue' : 'teal'
              }
              variant="light"
            >
              <suggestion.icon size={14} />
            </ThemeIcon>
            <div style={{ flex: 1 }}>
              <Text size="xs" fw={600} mb={2}>{suggestion.title}</Text>
              <Text size="xs" c="dimmed">{suggestion.message}</Text>
            </div>
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}

export function AICoPilotPanel() {
  // State Chat
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Ref untuk Auto-scroll
  const viewport = useRef<HTMLDivElement>(null);

  // Efek Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [aiMessages]);

  const handleAiSend = async () => {
    if (!aiInput.trim() || loading) return;
    
    const userMsg = aiInput;
    setAiInput('');

    // 1. Update UI Client (Optimistic)
    setAiMessages(prev => [...prev, { 
      type: 'user', 
      content: userMsg,
      timestamp: new Date()
    }]);

    setLoading(true);

    try {
      // 2. Format history untuk OpenAI API
      const apiHistory = aiMessages
        .filter(msg => msg.type !== 'system')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // 3. Panggil Server Action
      // @ts-ignore
      const response = await chatWithAI(userMsg, apiHistory);

      // 4. Update UI dengan balasan AI
      setAiMessages(prev => [...prev, { 
        type: 'ai', 
        content: response.content || 'Maaf, saya tidak mengerti.',
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error("AI Error:", error);
      setAiMessages(prev => [...prev, { 
        type: 'system', 
        content: 'Terjadi kesalahan koneksi ke AI.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiSend();
    }
  };

  return (
    <Stack gap="md" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* Header AI Panel */}
      <Paper p="md" radius="md" withBorder style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)' }}>
        <Group gap="xs">
          <ThemeIcon size="xl" color="white" variant="light" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <IconSparkles size={28} stroke={2} />
          </ThemeIcon>
          <div>
            <Text c="white" fw={600}>AI Reservation Assistant</Text>
            <Text c="teal.0" size="xs">Cek ketersediaan & buat booking</Text>
          </div>
        </Group>
      </Paper>

      {/* Area Chat */}
      <ScrollArea viewportRef={viewport} style={{ flex: 1, height: 400 }} scrollbarSize={6}>
        <Stack gap="sm" pb="sm">
          {aiMessages.length === 0 && (
             <Box ta="center" py="xl" c="dimmed" style={{ opacity: 0.7 }}>
                <ThemeIcon size={48} radius="xl" color="gray" variant="light" mb="sm">
                   <IconRobot size={24} />
                </ThemeIcon>
                <Text size="sm">Halo! Ketik perintah Anda.</Text>
                <Text size="xs">Contoh: "Cek kamar Deluxe kosong besok"</Text>
             </Box>
          )}

          {aiMessages.map((msg, idx) => (
            <Paper 
              key={idx}
              p="sm"
              radius="md"
              style={{
                background: msg.type === 'user' ? '#e0f2fe' : msg.type === 'system' ? '#ffe3e3' : 'white',
                alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                border: msg.type === 'ai' ? '1px solid #e9ecef' : 'none',
                color: msg.type === 'system' ? 'red' : 'inherit'
              }}
            >
              <Group gap="xs" align="flex-start">
                {msg.type === 'ai' && (
                  <ThemeIcon size="sm" color="teal" variant="light" mt={2}>
                    <IconSparkles size={12} />
                  </ThemeIcon>
                )}
                <Box style={{ flex: 1 }}>
                   <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                   <Text size="10px" c="dimmed" ta="right" mt={4}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </Text>
                </Box>
              </Group>
            </Paper>
          ))}
          
          {loading && (
            <Paper p="xs" radius="md" bg="white" withBorder style={{ alignSelf: 'flex-start' }}>
              <Group gap="xs">
                 <Loader size="xs" color="teal" />
                 <Text size="xs" c="dimmed">AI sedang mengetik...</Text>
              </Group>
            </Paper>
          )}
        </Stack>
      </ScrollArea>

      {/* Input Area */}
      <Group gap="xs" align="flex-end" style={{ marginTop: 'auto' }}>
        <Textarea
          placeholder="Ketik perintah..."
          value={aiInput}
          onChange={(e) => setAiInput(e.currentTarget.value)}
          onKeyDown={handleKeyPress}
          autosize
          minRows={2}
          maxRows={4}
          style={{ flex: 1 }}
          disabled={loading}
        />
        <ActionIcon 
          size={36} 
          color="teal" 
          variant="filled"
          onClick={handleAiSend}
          loading={loading}
          disabled={!aiInput.trim()}
        >
          <IconSend size={18} />
        </ActionIcon>
      </Group>
    </Stack>
  );
}