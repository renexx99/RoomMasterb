// src/core/types/database.ts

// --- Existing Simple Types ---
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'city_ledger';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type LoyaltyLogType = 'earn' | 'redeem' | 'adjust';
export type LoyaltyLogSource = 'stay' | 'spend' | 'bonus' | 'manual' | 'redeem';

// --- Housekeeping Types ---
export type HousekeepingTaskType = 'cleaning' | 'inspection' | 'turndown' | 'deep_cleaning';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type MaintenanceCategory = 'plumbing' | 'electrical' | 'furniture' | 'appliance' | 'structural' | 'other';
export type MaintenanceSeverity = 'low' | 'medium' | 'high' | 'critical';
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'escalated';
export type CombinedRoomStatus = 'VD' | 'VC' | 'OC' | 'OD' | 'OOO';

// --- NEW TYPES (Added) ---
export type BedType = 'Single' | 'Twin' | 'Double' | 'Queen' | 'King' | 'Super King';
export type ViewType = 'City View' | 'Sea View' | 'Garden View' | 'Pool View' | 'Mountain View' | 'No View';
export type WingType = 'North Wing' | 'South Wing' | 'East Wing' | 'West Wing' | 'Central';
export type FurnitureCondition = 'excellent' | 'good' | 'fair' | 'needs_replacement';
export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'credit_card' | 'other' | 'city_ledger';
export type BookingSource = 'walk_in' | 'ota' | 'corporate' | 'travel_agent';

// --- Interfaces ---

export interface Hotel {
  id: string;
  name: string;
  address: string;
  code?: string | null;
  status: 'active' | 'maintenance' | 'suspended';
  image_url?: string | null;
  settings?: any; // JSONB column storing policies like checkInTime
  check_in_time?: string;
  check_out_time?: string;
  created_at: string;
}

export interface HotelWithDetails extends HotelWithStats {
  room_types?: (RoomType & { rooms: Room[] })[];
}

export interface HotelWithStats extends Hotel {
  total_rooms: number;
  total_staff: number;
  active_residents: number;
  total_revenue: number;
}

export interface Profile {
  id: string; // Corresponds to auth.users.id
  email: string;
  full_name: string;
  role: string | null;
  hotel_id: string | null;
  created_at: string;
}

// --- UPDATED RoomType Interface ---
export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  
  // Pricing & Capacity
  price_per_night: number;
  base_price: number; // New
  capacity: number;
  
  // Detailed Information (New)
  description?: string;
  size_sqm?: number;
  bed_type?: BedType;
  bed_count?: number;
  view_type?: ViewType;
  smoking_allowed?: boolean;
  
  // Amenities & Images (New)
  amenities?: string[]; // Array of amenity names
  images?: string[]; // Array of image URLs
  
  // Timestamps
  created_at: string;
  updated_at?: string; // New
}

// --- UPDATED Room Interface ---
export interface Room {
  id: string;
  hotel_id: string;
  room_type_id: string;
  room_number: string;
  
  // Status
  status: RoomStatus; // Uses 'available' | 'occupied' | 'maintenance'
  cleaning_status: 'clean' | 'dirty' | 'cleaning' | 'inspected'; // Updated/New statuses
  
  // Location & Details (New)
  floor_number?: number;
  wing?: WingType;
  
  // Maintenance & Condition (New)
  furniture_condition?: FurnitureCondition;
  last_renovation_date?: string; // ISO date string
  special_notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at?: string; // New
  
  // Relations (for queries with joins)
  room_type?: RoomType;
}

export interface Guest {
  total_stays: number;
  total_spend: number;
  last_visit_at: any;
  loyalty_tier: LoyaltyTier;
  loyalty_points: number;
  preferences: any;
  id: string;
  hotel_id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  created_at: string;
  title?: string | null;
}

export interface LoyaltyPointsLog {
  id: string;
  guest_id: string;
  hotel_id: string;
  points: number;
  type: LoyaltyLogType;
  source: LoyaltyLogSource;
  description?: string | null;
  reservation_id?: string | null;
  created_by?: string | null;
  created_at: string;
  // Relations (for queries with joins)
  guest?: Guest;
  reservation?: Reservation;
  creator?: Profile;
}

export interface LoyaltyConfig {
  id: string;
  hotel_id: string;
  points_per_night: number;
  points_per_spend_unit: number;
  spend_unit_amount: number;
  completion_bonus: number;
  tier_bronze: number;
  tier_silver: number;
  tier_gold: number;
  tier_platinum: number;
  tier_diamond: number;
  created_at: string;
  updated_at?: string;
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
  payment_method?: PaymentMethod | null;
  booking_source?: BookingSource | null;
  agent_id?: string | null;
  special_requests?: string | null;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  created_at: string;
}

// --- RBAC Interfaces (Unchanged) ---

export interface Role {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
}

export interface Permission {
    id: string;
    action: string;
    description: string | null;
    created_at: string;
}

export interface RolePermission {
    role_id: string;
    permission_id: string;
    created_at: string;
}

export interface UserRoleAssignment {
    id: string;
    user_id: string;
    role_id: string;
    hotel_id: string | null;
    created_at: string;
}

// --- NEW Helper Types for Forms ---

export interface RoomTypeFormValues {
  name: string;
  description: string;
  price_per_night: number;
  capacity: number;
  size_sqm: number;
  bed_type: BedType | '';
  bed_count: number;
  view_type: ViewType | '';
  smoking_allowed: boolean;
  amenities: string[];
}

export interface RoomFormValues {
  room_number: string;
  room_type_id: string;
  status: RoomStatus;
  floor_number: number;
  wing: WingType | '';
  furniture_condition: FurnitureCondition;
  special_notes: string;
}


// --- Supabase Database Definition ---

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
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      room_types: {
        Row: RoomType;
        Insert: Omit<RoomType, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RoomType, 'id' | 'created_at' | 'hotel_id'>>;
      };
      rooms: {
        Row: Room;
        Insert: Omit<Room, 'id' | 'created_at' | 'updated_at' | 'room_type'>; // Exclude relations and auto-fields
        Update: Partial<Omit<Room, 'id' | 'created_at' | 'hotel_id' | 'room_type'>>;
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
        Update: Partial<Omit<RolePermission, 'created_at'>>;
      };
      user_roles: {
        Row: UserRoleAssignment;
        Insert: Omit<UserRoleAssignment, 'id' | 'created_at'>;
        Update: Partial<Omit<UserRoleAssignment, 'id' | 'created_at' | 'user_id'>>;
      };
    };
    loyalty_points_log: {
      Row: LoyaltyPointsLog;
      Insert: Omit<LoyaltyPointsLog, 'id' | 'created_at' | 'guest' | 'reservation' | 'creator'>;
      Update: Partial<Omit<LoyaltyPointsLog, 'id' | 'created_at' | 'guest' | 'reservation' | 'creator'>>;
    };
    loyalty_config: {
      Row: LoyaltyConfig;
      Insert: Omit<LoyaltyConfig, 'id' | 'created_at' | 'updated_at'>;
      Update: Partial<Omit<LoyaltyConfig, 'id' | 'created_at' | 'hotel_id'>>;
    };
    Functions: {
        [_ in never]: never
    }
  };
}

export type UserRoleAssignmentWithRole = UserRoleAssignment & {
    roles: Pick<Role, 'name'> | null
}

// --- NEW Constants (Dropdown Options) ---

export const BED_TYPES: { value: BedType; label: string }[] = [
  { value: 'Single', label: 'Single Bed (90cm)' },
  { value: 'Twin', label: 'Twin Beds (2x 90cm)' },
  { value: 'Double', label: 'Double Bed (140cm)' },
  { value: 'Queen', label: 'Queen Bed (160cm)' },
  { value: 'King', label: 'King Bed (180cm)' },
  { value: 'Super King', label: 'Super King Bed (200cm)' },
];

export const VIEW_TYPES: { value: ViewType; label: string }[] = [
  { value: 'City View', label: 'City View' },
  { value: 'Sea View', label: 'Sea View' },
  { value: 'Garden View', label: 'Garden View' },
  { value: 'Pool View', label: 'Pool View' },
  { value: 'Mountain View', label: 'Mountain View' },
  { value: 'No View', label: 'No View' },
];

export const WING_TYPES: { value: WingType; label: string }[] = [
  { value: 'North Wing', label: 'North Wing' },
  { value: 'South Wing', label: 'South Wing' },
  { value: 'East Wing', label: 'East Wing' },
  { value: 'West Wing', label: 'West Wing' },
  { value: 'Central', label: 'Central Building' },
];

export const FURNITURE_CONDITIONS: { value: FurnitureCondition; label: string }[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'needs_replacement', label: 'Needs Replacement' },
];

export const COMMON_AMENITIES = [
  'AC',
  'TV LED',
  'WiFi Gratis',
  'Mini Bar',
  'Coffee Maker',
  'Safe Box',
  'Shower',
  'Bathtub',
  'Hair Dryer',
  'Iron & Ironing Board',
  'Telephone',
  'Work Desk',
  'Sofa',
  'Balcony',
  'Kitchenette',
  'Microwave',
  'Refrigerator',
];

// --- Loyalty Tier Constants ---
export const LOYALTY_TIERS: { value: LoyaltyTier; label: string; color: string }[] = [
  { value: 'bronze', label: 'Bronze', color: 'orange' },
  { value: 'silver', label: 'Silver', color: 'gray' },
  { value: 'gold', label: 'Gold', color: 'yellow' },
  { value: 'platinum', label: 'Platinum', color: 'cyan' },
  { value: 'diamond', label: 'Diamond', color: 'violet' },
];

// --- Housekeeping Interfaces ---

export interface HousekeepingTask {
  id: string;
  hotel_id: string;
  room_id: string;
  assigned_to: string | null;
  task_type: HousekeepingTaskType;
  priority: TaskPriority;
  status: TaskStatus;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  room?: Room;
  assignee?: Profile;
}

export interface MaintenanceReport {
  id: string;
  hotel_id: string;
  room_id: string;
  reported_by: string;
  category: MaintenanceCategory;
  description: string;
  severity: MaintenanceSeverity;
  status: MaintenanceStatus;
  image_url: string | null;
  resolved_at: string | null;
  created_at: string;
  // Relations
  room?: Room;
  reporter?: Profile;
}

// --- Housekeeping Constants ---

export const TASK_TYPES: { value: HousekeepingTaskType; label: string }[] = [
  { value: 'cleaning', label: 'Regular Cleaning' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'turndown', label: 'Turndown Service' },
  { value: 'deep_cleaning', label: 'Deep Cleaning' },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'normal', label: 'Normal', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' },
];

export const MAINTENANCE_CATEGORIES: { value: MaintenanceCategory; label: string }[] = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'structural', label: 'Structural' },
  { value: 'other', label: 'Other' },
];

export const SEVERITY_LEVELS: { value: MaintenanceSeverity; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'critical', label: 'Critical', color: 'red' },
];

/**
 * Derives the combined hotel-standard room status code from the two DB fields.
 */
export function getCombinedRoomStatus(status: RoomStatus, cleaningStatus: string): CombinedRoomStatus {
  if (status === 'maintenance') return 'OOO';
  if (status === 'occupied' && cleaningStatus === 'dirty') return 'OD';
  if (status === 'occupied') return 'OC';
  if (status === 'available' && cleaningStatus === 'dirty') return 'VD';
  return 'VC';
}

export const COMBINED_STATUS_CONFIG: Record<CombinedRoomStatus, { label: string; color: string; description: string }> = {
  VD: { label: 'Vacant Dirty', color: 'red', description: 'Room available but needs cleaning' },
  VC: { label: 'Vacant Clean', color: 'teal', description: 'Room ready for check-in' },
  OC: { label: 'Occupied Clean', color: 'blue', description: 'Guest in room, room is clean' },
  OD: { label: 'Occupied Dirty', color: 'orange', description: 'Guest in room, needs cleaning' },
  OOO: { label: 'Out of Order', color: 'gray', description: 'Room under maintenance' },
};