'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Paper, Group, ThemeIcon, Text, Badge, ActionIcon, ScrollArea, Stack,
  Box, Button, Textarea, Tooltip, Transition, Loader
} from '@mantine/core';
import {
  IconSparkles, IconMaximize, IconMinimize, IconX, IconAlertCircle,
  IconSend, IconGift
} from '@tabler/icons-react';
// Import Server Action baru (pastikan file actions.ts sudah dibuat di folder parent)
import { chatWithStandardLLM } from '../actions'; 

interface ChatMessage {
  type: 'ai' | 'user' | 'system';
  content: string;
  timestamp: Date;
}

const aiInsights = [
    {
      id: 1,
      type: 'pricing',
      priority: 'high',
      title: 'Dynamic Pricing Alert',
      description: 'Weekend demand surge predicted (+42%). Optimize Deluxe pricing.',
      impact: '+Rp 3.2M',
      icon: IconSparkles,
      color: 'yellow',
      actionLabel: 'Apply',
    },
    {
      id: 2,
      type: 'loyalty',
      priority: 'medium',
      title: 'VIP Guest Incoming',
      description: 'Budi Hartono (Rp 12M LTV) arrives tomorrow. Prepare perks.',
      impact: '94% retention',
      icon: IconGift,
      color: 'pink',
      actionLabel: 'Approve',
    },
    {
      id: 3,
      type: 'maintenance',
      priority: 'urgent',
      title: 'Room 303 Alert',
      description: 'Maintenance exceeds 72h. Contact housekeeping now.',
      impact: '-Rp 850K/day',
      icon: IconAlertCircle,
      color: 'red',
      actionLabel: 'Escalate',
    },
];

export function AICopilotWidget() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeInsights, setActiveInsights] = useState([true, true, true]);
  const [isLoading, setIsLoading] = useState(false); // State untuk loading indicator
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const handleInsightAction = (id: number) => {
    setActiveInsights(prev => {
      const updated = [...prev];
      updated[id - 1] = false;
      return updated;
    });
    
    // Simulasi action lokal (karena ini dumb bot, dia tidak connect ke backend sebenarnya)
    const insight = aiInsights.find(i => i.id === id);
    if (insight) {
      setChatHistory(prev => [...prev, {
        type: 'system',
        content: `[System Log] Action "${insight.actionLabel}" clicked locally. (Note: Standard AI might not be aware of this action)`,
        timestamp: new Date(),
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isLoading) return;

    const userMsg = chatMessage;
    setChatMessage(''); // Clear input langsung
    setIsLoading(true);

    // 1. Tampilkan pesan user di UI
    const newUserLog: ChatMessage = {
      type: 'user',
      content: userMsg,
      timestamp: new Date(),
    };
    
    // Update history UI segera
    const updatedHistory = [...chatHistory, newUserLog];
    setChatHistory(updatedHistory);

    try {
      // 2. Panggil Server Action "Dumb Bot"
      // Kita kirim history sebelumnya (tanpa pesan user yg baru saja diketik)
      const response = await chatWithStandardLLM(userMsg, chatHistory);
      
      // 3. Masukkan balasan AI ke UI
      setChatHistory(prev => [...prev, {
        type: response.type as 'ai' | 'system',
        content: response.content,
        timestamp: new Date(response.timestamp)
      }]);

    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, {
        type: 'system',
        content: "Error: Gagal terhubung ke Standard AI Server.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  return (
    <>
      {/* Floating Button */}
      {!isWidgetOpen && (
        <Tooltip label="Open Standard AI (Test Mode)" position="left">
          <ActionIcon
            size={60}
            radius="xl"
            variant="gradient"
            gradient={{ from: 'orange', to: 'red' }} // Ubah warna jadi Orange/Red untuk membedakan dari Agentic AI
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              boxShadow: '0 4px 20px rgba(255, 100, 100, 0.4)',
              cursor: 'pointer',
              zIndex: 1000,
            }}
            onClick={() => setIsWidgetOpen(true)}
          >
            {/* Pakai icon Alert/Bug untuk menandakan ini mode testing/baseline */}
            <IconAlertCircle size={28} stroke={2} />
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
              width: isMaximized ? '100%' : 420,
              height: isMaximized ? '100vh' : 600,
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              background: 'white',
              border: '2px solid #ff8787', // Border merah muda
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box style={{ background: 'linear-gradient(135deg, #ff922b 0%, #fa5252 100%)', padding: '12px 16px', borderRadius: isMaximized ? 0 : '12px 12px 0 0' }}>
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size={28} radius="md" color="white" variant="light">
                    <IconAlertCircle size={16} stroke={2} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" fw={700} c="white">Standard AI (Baseline)</Text>
                    <Badge size="xs" variant="light" color="yellow" style={{ height: '16px', padding: '0 6px', color: 'black' }}>NO TOOLS</Badge>
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
                    <ThemeIcon size={28} radius="md" variant="light" color="orange"><IconAlertCircle size={16} /></ThemeIcon>
                    <Text size="sm" fw={700}>Baseline Mode Active</Text>
                  </Group>
                  <Text size="sm" style={{ lineHeight: 1.5 }} c="dimmed">
                    Mode ini mensimulasikan "Standard Chatbot" tanpa kemampuan Agentic ReAct. Gunakan ini untuk membandingkan kegagalan eksekusi tugas vs Agentic AI.
                  </Text>
                </Paper>

                {/* Quick Actions (Visual Only for Baseline) */}
                {activeInsights.filter(Boolean).length > 0 && (
                  <Box style={{ opacity: 0.6 }}> 
                    <Group gap="xs" mb="xs">
                      <Text size="xs" fw={700} c="dimmed">VISUAL MOCKUP (UNCONNECTED)</Text>
                    </Group>
                    <Stack gap={6}>
                      {aiInsights.map((insight, index) => (
                        activeInsights[index] && (
                          <Paper key={insight.id} p="xs" radius="sm" withBorder style={{ borderColor: '#e9ecef', background: 'white' }}>
                            <Stack gap={6}>
                              <Group gap="xs" wrap="nowrap" align="flex-start">
                                <ThemeIcon size={24} radius="sm" variant="light" color="gray">
                                  <insight.icon size={14} stroke={1.5} />
                                </ThemeIcon>
                                <div style={{ flex: 1 }}>
                                  <Text size="xs" fw={700} c="dimmed">{insight.title}</Text>
                                  <Text size="10px" c="dimmed">{insight.description}</Text>
                                </div>
                              </Group>
                            </Stack>
                          </Paper>
                        )
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Conversation */}
                {chatHistory.map((msg, idx) => (
                  <Box key={idx} style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
                    <Paper 
                      p="sm" 
                      radius="md" 
                      style={{ 
                        maxWidth: '85%', 
                        background: msg.type === 'user' ? '#ff922b' : '#f8f9fa', // Warna User jadi Orange di mode ini
                        color: msg.type === 'user' ? 'white' : 'inherit',
                        border: msg.type === 'system' ? '1px dashed red' : 'none'
                      }}
                    >
                      <Text size="sm">{msg.content}</Text>
                    </Paper>
                  </Box>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                   <Box style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Paper p="sm" radius="md" style={{ background: '#f8f9fa', maxWidth: '85%' }}>
                      <Group gap="xs">
                        <Loader size="xs" color="orange" type="dots" />
                        <Text size="xs" c="dimmed">Standard AI is generating text...</Text>
                      </Group>
                    </Paper>
                  </Box>
                )}
              </Stack>
            </ScrollArea>

            {/* Input */}
            <Box p="md" style={{ borderTop: '1px solid #e9ecef', background: 'white' }}>
              <Group gap="xs" align="flex-end">
                <Textarea
                  placeholder="Test Standard LLM (No Tools)..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  minRows={1}
                  maxRows={3}
                  autosize
                  disabled={isLoading}
                  style={{ flex: 1 }}
                  onKeyPress={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                />
                <ActionIcon 
                  size={36} 
                  radius="md" 
                  variant="gradient" 
                  gradient={{ from: 'orange', to: 'red' }} 
                  onClick={handleSendMessage}
                  loading={isLoading}
                >
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