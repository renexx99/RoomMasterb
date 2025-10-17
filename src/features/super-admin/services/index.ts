import { supabase } from '@/core/config/supabaseClient';
import { Hotel, Profile } from '@/core/types/database';

/**
 * Hotel Services
 */
export const hotelService = {
  /**
   * Fetch all hotels
   */
  async getAll() {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get single hotel by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Create new hotel
   */
  async create(hotel: Omit<Hotel, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('hotels')
      .insert([hotel])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update hotel
   */
  async update(id: string, updates: Partial<Omit<Hotel, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('hotels')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete hotel
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('hotels')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get total hotel count
   */
  async getCount() {
    const { count, error } = await supabase
      .from('hotels')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },
};

/**
 * User Services
 */
export const userService = {
  /**
   * Get all hotel admins
   */
  async getAllAdmins() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'hotel_admin')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get single user by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Get unassigned admins count
   */
  async getUnassignedCount() {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'hotel_admin')
      .is('hotel_id', null);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Get total admin count
   */
  async getAdminCount() {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'hotel_admin');

    if (error) throw error;
    return count || 0;
  },

  /**
   * Get all admins with their hotel info
   */
  async getAllAdminsWithHotels() {
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'hotel_admin')
      .order('created_at', { ascending: false });

    if (adminsError) throw adminsError;

    // Get all hotels
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('*');

    if (hotelsError) throw hotelsError;

    // Merge data
    return (admins || []).map((admin) => ({
      ...admin,
      hotel: hotels?.find((h) => h.id === admin.hotel_id),
    }));
  },

  /**
   * Create new hotel admin user
   */
  async createAdmin(email: string, password: string, fullName: string) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create auth user');

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'hotel_admin',
        hotel_id: null,
      })
      .select()
      .single();

    if (profileError) throw profileError;
    return profile;
  },

  /**
   * Update user profile
   */
  async updateProfile(
    id: string,
    updates: Partial<Omit<Profile, 'id' | 'created_at'>>
  ) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Assign hotel to user
   */
  async assignHotel(userId: string, hotelId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ hotel_id: hotelId })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete user
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get admins by hotel
   */
  async getAdminsByHotel(hotelId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'hotel_admin')
      .eq('hotel_id', hotelId);

    if (error) throw error;
    return data || [];
  },
};

/**
 * Dashboard Statistics Service
 */
export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  async getStats() {
    try {
      const [totalHotels, totalAdmins, unassignedAdmins] = await Promise.all([
        hotelService.getCount(),
        userService.getAdminCount(),
        userService.getUnassignedCount(),
      ]);

      return {
        totalHotels,
        totalAdmins,
        unassignedAdmins,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },
};