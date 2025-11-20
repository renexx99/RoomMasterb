// src/app/fo/availability/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FoAvailabilityClient from './client';
import { Room, RoomType } from '@/core/types/database';

// Interface gabungan untuk data kamar dengan detail tipe kamarnya
export interface RoomWithType extends Room {
  room_type?: RoomType | null;
}

export default async function AvailabilityPage() {
  const cookieStore = await cookies();
  // @ts-ignore 
  const supabase = createServerComponentClient({ cookies: () => cookieStore as any });

  // 1. Cek Sesi
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }

  // 2. Ambil Hotel ID dari Role
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('hotel_id')
    .eq('user_id', session.user.id)
    .not('hotel_id', 'is', null)
    .maybeSingle();

  const hotelId = userRole?.hotel_id;

  // Jika tidak ada hotel, kirim data kosong
  if (!hotelId) {
    return <FoAvailabilityClient initialRooms={[]} roomTypes={[]} />;
  }

  // 3. Fetch Data Secara Paralel
  const [roomsRes, typesRes] = await Promise.all([
    // Ambil kamar beserta detail room_type-nya (Join)
    supabase
      .from('rooms')
      .select('*, room_type:room_types(*)')
      .eq('hotel_id', hotelId),
    
    // Ambil daftar tipe kamar untuk filter dropdown
    supabase
      .from('room_types')
      .select('*')
      .eq('hotel_id', hotelId)
  ]);

  // Casting data agar sesuai interface
  const rooms = (roomsRes.data as unknown as RoomWithType[]) || [];
  const roomTypes = (typesRes.data as RoomType[]) || [];

  return (
    <FoAvailabilityClient 
      initialRooms={rooms} 
      roomTypes={roomTypes} 
    />
  );
}