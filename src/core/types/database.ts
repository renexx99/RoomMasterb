// src/core/types/database.ts

// Existing types (adjusted where needed)
// export type UserRole = 'super_admin' | 'hotel_admin'; // Keep for legacy reference? Or remove? Let's remove for clarity with new system.
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled';

export interface Hotel {
  id: string;
  name: string;
  address: string;
  // Field baru
  code?: string | null;
  status: 'active' | 'maintenance' | 'suspended';
  image_url?: string | null;
  created_at: string;
}

// Helper type untuk data hotel + statistik (untuk UI)
export interface HotelWithStats extends Hotel {
  total_rooms: number;
  total_staff: number;
}

export interface Profile {
  id: string; // Corresponds to auth.users.id
  email: string;
  full_name: string;
  role: string | null; // Old role column, now nullable/less significant
  hotel_id: string | null; // Old hotel_id column, now nullable/less significant
  created_at: string;
}

export interface RoomType {
  [x: string]: string;
  id: string;
  hotel_id: string;
  name: string;
  price_per_night: number; // Keep as number, Supabase handles numeric
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
  check_in_date: string; // Keep as string (date format)
  check_out_date: string; // Keep as string (date format)
  total_price: number; // Keep as number
  payment_status: PaymentStatus;
  created_at: string;
}

// --- New Interfaces based on Refactored Schema ---

export interface Role {
    id: string;
    name: string; // e.g., 'Super Admin', 'Hotel Manager', 'Front Office'
    description: string | null;
    created_at: string;
}

export interface Permission {
    id: string;
    action: string; // e.g., 'manage_users', 'create_reservation', 'view_reports'
    description: string | null;
    created_at: string;
}

export interface RolePermission {
    role_id: string;
    permission_id: string;
    created_at: string;
}

export interface UserRoleAssignment {
    id: string; // Unique ID for the assignment itself
    user_id: string; // Foreign key to profiles.id
    role_id: string; // Foreign key to roles.id
    hotel_id: string | null; // Foreign key to hotels.id (null for global roles like Super Admin)
    created_at: string;
}


// --- Supabase Database Definition (Updated) ---

export interface Database {
  public: {
    Tables: {
      hotels: {
        Row: Hotel;
        Insert: Omit<Hotel, 'id' | 'created_at'>;
        Update: Partial<Omit<Hotel, 'id' | 'created_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>; // ID comes from auth.users
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      room_types: {
        Row: RoomType;
        Insert: Omit<RoomType, 'id' | 'created_at'>;
        Update: Partial<Omit<RoomType, 'id' | 'created_at' | 'hotel_id'>>;
      };
      rooms: {
        Row: Room;
        Insert: Omit<Room, 'id' | 'created_at'>;
        Update: Partial<Omit<Room, 'id' | 'created_at' | 'hotel_id'>>;
      };
      guests: {
        Row: Guest;
        Insert: Omit<Guest, 'id' | 'created_at'>;
        Update: Partial<Omit<Guest, 'id' | 'created_at' | 'hotel_id'>>;
      };
      reservations: {
        Row: Reservation;
        Insert: Omit<Reservation, 'id' | 'created_at'>;
        Update: Partial<Omit<Reservation, 'id' | 'created_at' | 'hotel_id'>>;
      };
      // New Tables
      roles: {
        Row: Role;
        Insert: Omit<Role, 'id' | 'created_at'>;
        Update: Partial<Omit<Role, 'id' | 'created_at'>>;
      };
      permissions: {
        Row: Permission;
        Insert: Omit<Permission, 'id' | 'created_at'>;
        Update: Partial<Omit<Permission, 'id' | 'created_at'>>;
      };
      role_permissions: {
        Row: RolePermission;
        Insert: Omit<RolePermission, 'created_at'>;
        Update: Partial<Omit<RolePermission, 'created_at'>>; // Usually not updated, but added for completeness
      };
      user_roles: {
        Row: UserRoleAssignment;
        Insert: Omit<UserRoleAssignment, 'id' | 'created_at'>;
        Update: Partial<Omit<UserRoleAssignment, 'id' | 'created_at' | 'user_id'>>; // User ID unlikely to change
      };
    };
    // Functions, Views, etc. can be added here if needed
    Functions: {
        [_ in never]: never // Placeholder for functions if you generate types from Supabase CLI
    }
  };
}

// Helper type for joins - Supabase doesn't auto-generate these perfectly
export type UserRoleAssignmentWithRole = UserRoleAssignment & {
    roles: Pick<Role, 'name'> | null // Or just Role if selecting '*'
}