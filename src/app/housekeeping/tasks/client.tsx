// src/app/housekeeping/tasks/client.tsx
'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Text,
  Group,
  Badge,
  Paper,
  Stack,
  Button,
  Tabs,
  ThemeIcon,
  Timeline,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlayerPlay,
  IconCheck,
  IconClock,
  IconSpray,
  IconChecklist,
  IconCircleCheck,
  IconBed,
  IconFlame,
  IconArrowRight,
} from '@tabler/icons-react';
import { startTask, completeTask } from './actions';
import { TASK_PRIORITIES } from '@/core/types/database';

interface ClientProps {
  activeTasks: any[];
  completedTasks: any[];
}

export default function TasksClient({ activeTasks, completedTasks }: ClientProps) {
  const [loadingTask, setLoadingTask] = useState<string | null>(null);

  const handleStart = async (taskId: string) => {
    setLoadingTask(taskId);
    try {
      const result = await startTask(taskId);
      if (result.error) throw new Error(result.error);
      notifications.show({
        title: 'Task Started',
        message: 'Room cleaning has been started',
        color: 'orange',
      });
      window.location.reload();
    } catch (err: any) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setLoadingTask(null);
    }
  };

  const handleComplete = async (taskId: string, roomId: string) => {
    setLoadingTask(taskId);
    try {
      const result = await completeTask(taskId, roomId);
      if (result.error) throw new Error(result.error);
      notifications.show({
        title: 'Task Completed',
        message: 'Room has been marked as clean',
        color: 'teal',
      });
      window.location.reload();
    } catch (err: any) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setLoadingTask(null);
    }
  };

  const pendingTasks = activeTasks.filter((t) => t.status === 'pending');
  const inProgressTasks = activeTasks.filter((t) => t.status === 'in_progress');

  const getPriorityConfig = (priority: string) => {
    const found = TASK_PRIORITIES.find((p) => p.value === priority);
    return found || { label: priority, color: 'gray' };
  };

  return (
    <Box style={{ background: '#f8f9fa', minHeight: '100%', padding: '1rem' }}>
      <Container fluid px={0} py={0}>
        <Tabs defaultValue="active" radius="md">
          <Tabs.List mb="md" style={{ background: 'white', borderRadius: 8 }}>
            <Tabs.Tab
              value="active"
              leftSection={<IconChecklist size={16} />}
              style={{ fontWeight: 600 }}
            >
              Active ({activeTasks.length})
            </Tabs.Tab>
            <Tabs.Tab
              value="completed"
              leftSection={<IconCircleCheck size={16} />}
              style={{ fontWeight: 600 }}
            >
              Done ({completedTasks.length})
            </Tabs.Tab>
          </Tabs.List>

          {/* ====== ACTIVE TASKS ====== */}
          <Tabs.Panel value="active">
            {activeTasks.length === 0 ? (
              <Paper radius="md" p="xl" ta="center" withBorder shadow="sm">
                <IconCheck size={48} color="var(--mantine-color-teal-5)" stroke={1.5} />
                <Text size="lg" fw={700} mt="sm" c="dark.4">All caught up!</Text>
                <Text size="sm" c="dimmed">No pending tasks right now.</Text>
              </Paper>
            ) : (
              <Stack gap="sm">
                {/* In Progress Section */}
                {inProgressTasks.length > 0 && (
                  <>
                    <Group gap="xs" mb={4}>
                      <ThemeIcon size="sm" radius="xl" color="orange" variant="light">
                        <IconSpray size={12} />
                      </ThemeIcon>
                      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                        In Progress ({inProgressTasks.length})
                      </Text>
                    </Group>
                    {inProgressTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        type="in_progress"
                        loading={loadingTask === task.id}
                        onComplete={() => handleComplete(task.id, task.room?.id)}
                        getPriorityConfig={getPriorityConfig}
                      />
                    ))}
                    <Divider my="xs" />
                  </>
                )}

                {/* Pending Section */}
                {pendingTasks.length > 0 && (
                  <>
                    <Group gap="xs" mb={4}>
                      <ThemeIcon size="sm" radius="xl" color="gray" variant="light">
                        <IconClock size={12} />
                      </ThemeIcon>
                      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                        Pending ({pendingTasks.length})
                      </Text>
                    </Group>
                    {pendingTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        type="pending"
                        loading={loadingTask === task.id}
                        onStart={() => handleStart(task.id)}
                        getPriorityConfig={getPriorityConfig}
                      />
                    ))}
                  </>
                )}
              </Stack>
            )}
          </Tabs.Panel>

          {/* ====== COMPLETED TASKS ====== */}
          <Tabs.Panel value="completed">
            {completedTasks.length === 0 ? (
              <Paper radius="md" p="xl" ta="center" withBorder shadow="sm">
                <IconClock size={48} color="var(--mantine-color-gray-4)" stroke={1.5} />
                <Text size="lg" fw={700} mt="sm" c="dark.4">No completed tasks today</Text>
                <Text size="sm" c="dimmed">Tasks completed today will appear here.</Text>
              </Paper>
            ) : (
              <Stack gap="xs">
                {completedTasks.map((task) => (
                  <Paper
                    key={task.id}
                    radius="md"
                    p="sm"
                    withBorder
                    shadow="sm"
                    style={{ background: 'white' }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap">
                        <ThemeIcon size="lg" radius="md" color="teal" variant="light">
                          <IconCheck size={16} />
                        </ThemeIcon>
                        <Box>
                          <Text size="sm" fw={600}>Room {task.room?.room_number}</Text>
                          <Text size="xs" c="dimmed">
                            {task.room?.room_type?.name} • Floor {task.room?.floor_number || '-'}
                          </Text>
                        </Box>
                      </Group>
                      <Box ta="right">
                        <Badge size="xs" color="teal" variant="light">Done</Badge>
                        <Text size="10px" c="dimmed" mt={2}>
                          {task.completed_at
                            ? new Date(task.completed_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </Text>
                      </Box>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Container>
    </Box>
  );
}

// ============ Task Card Component ============
function TaskCard({
  task,
  type,
  loading,
  onStart,
  onComplete,
  getPriorityConfig,
}: {
  task: any;
  type: 'pending' | 'in_progress';
  loading: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  getPriorityConfig: (p: string) => { label: string; color: string };
}) {
  const priorityConfig = getPriorityConfig(task.priority);
  const isInProgress = type === 'in_progress';

  const taskTypeLabels: Record<string, string> = {
    cleaning: 'Regular Cleaning',
    inspection: 'Inspection',
    turndown: 'Turndown Service',
    deep_cleaning: 'Deep Cleaning',
  };

  return (
    <Paper
      radius="md"
      p="sm"
      withBorder
      shadow={isInProgress ? 'sm' : 'none'}
      style={{
        background: isInProgress ? '#fff8e7' : 'white',
        borderColor: isInProgress ? '#fcd34d' : '#e5e7eb',
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon
            size="xl"
            radius="md"
            variant="light"
            color={isInProgress ? 'orange' : 'gray'}
          >
            <IconBed size={22} />
          </ThemeIcon>
          <Box>
            <Text size="sm" fw={700}>
              Room {task.room?.room_number}
            </Text>
            <Text size="xs" c="dimmed">
              {task.room?.room_type?.name} • Floor {task.room?.floor_number || '-'}
            </Text>
          </Box>
        </Group>

        <Stack gap={4} align="flex-end">
          <Badge size="xs" color={priorityConfig.color} variant="light">
            {priorityConfig.label}
          </Badge>
          <Badge size="xs" color="gray" variant="outline">
            {taskTypeLabels[task.task_type] || task.task_type}
          </Badge>
        </Stack>
      </Group>

      {/* Action Area */}
      <Group justify="space-between" align="center" mt="md">
        <Box>
          {isInProgress && task.started_at && (
            <Text size="xs" c="orange.7" fw={600}>
              Started at {new Date(task.started_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </Box>
        <Box style={{ flexShrink: 0, width: '140px' }}>
          {isInProgress && onComplete ? (
            <Button
              fullWidth
              size="sm"
              radius="md"
              color="teal"
              leftSection={<IconCheck size={16} />}
              loading={loading}
              onClick={onComplete}
            >
              Mark as Done
            </Button>
          ) : onStart ? (
            <Button
              fullWidth
              size="sm"
              radius="md"
              color="orange"
              variant="light"
              leftSection={<IconPlayerPlay size={16} />}
              loading={loading}
              onClick={onStart}
            >
              Start Cleaning
            </Button>
          ) : null}
        </Box>
      </Group>
    </Paper>
  );
}
