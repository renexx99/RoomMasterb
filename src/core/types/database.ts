export type UserRole = 'super_admin' | 'hotel_admin';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled';

export interface Hotel {
  id: string;
  name: string;
  address: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  hotel_id: string | null;
  created_at: string;
}

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  price_per_night: number;
  capacity: number;
  created_at: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  room_type_id: string;
  room_number: string;
  status: RoomStatus;
  created_at: string;
}

export interface Guest {
  id: string;
  hotel_id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  created_at: string;
}

export interface Reservation {
  id: string;
  hotel_id: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  payment_status: PaymentStatus;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      hotels: {
        Row: Hotel;
        Insert: Omit<Hotel, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Hotel, 'id' | 'created_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      room_types: {
        Row: RoomType;
        Insert: Omit<RoomType, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<RoomType, 'id' | 'created_at' | 'hotel_id'>>;
      };
      rooms: {
        Row: Room;
        Insert: Omit<Room, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Room, 'id' | 'created_at' | 'hotel_id'>>;
      };
      guests: {
        Row: Guest;
        Insert: Omit<Guest, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Guest, 'id' | 'created_at' | 'hotel_id'>>;
      };
      reservations: {
        Row: Reservation;
        Insert: Omit<Reservation, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Reservation, 'id' | 'created_at' | 'hotel_id'>>;
      };
    };
  };
}