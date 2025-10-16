/*
  # Create profiles and hotels tables for Room Master PMS

  ## Overview
  This migration sets up the core authentication and hotel management structure for the Room Master PMS.

  ## New Tables

  ### `hotels`
  Stores hotel property information managed by the system.
  - `id` (uuid, primary key) - Unique identifier for each hotel
  - `name` (text, required) - Hotel name
  - `address` (text, required) - Physical address of the hotel
  - `created_at` (timestamptz) - Record creation timestamp

  ### `profiles`
  Extends Supabase auth.users with additional user profile information and role management.
  - `id` (uuid, primary key, FK to auth.users) - Links to Supabase auth user
  - `email` (text, required, unique) - User's email address
  - `full_name` (text, required) - User's full name
  - `role` (text, required) - User role: 'super_admin' or 'hotel_admin'
  - `hotel_id` (uuid, nullable, FK to hotels.id) - Associated hotel for hotel_admin role
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security

  ### Row Level Security (RLS)
  - Both tables have RLS enabled for data protection
  - Super admins can manage all data
  - Hotel admins can only view their own profile and associated hotel
  - Authenticated users can read their own profile

  ### RLS Policies

  #### hotels table:
  1. Super admins can read all hotels
  2. Hotel admins can read their assigned hotel
  3. Super admins can insert new hotels
  4. Super admins can update hotels
  5. Super admins can delete hotels

  #### profiles table:
  1. Users can read their own profile
  2. Super admins can read all profiles
  3. Authenticated users can insert their profile during registration
  4. Users can update their own profile
  5. Super admins can update any profile
  6. Super admins can delete profiles

  ## Notes
  - The role field is constrained to only 'super_admin' or 'hotel_admin' values
  - hotel_id is nullable because super_admins are not associated with a specific hotel
  - Foreign key constraints ensure data integrity between tables
  - Indexes are created on frequently queried columns for performance
*/

-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'hotel_admin')),
  hotel_id uuid REFERENCES hotels(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_hotel_id ON profiles(hotel_id);

-- Enable Row Level Security
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hotels table

-- Super admins can read all hotels
CREATE POLICY "Super admins can read all hotels"
  ON hotels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Hotel admins can read their assigned hotel
CREATE POLICY "Hotel admins can read their assigned hotel"
  ON hotels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hotel_id = hotels.id
    )
  );

-- Super admins can insert new hotels
CREATE POLICY "Super admins can insert hotels"
  ON hotels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Super admins can update hotels
CREATE POLICY "Super admins can update hotels"
  ON hotels FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Super admins can delete hotels
CREATE POLICY "Super admins can delete hotels"
  ON hotels FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- RLS Policies for profiles table

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Super admins can read all profiles
CREATE POLICY "Super admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- Authenticated users can insert their profile during registration
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super admins can update any profile
CREATE POLICY "Super admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- Super admins can delete profiles
CREATE POLICY "Super admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );
