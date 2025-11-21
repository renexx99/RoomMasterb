// src/app/fo/billing/components/BillingFolioModal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Modal, SegmentedControl, Stack, Table, Title, Text, TextInput,
  NumberInput, Group, Button, Select, Paper
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconReceipt, IconCash, IconPlus } from '@tabler/icons-react';
import { ReservationDetails } from '../page';
import { addChargeAction, processPaymentAction } from '../actions';

// Tipe Lokal untuk Item Folio Mock
interface FolioItem {
  id: string;
  description: string;
  amount: number;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  reservation: ReservationDetails | null;
}

export function BillingFolioModal({ opened, onClose, reservation }: Props) {
  const [view, setView] = useState<'folio' | 'charge' | 'payment'>('folio');
  const [loading, setLoading] = useState(false);
  
  // State Mock untuk Item Folio (Reset saat modal dibuka dengan reservasi baru)
  const [folioItems, setFolioItems] = useState<FolioItem[]>([]);

  // Reset & Init Mock Data saat modal dibuka
  useEffect(() => {
    if (opened && reservation) {
      setView('folio');
      // Simulasi data awal
      setFolioItems([
        { id: 'mock1', description: 'Biaya Kamar (Deposit Awal)', amount: reservation.total_price },
        { id: 'mock2', description: 'Laundry Service', amount: 75000 },
        { id: 'mock3', description: 'Minibar - Soft Drink', amount: 25000 },
      ]);
    } else {
      setFolioItems([]);
    }
  }, [opened, reservation]);

  // --- Kalkulasi Total ---
  const totalBill = folioItems.reduce((acc, item) => acc + item.amount, 0);

  // --- Form Charge ---
  const chargeForm = useForm({
    initialValues: { description: '', amount: 0 },
    validate: {
      description: (v) => (v ? null : 'Wajib diisi'),
      amount: (v) => (v > 0 ? null : 'Harus > 0'),
    },
  });

  // --- Form Payment ---
  const paymentForm = useForm({
    initialValues: { method: 'Cash', amount: 0, notes: '' },
    validate: {
      method: (v) => (v ? null : 'Pilih metode'),
      amount: (v) => (v > 0 ? null : 'Harus > 0'),
    },
  });

  // --- Handlers ---
  const handleAddCharge = async (values: typeof chargeForm.values) => {
    if (!reservation) return;
    setLoading(true);
    
    // Panggil Server Action
    await addChargeAction(reservation.id, values.description, values.amount);
    
    // Update UI Optimistic
    setFolioItems(prev => [...prev, {
      id: Math.random().toString(),
      description: values.description,
      amount: values.amount
    }]);
    
    notifications.show({ title: 'Sukses', message: 'Biaya ditambahkan', color: 'teal' });
    chargeForm.reset();
    setView('folio');
    setLoading(false);
  };

  const handlePayment = async (values: typeof paymentForm.values) => {
    if (!reservation) return;
    setLoading(true);

    const res = await processPaymentAction(reservation.id, values.amount, values.method);
    
    if (res.error) {
      notifications.show({ title: 'Gagal', message: res.error, color: 'red' });
    } else {
      notifications.show({ title: 'Sukses', message: res.message, color: 'green' });
      onClose(); // Tutup modal setelah bayar sukses (MVP)
    }
    setLoading(false);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>Folio Tamu: {reservation?.guest?.full_name}</Text>}
      size="lg"
      centered
    >
      <SegmentedControl
        fullWidth
        color="teal"
        value={view}
        onChange={(val) => setView(val as any)}
        data={[
          { label: 'Rincian', value: 'folio' },
          { label: 'Tambah Biaya', value: 'charge' },
          { label: 'Bayar', value: 'payment' },
        ]}
        mb="lg"
      />

      {/* VIEW: FOLIO */}
      {view === 'folio' && (
        <Stack gap="md">
          <Paper withBorder radius="sm" p={0} style={{ overflow: 'hidden' }}>
            <Table striped highlightOnHover>
                <Table.Thead bg="gray.0">
                <Table.Tr>
                    <Table.Th>Deskripsi</Table.Th>
                    <Table.Th ta="right">Jumlah</Table.Th>
                </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                {folioItems.map((item) => (
                    <Table.Tr key={item.id}>
                    <Table.Td>{item.description}</Table.Td>
                    <Table.Td ta="right">Rp {item.amount.toLocaleString('id-ID')}</Table.Td>
                    </Table.Tr>
                ))}
                </Table.Tbody>
                <Table.Tfoot>
                    <Table.Tr>
                        <Table.Th><Text fw={700}>Total Tagihan</Text></Table.Th>
                        <Table.Th ta="right"><Text fw={700} c="teal">Rp {totalBill.toLocaleString('id-ID')}</Text></Table.Th>
                    </Table.Tr>
                </Table.Tfoot>
            </Table>
          </Paper>
          <Text size="xs" c="dimmed" ta="center">Data di atas adalah simulasi untuk demo UI.</Text>
        </Stack>
      )}

      {/* VIEW: CHARGE */}
      {view === 'charge' && (
        <form onSubmit={chargeForm.onSubmit(handleAddCharge)}>
          <Stack gap="md">
            <TextInput
              label="Deskripsi Biaya"
              placeholder="Contoh: Extra Bed, Minibar"
              required
              leftSection={<IconReceipt size={16} />}
              {...chargeForm.getInputProps('description')}
            />
            <NumberInput
              label="Nominal (Rp)"
              placeholder="0"
              required
              min={0}
              thousandSeparator="."
              decimalSeparator=","
              hideControls
              leftSection={<IconCash size={16} />}
              {...chargeForm.getInputProps('amount')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setView('folio')}>Batal</Button>
              <Button type="submit" color="teal" loading={loading} leftSection={<IconPlus size={16}/>}>Tambah</Button>
            </Group>
          </Stack>
        </form>
      )}

      {/* VIEW: PAYMENT */}
      {view === 'payment' && (
        <form onSubmit={paymentForm.onSubmit(handlePayment)}>
          <Stack gap="md">
            <Paper bg="teal.0" p="sm" radius="md" withBorder>
                <Group justify="space-between">
                    <Text size="sm">Total Tagihan:</Text>
                    <Text fw={700} c="teal.9" size="lg">Rp {totalBill.toLocaleString('id-ID')}</Text>
                </Group>
            </Paper>
            <Select
              label="Metode Pembayaran"
              data={['Cash', 'Credit Card', 'QRIS', 'Transfer']}
              required
              {...paymentForm.getInputProps('method')}
            />
            <NumberInput
              label="Jumlah Bayar (Rp)"
              placeholder="0"
              required
              min={0}
              thousandSeparator="."
              decimalSeparator=","
              hideControls
              {...paymentForm.getInputProps('amount')}
            />
            <TextInput
              label="Catatan"
              placeholder="No. Referensi / Keterangan"
              {...paymentForm.getInputProps('notes')}
            />
            <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={() => setView('folio')}>Kembali</Button>
                <Button type="submit" color="green" loading={loading} leftSection={<IconCash size={16}/>}>Proses Bayar</Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}