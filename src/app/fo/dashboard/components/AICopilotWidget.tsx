'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Paper, Group, ThemeIcon, Text, Badge, ActionIcon, ScrollArea, Stack,
  Box, Textarea, Tooltip, Transition
} from '@mantine/core';
import {
  IconRobot, IconMaximize, IconMinimize, IconX, IconSend, IconMessage
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
        <Tooltip label="FO Assistant" position="left">
          <ActionIcon
            size={56}
            radius="xl"
            variant="gradient"
            gradient={{ from: 'teal', to: 'cyan' }}
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
            <IconRobot size={28} stroke={1.5} />
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
              width: isMaximized ? '100%' : 380,
              height: isMaximized ? '100vh' : 500,
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              background: 'white',
              border: '1px solid #20c997', // Teal border
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', padding: '12px 16px', borderRadius: isMaximized ? 0 : '12px 12px 0 0' }}>
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size={28} radius="md" color="white" variant="light">
                    <IconRobot size={18} stroke={2} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" fw={700} c="white">FO Assistant</Text>
                    <Badge size="xs" variant="light" color="white" c="teal" style={{ height: '16px', padding: '0 6px' }}>ONLINE</Badge>
                  </div>
                </Group>
                <Group gap={4}>
                  <ActionIcon size={24} variant="subtle" color="white" onClick={() => setIsMaximized(!isMaximized)}>
                    {isMaximized ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
                  </ActionIcon>
                  <ActionIcon size={24} variant="subtle" color="white" onClick={() => setIsWidgetOpen(false)}>
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            </Box>

            {/* Chat Area */}
            <ScrollArea style={{ flex: 1, padding: '12px 16px' }} viewportRef={chatScrollRef} bg="gray.0">
              <Stack gap="sm">
                <Paper p="sm" radius="md" bg="white" withBorder style={{ borderColor: '#e9ecef' }}>
                  <Group gap="xs" mb={4}>
                    <IconMessage size={14} color="gray" />
                    <Text size="xs" fw={600} c="dimmed">System</Text>
                  </Group>
                  <Text size="sm">Hello! I can help you with room status, quick guest lookups, or housekeeping requests.</Text>
                </Paper>

                {chatHistory.map((msg, idx) => (
                  <Box key={idx} style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
                    <Paper 
                      p="xs" 
                      px="sm"
                      radius="md" 
                      style={{ 
                        maxWidth: '85%', 
                        background: msg.type === 'user' ? '#14b8a6' : 'white', 
                        color: msg.type === 'user' ? 'white' : 'inherit',
                        border: msg.type === 'ai' ? '1px solid #e9ecef' : 'none'
                      }}
                    >
                      <Text size="sm">{msg.content}</Text>
                      <Text size="9px" c={msg.type === 'user' ? 'rgba(255,255,255,0.7)' : 'dimmed'} mt={2} ta="right">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Paper>
                  </Box>
                ))}
              </Stack>
            </ScrollArea>

            {/* Input */}
            <Box p="sm" bg="white" style={{ borderTop: '1px solid #e9ecef' }}>
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
                <ActionIcon size={36} radius="md" color="teal" variant="filled" onClick={handleSendMessage}>
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