export type UserRole = 'super_admin' | 'hotel_admin';

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
    };
  };
}
