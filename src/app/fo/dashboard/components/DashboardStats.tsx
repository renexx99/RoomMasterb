'use client';

import { SimpleGrid } from '@mantine/core';
import StatsCard from '@/components/Dashboard/StatsCard';

interface StatItem {
  title: string;
  value: string;
  diff: number;
  period?: string;
}

interface Props {
  data: StatItem[];
}

export function DashboardStats({ data }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
      {data.map((stat) => (
        <StatsCard key={stat.title} data={stat} />
      ))}
    </SimpleGrid>
  );
}