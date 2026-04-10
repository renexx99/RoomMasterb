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
        title: 'Task Completed! ✨',
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
    <Container fluid px="md" py="md">
      <Tabs defaultValue="active" radius="lg">
        <Tabs.List mb="md" grow style={{ background: 'white', borderRadius: 12, padding: 4 }}>
          <Tabs.Tab
            value="active"
            leftSection={<IconChecklist size={16} />}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            Active ({activeTasks.length})
          </Tabs.Tab>
          <Tabs.Tab
            value="completed"
            leftSection={<IconCircleCheck size={16} />}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            Done ({completedTasks.length})
          </Tabs.Tab>
        </Tabs.List>

        {/* ====== ACTIVE TASKS ====== */}
        <Tabs.Panel value="active">
          {activeTasks.length === 0 ? (
            <Paper radius="lg" p="xl" ta="center" withBorder>
              <IconCheck size={48} color="var(--mantine-color-teal-5)" stroke={1.5} />
              <Text size="lg" fw={700} mt="sm" c="dark.4">All caught up! 🎉</Text>
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
            <Paper radius="lg" p="xl" ta="center" withBorder>
              <IconClock size={48} color="var(--mantine-color-gray-4)" stroke={1.5} />
              <Text size="lg" fw={700} mt="sm" c="dark.4">No completed tasks today</Text>
              <Text size="sm" c="dimmed">Tasks completed today will appear here.</Text>
            </Paper>
          ) : (
            <Stack gap="xs">
              {completedTasks.map((task) => (
                <Paper
                  key={task.id}
                  radius="lg"
                  p="sm"
                  withBorder
                  style={{ background: 'white', opacity: 0.8 }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon size="lg" radius="lg" color="teal" variant="light">
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
      radius="lg"
      p="sm"
      withBorder
      style={{
        background: isInProgress
          ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
          : 'white',
        borderColor: isInProgress ? '#fcd34d' : undefined,
        transition: 'all 0.2s ease',
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
        <Group gap="sm" wrap="nowrap">
          <Box
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: isInProgress
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isInProgress
                ? '0 2px 8px rgba(245, 158, 11, 0.3)'
                : 'none',
            }}
          >
            <Text size="md" fw={800} c="white">
              {task.room?.room_number || '?'}
            </Text>
          </Box>
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

      {/* Action Button */}
      {isInProgress && onComplete ? (
        <Button
          fullWidth
          size="sm"
          radius="lg"
          color="teal"
          leftSection={<IconCheck size={16} />}
          loading={loading}
          onClick={onComplete}
          style={{ fontWeight: 600 }}
        >
          Mark as Done
        </Button>
      ) : onStart ? (
        <Button
          fullWidth
          size="sm"
          radius="lg"
          color="orange"
          variant="light"
          leftSection={<IconPlayerPlay size={16} />}
          loading={loading}
          onClick={onStart}
          style={{ fontWeight: 600 }}
        >
          Start Cleaning
        </Button>
      ) : null}

      {/* Timer for in-progress */}
      {isInProgress && task.started_at && (
        <Text size="10px" c="orange.7" ta="center" mt={4}>
          ⏱ Started at {new Date(task.started_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}
    </Paper>
  );
}
