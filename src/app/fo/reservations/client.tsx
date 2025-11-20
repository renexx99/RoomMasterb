'use client';

import { useState, useMemo } from 'react';
import { Container, Title, Button, Group, TextInput, Stack, Paper, Grid, MultiSelect, Text, Modal } from '@mantine/core';
import { IconPlus, IconSearch, IconFilter } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

// [CRITICAL] Gunakan komponen lokal, JANGAN import dari admin
import { ReservationsTable } from './components/ReservationsTable';
import { ReservationFormModal } from './components/ReservationFormModal'; 

import { deleteReservation } from './actions';
import { ReservationDetails, RoomWithDetails, GuestOption } from './page';
import { DatePickerInput, DateValue } from '@mantine/dates';

interface ClientProps {
  initialReservations: ReservationDetails[];
  rooms: RoomWithDetails[];
  guests: GuestOption[];
  hotelId: string;
}

export default function FoReservationsClient({ initialReservations, rooms, guests, hotelId }: ClientProps) {
  // ... (Sisa kode client.tsx sama seperti sebelumnya)
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<string[]>([]);
  const [filterDate, setFilterDate] = useState<[DateValue, DateValue]>([null, null]);
  
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [selectedData, setSelectedData] = useState<ReservationDetails | null>(null);

  const handleEdit = (item: ReservationDetails) => {
    setSelectedData(item);
    open();
  };

  const handleAdd = () => {
    setSelectedData(null);
    open();
  };

  const handleDeleteClick = (item: ReservationDetails) => {
    setSelectedData(item);
    openDelete();
  };

  const confirmDelete = async () => {
    if (!selectedData) return;
    
    const res = await deleteReservation(selectedData.id);
    if (res?.error) {
      notifications.show({ title: 'Gagal', message: res.error, color: 'red' });
    } else {
      notifications.show({ title: 'Berhasil', message: 'Reservasi dihapus', color: 'green' });
      closeDelete();
      setSelectedData(null);
    }
  };

  const filteredData = useMemo(() => {
    let result = initialReservations;

    if (search) {
        const lowerSearch = search.toLowerCase();
        result = result.filter(item =>
            item.guest?.full_name?.toLowerCase().includes(lowerSearch) ||
            item.room?.room_number?.toLowerCase().includes(lowerSearch)
        );
    }

    if (filterPayment.length > 0) {
        result = result.filter(item => filterPayment.includes(item.payment_status));
    }

    if (filterDate[0] && filterDate[1]) {
        const start = filterDate[0];
        const end = filterDate[1];
        result = result.filter(item => {
            const checkIn = new Date(item.check_in_date);
            return checkIn >= start && checkIn <= end;
        });
    }

    return result;
  }, [initialReservations, search, filterPayment, filterDate]);


  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        <div style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', padding: '2rem 0', marginBottom: '2rem' }}>
            <Container size="xl">
                <Group justify="space-between" align="center">
                    <div>
                         <Title order={2} c="white">Manajemen Reservasi</Title>
                         <Text c="white" opacity={0.9}>Kelola booking dan tamu in-house</Text>
                    </div>
                    <Button leftSection={<IconPlus size={18} />} onClick={handleAdd} variant="white" color="teal">
                        Buat Reservasi
                    </Button>
                </Group>
            </Container>
        </div>

        <Container size="xl" pb="xl">
            <Stack gap="lg">
                <Paper shadow="xs" p="md" radius="md" withBorder>
                    <Grid align="flex-end">
                        <Grid.Col span={{ base: 12, md: 4 }}>
                             <TextInput
                                label="Cari Reservasi"
                                placeholder="Nama tamu atau nomor kamar..."
                                leftSection={<IconSearch size={16} />}
                                value={search}
                                onChange={(e) => setSearch(e.currentTarget.value)}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                            <MultiSelect
                                label="Filter Pembayaran"
                                placeholder="Pilih status..."
                                data={['pending', 'paid', 'cancelled']}
                                value={filterPayment}
                                onChange={setFilterPayment}
                                leftSection={<IconFilter size={16} />}
                                clearable
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                            <DatePickerInput
                                type="range"
                                label="Filter Tanggal Check-in"
                                placeholder="Rentang tanggal"
                                value={filterDate}
                                onChange={setFilterDate}
                                clearable
                            />
                        </Grid.Col>
                    </Grid>
                </Paper>

                <ReservationsTable 
                    data={filteredData} 
                    onEdit={handleEdit} 
                    onDelete={handleDeleteClick} 
                />
            </Stack>
        </Container>

        <ReservationFormModal
            opened={opened}
            close={close}
            hotelId={hotelId}
            rooms={rooms}
            guests={guests}
            selectedData={selectedData}
        />

        <Modal opened={deleteOpened} onClose={closeDelete} title="Konfirmasi Hapus" centered size="sm">
            <Stack>
                <Text size="sm">
                    Apakah Anda yakin ingin menghapus reservasi tamu <strong>{selectedData?.guest?.full_name}</strong>? 
                    Data yang dihapus tidak dapat dikembalikan.
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={closeDelete}>Batal</Button>
                    <Button color="red" onClick={confirmDelete}>Hapus Reservasi</Button>
                </Group>
            </Stack>
        </Modal>
    </div>
  );
}