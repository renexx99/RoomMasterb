// src/app/fo/availability/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FoAvailabilityClient from './client';
import { getAvailabilityData } from './actions';

export default async function AvailabilityPage() {
  const cookieStore = await cookies();
  // @ts-ignore
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/auth/login');

  // --- LOGIKA IMPERSONASI ---
  let hotelId: string | null = null;
  const { data: userRoles } = await supabase.from('user_roles').select('*, role:roles(name)').eq('user_id', session.user.id);
  const isSuperAdmin = userRoles?.some((ur: any) => ur.role?.name === 'Super Admin');

  if (isSuperAdmin) {
    hotelId = cookieStore.get('impersonated_hotel_id')?.value || null;
    if (!hotelId) redirect('/super-admin/dashboard');
  } else {
    const operationalRole = userRoles?.find((ur: any) => 
      ur.hotel_id && ['Front Office', 'Hotel Manager', 'Hotel Admin'].includes(ur.role?.name || '')
    );
    hotelId = operationalRole?.hotel_id || null;
  }

  if (!hotelId) return <div>Akses Ditolak: Hotel tidak ditemukan.</div>;

  // Set Range Tanggal (Default: H-7 sampai H+30 untuk Timeline)
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 7);
  const end = new Date(today);
  end.setDate(today.getDate() + 30);

  const { rooms, reservations } = await getAvailabilityData(
    hotelId, 
    start.toISOString().split('T')[0], 
    end.toISOString().split('T')[0]
  );

  // Ambil tipe kamar untuk filter
  const { data: roomTypes } = await supabase.from('room_types').select('*').eq('hotel_id', hotelId);

  return (
    <FoAvailabilityClient 
      initialRooms={rooms || []}
      initialReservations={reservations || []}
      roomTypes={roomTypes || []}
    />
  );
}