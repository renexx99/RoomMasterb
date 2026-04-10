// src/app/housekeeping/report/client.tsx
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
  Select,
  Textarea,
  Tabs,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconSend,
  IconHistory,
  IconCheck,
  IconClock,
  IconArrowUp,
  IconTool,
} from '@tabler/icons-react';
import { reportIssue } from './actions';
import {
  MAINTENANCE_CATEGORIES,
  SEVERITY_LEVELS,
} from '@/core/types/database';

interface ClientProps {
  rooms: any[];
  reports: any[];
  hotelId: string;
}

export default function ReportClient({ rooms, reports, hotelId }: ClientProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      roomId: '',
      category: '',
      severity: 'low',
      description: '',
    },
    validate: {
      roomId: (v) => (!v ? 'Select a room' : null),
      category: (v) => (!v ? 'Select a category' : null),
      description: (v) => (!v || v.length < 5 ? 'Describe the issue (min 5 chars)' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setSubmitting(true);
    try {
      const result = await reportIssue({
        hotelId,
        roomId: values.roomId,
        category: values.category,
        severity: values.severity,
        description: values.description,
      });

      if (result.error) throw new Error(result.error);

      notifications.show({
        title: 'Report Submitted ✅',
        message: 'Maintenance team has been notified',
        color: 'green',
      });
      form.reset();
      window.location.reload();
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to submit report',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <IconClock size={14} />;
      case 'in_progress': return <IconTool size={14} />;
      case 'resolved': return <IconCheck size={14} />;
      case 'escalated': return <IconArrowUp size={14} />;
      default: return <IconClock size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'orange';
      case 'in_progress': return 'blue';
      case 'resolved': return 'teal';
      case 'escalated': return 'red';
      default: return 'gray';
    }
  };

  const getSeverityColor = (severity: string) => {
    const found = SEVERITY_LEVELS.find(s => s.value === severity);
    return found?.color || 'gray';
  };

  return (
    <Container fluid px="md" py="md">
      <Tabs defaultValue="new" radius="lg">
        <Tabs.List mb="md" grow style={{ background: 'white', borderRadius: 12, padding: 4 }}>
          <Tabs.Tab
            value="new"
            leftSection={<IconAlertTriangle size={16} />}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            New Report
          </Tabs.Tab>
          <Tabs.Tab
            value="history"
            leftSection={<IconHistory size={16} />}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            History ({reports.length})
          </Tabs.Tab>
        </Tabs.List>

        {/* ====== NEW REPORT FORM ====== */}
        <Tabs.Panel value="new">
          <Paper radius="lg" p="lg" withBorder style={{ background: 'white' }}>
            {/* Header */}
            <Group gap="sm" mb="lg">
              <ThemeIcon
                size="lg"
                radius="lg"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                }}
              >
                <IconAlertTriangle size={18} color="white" />
              </ThemeIcon>
              <Box>
                <Text size="md" fw={700}>Report an Issue</Text>
                <Text size="xs" c="dimmed">
                  Found damage or a problem? Let maintenance know.
                </Text>
              </Box>
            </Group>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {/* Room Selection */}
                <Select
                  label="Room"
                  placeholder="Select room..."
                  data={rooms.map((r) => ({
                    value: r.id,
                    label: `${r.room_number} — ${r.room_type?.name || 'Unknown'}`,
                  }))}
                  searchable
                  size="md"
                  radius="lg"
                  styles={{
                    input: {
                      height: 48,
                      fontSize: '15px',
                    },
                  }}
                  {...form.getInputProps('roomId')}
                />

                {/* Category */}
                <Select
                  label="Category"
                  placeholder="Type of issue..."
                  data={MAINTENANCE_CATEGORIES.map(c => ({
                    value: c.value,
                    label: c.label,
                  }))}
                  size="md"
                  radius="lg"
                  styles={{
                    input: {
                      height: 48,
                      fontSize: '15px',
                    },
                  }}
                  {...form.getInputProps('category')}
                />

                {/* Severity */}
                <Select
                  label="Severity"
                  placeholder="How urgent?"
                  data={SEVERITY_LEVELS.map(s => ({
                    value: s.value,
                    label: s.label,
                  }))}
                  size="md"
                  radius="lg"
                  styles={{
                    input: {
                      height: 48,
                      fontSize: '15px',
                    },
                  }}
                  {...form.getInputProps('severity')}
                />

                {/* Description */}
                <Textarea
                  label="Description"
                  placeholder="Describe the issue in detail..."
                  minRows={4}
                  size="md"
                  radius="lg"
                  styles={{
                    input: {
                      fontSize: '15px',
                    },
                  }}
                  {...form.getInputProps('description')}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  radius="lg"
                  loading={submitting}
                  leftSection={<IconSend size={18} />}
                  style={{
                    height: 52,
                    fontSize: '16px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  Submit Report
                </Button>
              </Stack>
            </form>
          </Paper>
        </Tabs.Panel>

        {/* ====== REPORT HISTORY ====== */}
        <Tabs.Panel value="history">
          {reports.length === 0 ? (
            <Paper radius="lg" p="xl" ta="center" withBorder>
              <IconHistory size={48} color="var(--mantine-color-gray-4)" stroke={1.5} />
              <Text size="lg" fw={700} mt="sm" c="dark.4">No reports yet</Text>
              <Text size="sm" c="dimmed">Your submitted reports will appear here.</Text>
            </Paper>
          ) : (
            <Stack gap="xs">
              {reports.map((report) => (
                <Paper
                  key={report.id}
                  radius="lg"
                  p="sm"
                  withBorder
                  style={{ background: 'white' }}
                >
                  <Group justify="space-between" align="flex-start" wrap="nowrap" mb={4}>
                    <Group gap="sm" wrap="nowrap">
                      <Box
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: `var(--mantine-color-${getSeverityColor(report.severity)}-0)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: `var(--mantine-color-${getSeverityColor(report.severity)}-7)`,
                          flexShrink: 0,
                        }}
                      >
                        <IconAlertTriangle size={18} />
                      </Box>
                      <Box style={{ minWidth: 0 }}>
                        <Text size="sm" fw={600} lineClamp={1}>
                          Room {report.room?.room_number} — {report.category}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {report.description}
                        </Text>
                      </Box>
                    </Group>

                    <Stack gap={4} align="flex-end" style={{ flexShrink: 0 }}>
                      <Badge
                        size="xs"
                        variant="light"
                        color={getStatusColor(report.status)}
                        leftSection={getStatusIcon(report.status)}
                      >
                        {report.status}
                      </Badge>
                      <Badge size="xs" variant="outline" color={getSeverityColor(report.severity)}>
                        {report.severity}
                      </Badge>
                    </Stack>
                  </Group>

                  <Text size="10px" c="dimmed" ta="right">
                    {new Date(report.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </Paper>
              ))}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
