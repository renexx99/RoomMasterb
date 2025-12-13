// src/app/fo/dashboard/components/AICopilotWidget.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Paper, Group, ThemeIcon, Text, Badge, ActionIcon, ScrollArea, Stack,
  Box, Textarea, Tooltip, Transition
} from '@mantine/core';
import {
  IconSparkles, IconMaximize, IconMinimize, IconX, IconSend
} from '@tabler/icons-react';

interface ChatMessage {
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

export function AICopilotWidget() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    setChatHistory(prev => [...prev, {
      type: 'user',
      content: chatMessage,
      timestamp: new Date(),
    }]);

    // Simulasi respons AI
    setTimeout(() => {
      const responses = [
        'Room 101 is designated as Vacant Clean. You can proceed with check-in.',
        'Guest Mr. Smith requested a wake-up call at 06:00 AM. I have noted it.',
        'The housekeeping team has been notified about the extra bed for Room 205.',
        'Taxi for Room 303 has been scheduled for 2 PM.',
      ];
      
      setChatHistory(prev => [...prev, {
        type: 'ai',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      }]);
    }, 1000);

    setChatMessage('');
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <>
      {/* Floating Button */}
      {!isWidgetOpen && (
        <Tooltip label="Open AI Co-Pilot" position="left">
          <ActionIcon
            size={60} // Ukuran disamakan dengan Manager (60px)
            radius="xl"
            variant="gradient"
            gradient={{ from: 'teal', to: 'cyan' }} // Warna Tema FO
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              boxShadow: '0 4px 20px rgba(20, 184, 166, 0.4)',
              cursor: 'pointer',
              zIndex: 1000,
            }}
            onClick={() => setIsWidgetOpen(true)}
          >
            {/* Icon disamakan dengan Manager */}
            <IconSparkles size={28} stroke={2} />
          </ActionIcon>
        </Tooltip>
      )}

      {/* Widget Panel */}
      <Transition mounted={isWidgetOpen} transition="slide-up" duration={300} timingFunction="ease">
        {(styles) => (
          <Paper
            shadow="xl"
            radius="lg"
            style={{
              ...styles,
              position: 'fixed',
              bottom: isMaximized ? 0 : 24,
              right: isMaximized ? 0 : 24,
              width: isMaximized ? '100%' : 420, // Lebar disamakan (420px)
              height: isMaximized ? '100vh' : 600, // Tinggi disamakan (600px)
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              background: 'white',
              border: '2px solid #14b8a6', // Border warna FO (Teal)
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', padding: '12px 16px', borderRadius: isMaximized ? 0 : '12px 12px 0 0' }}>
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size={28} radius="md" color="white" variant="light">
                    <IconSparkles size={16} stroke={2} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" fw={700} c="white">AI Co-Pilot</Text>
                    <Badge size="xs" variant="light" color="white" c="teal" style={{ height: '16px', padding: '0 6px' }}>FO MODE</Badge>
                  </div>
                </Group>
                <Group gap={4}>
                  <ActionIcon size={28} variant="subtle" color="white" onClick={() => setIsMaximized(!isMaximized)}>
                    {isMaximized ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
                  </ActionIcon>
                  <ActionIcon size={28} variant="subtle" color="white" onClick={() => setIsWidgetOpen(false)}>
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            </Box>

            {/* Chat Area */}
            <ScrollArea style={{ flex: 1, padding: '12px 16px' }} viewportRef={chatScrollRef}>
              <Stack gap="sm">
                <Paper p="md" radius="md" style={{ background: 'white', border: '1px solid #e9ecef' }}>
                  <Group gap="xs" mb="xs">
                    <ThemeIcon size={28} radius="md" variant="light" color="teal">
                        <IconSparkles size={16} />
                    </ThemeIcon>
                    <Text size="sm" fw={700}>AI Co-Pilot</Text>
                  </Group>
                  <Text size="sm" style={{ lineHeight: 1.5 }} c="dimmed">
                    Halo! Saya adalah asisten AI Co-Pilot Anda, siap membantu operasional front office hotel Anda.
                  </Text>
                </Paper>

                {chatHistory.map((msg, idx) => (
                  <Box key={idx} style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
                    <Paper 
                      p="sm"
                      radius="md" 
                      style={{ 
                        maxWidth: '85%', 
                        // Warna bubble chat user disesuaikan dengan tema FO
                        background: msg.type === 'user' ? '#14b8a6' : '#f8f9fa', 
                        color: msg.type === 'user' ? 'white' : 'inherit',
                        border: msg.type === 'ai' ? '1px solid #e9ecef' : 'none'
                      }}
                    >
                      <Text size="sm">{msg.content}</Text>
                    </Paper>
                  </Box>
                ))}
              </Stack>
            </ScrollArea>

            {/* Input */}
            <Box p="md" style={{ borderTop: '1px solid #e9ecef', background: 'white' }}>
              <Group gap="xs" align="flex-end">
                <Textarea
                  placeholder="Type a command..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  minRows={1}
                  maxRows={3}
                  autosize
                  style={{ flex: 1 }}
                  onKeyPress={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                />
                <ActionIcon size={36} radius="md" variant="gradient" gradient={{ from: 'teal', to: 'cyan' }} onClick={handleSendMessage}>
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