'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Paper, Group, ThemeIcon, Text, Badge, ActionIcon, ScrollArea, Stack,
  Box, Button, Textarea, Tooltip, Transition
} from '@mantine/core';
import {
  IconSparkles, IconMaximize, IconMinimize, IconX, IconAlertCircle,
  IconArrowUpRight, IconSend, IconGift, IconChartBar, IconBrandBooking
} from '@tabler/icons-react';

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
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const handleInsightAction = (id: number) => {
    setActiveInsights(prev => {
      const updated = [...prev];
      updated[id - 1] = false;
      return updated;
    });
    
    const insight = aiInsights.find(i => i.id === id);
    if (insight) {
      setChatHistory(prev => [...prev, {
        type: 'system',
        content: `Action "${insight.actionLabel}" applied for: ${insight.title}`,
        timestamp: new Date(),
      }]);
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    setChatHistory(prev => [...prev, {
      type: 'user',
      content: chatMessage,
      timestamp: new Date(),
    }]);

    setTimeout(() => {
      const responses = [
        'Based on current occupancy trends, I recommend increasing weekend rates by 15% for premium rooms.',
        'I\'ve analyzed the data. Your direct booking ratio is excellent! Consider allocating more budget to your website SEO.',
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
            size={60}
            radius="xl"
            variant="gradient"
            gradient={{ from: 'indigo', to: 'violet' }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              cursor: 'pointer',
              zIndex: 1000,
            }}
            onClick={() => setIsWidgetOpen(true)}
          >
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
              width: isMaximized ? '100%' : 420,
              height: isMaximized ? '100vh' : 600,
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              background: 'white',
              border: '2px solid #818cf8',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '12px 16px', borderRadius: isMaximized ? 0 : '12px 12px 0 0' }}>
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size={28} radius="md" color="white" variant="light">
                    <IconSparkles size={16} stroke={2} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" fw={700} c="white">AI Co-Pilot</Text>
                    <Badge size="xs" variant="light" color="green" style={{ height: '16px', padding: '0 6px' }}>LIVE</Badge>
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
                    <ThemeIcon size={28} radius="md" variant="light" color="violet"><IconSparkles size={16} /></ThemeIcon>
                    <Text size="sm" fw={700}>AI Co-Pilot</Text>
                  </Group>
                  <Text size="sm" style={{ lineHeight: 1.5 }} c="dimmed">
                    Hi! I'm your AI Co-Pilot. I can help you with pricing strategies, guest management, and operational insights.
                  </Text>
                </Paper>

                {/* Quick Actions */}
                {activeInsights.filter(Boolean).length > 0 && (
                  <Box>
                    <Group gap="xs" mb="xs">
                      <Text size="xs" fw={700} c="dimmed">QUICK ACTIONS</Text>
                      <Badge size="xs" variant="light" color="yellow" leftSection={<IconAlertCircle size={10} />}>
                        {activeInsights.filter(Boolean).length}
                      </Badge>
                    </Group>
                    <Stack gap={6}>
                      {aiInsights.map((insight, index) => (
                        activeInsights[index] && (
                          <Paper key={insight.id} p="xs" radius="sm" withBorder style={{ borderColor: insight.priority === 'urgent' ? '#fa5252' : '#e9ecef', background: 'white' }}>
                            <Stack gap={6}>
                              <Group gap="xs" wrap="nowrap" align="flex-start">
                                <ThemeIcon size={24} radius="sm" variant="light" color={insight.color}>
                                  <insight.icon size={14} stroke={1.5} />
                                </ThemeIcon>
                                <div style={{ flex: 1 }}>
                                  <Text size="xs" fw={700}>{insight.title}</Text>
                                  <Text size="10px" c="dimmed">{insight.description}</Text>
                                </div>
                              </Group>
                              <Button size="xs" variant="light" color={insight.color} fullWidth onClick={() => handleInsightAction(insight.id)}>
                                {insight.actionLabel}
                              </Button>
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
                    <Paper p="sm" radius="md" style={{ maxWidth: '85%', background: msg.type === 'user' ? '#667eea' : '#f8f9fa', color: msg.type === 'user' ? 'white' : 'inherit' }}>
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
                  placeholder="Ask AI..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  minRows={1}
                  maxRows={3}
                  autosize
                  style={{ flex: 1 }}
                  onKeyPress={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                />
                <ActionIcon size={36} radius="md" variant="gradient" gradient={{ from: 'indigo', to: 'violet' }} onClick={handleSendMessage}>
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