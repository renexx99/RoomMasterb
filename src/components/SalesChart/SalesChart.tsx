// Lokasi: src/components/SalesChart/SalesChart.tsx

'use client';

import {
  ActionIcon,
  Group,
  Paper,
  PaperProps, // Diganti dari Surface
  Text,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import dynamic from 'next/dynamic';
import { DataTable } from 'mantine-datatable'; // Anda perlu install 'mantine-datatable'
import { IconDotsVertical } from '@tabler/icons-react';
import ErrorAlert from '@/components/ErrorAlert'; // Impor diperbaiki

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false }); // Anda perlu install 'react-apexcharts' dan 'apexcharts'

type SalesChartProps = PaperProps;

// --- DATA DUMMY LOKAL (Menggantikan useFetchData) ---
// Ini untuk tabel kecil di bawah grafik donat
const salesData = [
  { source: 'Direct', revenue: '268', value: '+4.2%' },
  { source: 'Referral', revenue: '192', value: '-1.2%' },
  { source: 'Social', revenue: '98', value: '+2.1%' },
  { source: 'Email', revenue: '120', value: '+3.5%' },
];
// --- Akhir Data Dummy ---

const SalesChart = ({ ...others }: SalesChartProps) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const series = [44, 55, 41, 17, 15]; // Data dummy untuk grafiknya

  const salesError = null;
  const salesLoading = false;

  const options: any = {
    chart: { type: 'donut', fontFamily: 'Open Sans, sans-serif' },
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: { enabled: false },
    states: {
      hover: { filter: { type: 'lighten', value: 0.5 } },
      active: { filter: { type: 'none', value: 0 } },
    },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '12px',
              fontWeight: '400',
              color:
                colorScheme === 'dark' ? theme.white : theme.colors.dark[6],
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: '600',
              color:
                colorScheme === 'dark' ? theme.white : theme.colors.dark[6],
            },
            total: {
              show: true,
              showAlways: true,
              formatter: function (w: any) {
                const totals = w.globals.seriesTotals;

                const result = totals.reduce(
                  (a: number, b: number) => a + b,
                  0,
                );

                return (result / 1000).toFixed(3);
              },
              color:
                colorScheme === 'dark' ? theme.white : theme.colors.dark[6],
            },
          },
        },
      },
    },
    colors: [
      theme.colors[theme.primaryColor][9],
      theme.colors[theme.primaryColor][5],
      theme.colors[theme.primaryColor][3],
      theme.colors[theme.primaryColor][2],
    ],
  };

  return (
    // --- Mengganti Surface dengan Paper ---
    <Paper
      p="md"
      shadow="md"
      radius="md"
      withBorder
      style={{ height: '100%' }}
      {...others}
    >
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={600}>
          Penjualan Mingguan (Contoh)
        </Text>
        <ActionIcon variant="subtle">
          <IconDotsVertical size={16} />
        </ActionIcon>
      </Group>
      {/*@ts-ignore*/}
      <Chart
        options={options}
        series={series}
        type="donut"
        height={160}
        width={'100%'}
      />
      {salesError ? (
        <ErrorAlert
          title="Error loading sales data" message={undefined}          // message={salesError.toString()}
        />
      ) : (
        <DataTable
          highlightOnHover
          // --- [PERBAIKAN] Tambahkan idAccessor di sini ---
          idAccessor="source"
          // ---
          columns={[
            { accessor: 'source' },
            { accessor: 'revenue' },
            { accessor: 'value' },
          ]}
          records={salesData.slice(0, 4)} // Menggunakan salesData dummy
          height={200}
          fetching={salesLoading}
        />
      )}
    </Paper>
  );
};

export default SalesChart;