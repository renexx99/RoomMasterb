// src/app/fo/dashboard/components/ProactiveInsightsWidget.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Paper, Group, Text, ThemeIcon, Badge, Stack, Skeleton, Box, Transition } from '@mantine/core';
import {
  IconChartLine,
  IconCoin,
  IconUser,
  IconAlertTriangle,
  IconBed,
  IconSparkles,
} from '@tabler/icons-react';
import { generateFOInsights, FOSummaryData } from '../actions';

// --- Helper: Icon Mapper ---
function getInsightIcon(iconType: string) {
  const iconMap: Record<string, React.ReactNode> = {
    chart: <IconChartLine size={18} stroke={1.5} />,
    coin: <IconCoin size={18} stroke={1.5} />,
    user: <IconUser size={18} stroke={1.5} />,
    alert: <IconAlertTriangle size={18} stroke={1.5} />,
    bed: <IconBed size={18} stroke={1.5} />,
  };
  return iconMap[iconType] || <IconSparkles size={18} stroke={1.5} />;
}

// --- Helper: Kategori Badge Color ---
function getKategoriColor(kategori: string) {
  switch (kategori) {
    case 'Pelayanan': return 'teal';
    case 'Operasional': return 'indigo';
    case 'Risiko': return 'red';
    default: return 'gray';
  }
}

interface InsightItem {
  kategori: string;
  text: string;
  color: string;
  iconType: string;
}

interface Props {
  summaryData: FOSummaryData;
}

export function ProactiveInsightsWidget({ summaryData }: Props) {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchInsights() {
      try {
        setIsLoading(true);
        setHasError(false);
        const result = await generateFOInsights(summaryData);
        if (isMounted) {
          setInsights(result);
        }
      } catch (err) {
        console.error('Failed to fetch FO insights:', err);
        if (isMounted) setHasError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchInsights();
    return () => { isMounted = false; };
  }, []);

  return (
    <Paper
      p="md"
      radius="md"
      withBorder
      style={{
        borderColor: '#e9ecef',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient accent bar */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #20c997, #339af0, #845ef7)',
          borderRadius: '8px 8px 0 0',
        }}
      />

      <Group justify="space-between" mb="sm" mt={4}>
        <Group gap="xs">
          <ThemeIcon size={28} radius="md" variant="light" color="teal" style={{ background: 'rgba(32, 201, 151, 0.08)' }}>
            <IconSparkles size={16} stroke={1.5} />
          </ThemeIcon>
          <div>
            <Text size="sm" fw={700} style={{ letterSpacing: '-0.2px' }}>
              AI Daily Briefing
            </Text>
            <Text size="xs" c="dimmed">AI Recommendation</Text>
          </div>
        </Group>
        <Badge size="xs" variant="dot" color="teal">
          Live
        </Badge>
      </Group>

      {/* Loading State */}
      {isLoading && (
        <Stack gap="xs">
          {[1, 2, 3].map((i) => (
            <Paper key={i} p="sm" radius="sm" style={{ background: '#f8f9fa', border: '1px solid #f1f3f5' }}>
              <Group gap="sm" wrap="nowrap">
                <Skeleton height={32} width={32} radius="md" />
                <div style={{ flex: 1 }}>
                  <Skeleton height={10} width="25%" mb={6} radius="xl" />
                  <Skeleton height={12} width="85%" radius="xl" />
                </div>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Error State */}
      {!isLoading && hasError && (
        <Paper p="sm" radius="sm" style={{ background: '#fff5f5', border: '1px solid #ffe3e3' }}>
          <Group gap="xs">
            <IconAlertTriangle size={16} color="#e03131" />
            <Text size="xs" c="red.7">Gagal memuat briefing AI. Koneksi ke AI tidak tersedia saat ini.</Text>
          </Group>
        </Paper>
      )}

      {/* Empty State */}
      {!isLoading && !hasError && insights.length === 0 && (
        <Paper p="sm" radius="sm" style={{ background: '#f8f9fa', border: '1px solid #f1f3f5' }}>
          <Text size="xs" c="dimmed" ta="center">Tidak ada briefing tersedia saat ini.</Text>
        </Paper>
      )}

      {/* Insights List */}
      {!isLoading && !hasError && insights.length > 0 && (
        <Stack gap="xs">
          {insights.map((insight, index) => (
            <Transition key={index} mounted={!isLoading} transition="slide-up" duration={300 + index * 150}>
              {(styles) => (
                <Paper
                  p="sm"
                  radius="sm"
                  style={{
                    ...styles,
                    background: '#fff',
                    border: '1px solid #f1f3f5',
                    transition: 'all 0.2s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e: any) => {
                    e.currentTarget.style.background = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }}
                  onMouseLeave={(e: any) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#f1f3f5';
                  }}
                >
                  <Group gap="sm" wrap="nowrap" align="flex-start">
                    <ThemeIcon
                      size={32}
                      radius="md"
                      variant="light"
                      color={insight.color}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    >
                      {getInsightIcon(insight.iconType)}
                    </ThemeIcon>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Badge
                        size="xs"
                        variant="light"
                        color={getKategoriColor(insight.kategori)}
                        mb={4}
                        style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
                      >
                        {insight.kategori}
                      </Badge>
                      <Text size="sm" lh={1.5} style={{ color: '#343a40' }}>
                        {insight.text}
                      </Text>
                    </div>
                  </Group>
                </Paper>
              )}
            </Transition>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
