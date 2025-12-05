// src/app/fo/reservations/components/AISuggestionsPanel.tsx
'use client';

import { useState } from 'react';
import {
  Stack, Paper, Group, Text, ThemeIcon, Divider, Textarea, ActionIcon
} from '@mantine/core';
import { 
  IconTrendingUp, IconAlertCircle, IconSparkles, IconRobot, IconSend 
} from '@tabler/icons-react';

const MOCK_AI_SUGGESTIONS = [
  { 
    id: 's1', 
    type: 'upsell', 
    icon: IconTrendingUp, 
    title: 'Upselling Opportunity', 
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
    title: 'Smart Tip', 
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
  const [aiMessages, setAiMessages] = useState([
    { 
      role: 'ai', 
      text: 'Halo! Saya AI Assistant. Ketik perintah seperti "Carikan kamar Deluxe untuk 3 malam" atau tanya saya tentang ketersediaan.' 
    }
  ]);
  const [aiInput, setAiInput] = useState('');

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    
    setAiMessages(prev => [...prev, { role: 'user', text: aiInput }]);
    
    // Mock AI Response
    setTimeout(() => {
      setAiMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'Saya menemukan 3 kamar Deluxe tersedia. Kamar 203 (Lt.2) dengan view taman sangat cocok. Harga: Rp 850.000/malam. Apakah ingin saya buatkan booking?'
      }]);
    }, 800);
    
    setAiInput('');
  };

  return (
    <Stack gap="md" style={{ height: '100%' }}>
      <Paper p="md" radius="md" withBorder style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)' }}>
        <Group gap="xs">
          <ThemeIcon size="xl" color="white" variant="light" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <IconRobot size={24} />
          </ThemeIcon>
          <div>
            <Text c="white" fw={600}>AI Reservation Assistant</Text>
            <Text c="teal.0" size="xs">Ketik perintah dalam bahasa natural</Text>
          </div>
        </Group>
      </Paper>

      {/* Chat Messages */}
      <Stack gap="sm" style={{ flex: 1 }}>
        {aiMessages.map((msg, idx) => (
          <Paper 
            key={idx}
            p="sm"
            radius="md"
            style={{
              background: msg.role === 'ai' ? 'white' : '#e0f2fe',
              alignSelf: msg.role === 'ai' ? 'flex-start' : 'flex-end',
              maxWidth: '85%',
              border: msg.role === 'ai' ? '1px solid #e9ecef' : 'none'
            }}
          >
            <Group gap="xs" align="flex-start">
              {msg.role === 'ai' && (
                <ThemeIcon size="sm" color="teal" variant="light">
                  <IconSparkles size={14} />
                </ThemeIcon>
              )}
              <Text size="sm" style={{ flex: 1 }}>{msg.text}</Text>
            </Group>
          </Paper>
        ))}
      </Stack>

      {/* Input */}
      <Group gap="xs" align="flex-end">
        <Textarea
          placeholder="Contoh: Carikan kamar view laut untuk 2 malam..."
          value={aiInput}
          onChange={(e) => setAiInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAiSend();
            }
          }}
          autosize
          minRows={2}
          maxRows={4}
          style={{ flex: 1 }}
        />
        <ActionIcon 
          size={36} 
          color="teal" 
          variant="filled"
          onClick={handleAiSend}
          disabled={!aiInput.trim()}
        >
          <IconSend size={18} />
        </ActionIcon>
      </Group>
    </Stack>
  );
}