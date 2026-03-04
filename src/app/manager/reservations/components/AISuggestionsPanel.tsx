// src/app/manager/reservations/components/AISuggestionsPanel.tsx
'use client';

import { useState } from 'react';
import { Stack, Paper, Group, Text, ThemeIcon, Divider, Textarea, ActionIcon, Loader } from '@mantine/core';
import { IconTrendingUp, IconAlertCircle, IconSparkles, IconSend } from '@tabler/icons-react';
import { chatWithManagerAI } from '../../ai-agent/actions'; // Import action

const MOCK_AI_SUGGESTIONS = [
  { id: 's1', type: 'upsell', icon: IconTrendingUp, title: 'Upselling Opportunity', message: 'Tawarkan Suite Room dengan diskon 10% untuk tamu VIP hari ini', priority: 'high' },
  { id: 's2', type: 'alert', icon: IconAlertCircle, title: 'Konflik Jadwal', message: 'Terdapat potensi konflik booking pada tanggal yang sama', priority: 'urgent' },
];

export function AISuggestionsPanel() {
  return (
    <Stack gap="xs">
      <Divider label="Saran Strategis" labelPosition="center" />
      {MOCK_AI_SUGGESTIONS.map((suggestion) => (
        <Paper 
          key={suggestion.id} p="sm" radius="md" withBorder
          style={{ 
            background: suggestion.priority === 'urgent' ? '#fef3c7' : '#e0e7ff',
            borderLeft: `3px solid ${suggestion.priority === 'urgent' ? '#f59e0b' : '#4f46e5'}`
          }}
        >
          <Group gap="xs" align="flex-start">
            <ThemeIcon size="sm" color={suggestion.priority === 'urgent' ? 'yellow' : 'indigo'} variant="light">
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
  const [aiMessages, setAiMessages] = useState<{role: string, text: string}[]>([
    { role: 'ai', text: 'Halo Manager! Tanyakan ketersediaan kamar, laporan, atau riwayat tamu kepada saya.' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAiSend = async () => {
    if (!aiInput.trim() || isLoading) return;
    
    const input = aiInput;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', text: input }]);
    setIsLoading(true);

    try {
      const historyForApi = aiMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }));
      
      const response = await chatWithManagerAI(input, historyForApi as any);
      setAiMessages(prev => [...prev, { role: 'ai', text: response.content || "Tugas selesai dikerjakan." }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'ai', text: "Maaf, sistem sedang sibuk." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack gap="md" style={{ height: '100%' }}>
      <Paper p="md" radius="md" withBorder style={{ background: 'linear-gradient(135deg, #1c7ed6 0%, #3b5bdb 100%)' }}>
        <Group gap="xs">
          <ThemeIcon size="xl" color="white" variant="light" style={{ background: 'rgba(255,255,255,0.2)' }}><IconSparkles size={28} stroke={2} /></ThemeIcon>
          <div><Text c="white" fw={600}>Manager AI Agent</Text><Text c="blue.1" size="xs">Analitik & Data Tamu</Text></div>
        </Group>
      </Paper>

      <Stack gap="sm" style={{ flex: 1, overflowY: 'auto' }}>
        {aiMessages.map((msg, idx) => (
          <Paper key={idx} p="sm" radius="md" style={{ background: msg.role === 'ai' ? 'white' : '#e7f5ff', alignSelf: msg.role === 'ai' ? 'flex-start' : 'flex-end', maxWidth: '85%', border: msg.role === 'ai' ? '1px solid #e9ecef' : 'none' }}>
            <Group gap="xs" align="flex-start">
              {msg.role === 'ai' && <ThemeIcon size="sm" color="blue" variant="light"><IconSparkles size={14} /></ThemeIcon>}
              <Text size="sm" style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{msg.text}</Text>
            </Group>
          </Paper>
        ))}
        {isLoading && (
          <Group gap="xs" mt="xs"><Loader size="xs" color="blue" /><Text size="xs" c="dimmed">Menganalisis...</Text></Group>
        )}
      </Stack>

      <Group gap="xs" align="flex-end">
        <Textarea placeholder="Ketik perintah laporan/analisis..." value={aiInput} onChange={(e) => setAiInput(e.currentTarget.value)} autosize minRows={2} maxRows={4} style={{ flex: 1 }} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSend(); }}}/>
        <ActionIcon size={36} color="blue" variant="filled" onClick={handleAiSend} disabled={!aiInput.trim() || isLoading}><IconSend size={18} /></ActionIcon>
      </Group>
    </Stack>
  );
}