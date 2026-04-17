-- =====================================================
-- Migration: Travel Agent (TA) Portal
-- Date: 2026-04-17
-- Description: Adds Travel Agent role, extends reservations
--              table with agent_id, and creates RLS policies
--              for agent-scoped data access.
-- =====================================================

-- =====================================================
-- 1. INSERT 'Travel Agent' ROLE
-- =====================================================
INSERT INTO public.roles (name, description)
VALUES ('Travel Agent', 'B2B Travel Agent / OTA partner with scoped reservation access')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 2. ADD agent_id COLUMN TO reservations
-- =====================================================
-- Nullable: existing reservations (walk-in, direct) won't have an agent
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES auth.users(id);

-- Create index for performant agent-scoped queries
CREATE INDEX IF NOT EXISTS idx_reservations_agent_id
  ON public.reservations (agent_id)
  WHERE agent_id IS NOT NULL;

-- =====================================================
-- 3. EXTEND booking_source ENUM
-- =====================================================
-- Add new values to the existing enum type (idempotent in PG 9.6+)
ALTER TYPE booking_source ADD VALUE IF NOT EXISTS 'travel_agent';
ALTER TYPE booking_source ADD VALUE IF NOT EXISTS 'corporate';

-- =====================================================
-- 4. ENABLE RLS ON reservations (if not already)
-- =====================================================
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. RLS POLICIES FOR TRAVEL AGENT ROLE
-- =====================================================

-- Helper: Check if the current user has the 'Travel Agent' role
-- We use a subquery against user_roles + roles to determine this.

-- Policy: Travel Agents can SELECT only their own reservations
CREATE POLICY "ta_select_own_reservations"
  ON public.reservations
  FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Travel Agent'
    )
  );

-- Policy: Travel Agents can INSERT reservations only with their own agent_id
CREATE POLICY "ta_insert_own_reservations"
  ON public.reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Travel Agent'
    )
  );

-- Policy: Travel Agents can UPDATE only their own reservations
CREATE POLICY "ta_update_own_reservations"
  ON public.reservations
  FOR UPDATE
  TO authenticated
  USING (
    agent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Travel Agent'
    )
  )
  WITH CHECK (
    agent_id = auth.uid()
  );

-- =====================================================
-- 6. RLS POLICIES FOR ROOM TYPES & ROOMS (Read-Only for TA)
-- =====================================================

-- Enable RLS on room_types and rooms
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Travel Agents can view room types for their assigned hotel
CREATE POLICY "ta_select_room_types"
  ON public.room_types
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT ur.hotel_id FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Travel Agent'
        AND ur.hotel_id IS NOT NULL
    )
  );

-- Travel Agents can view rooms for their assigned hotel
CREATE POLICY "ta_select_rooms"
  ON public.room_types
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT ur.hotel_id FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Travel Agent'
        AND ur.hotel_id IS NOT NULL
    )
  );

-- Travel Agents can view rooms table for availability checks
CREATE POLICY "ta_select_rooms_table"
  ON public.rooms
  FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT ur.hotel_id FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Travel Agent'
        AND ur.hotel_id IS NOT NULL
    )
  );

-- =====================================================
-- 7. RLS POLICY FOR GUESTS (TA can INSERT guests for booking)
-- =====================================================
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Travel Agents can insert guests into their assigned hotel
CREATE POLICY "ta_insert_guests"
  ON public.guests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    hotel_id IN (
      SELECT ur.hotel_id FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Travel Agent'
        AND ur.hotel_id IS NOT NULL
    )
  );

-- Travel Agents can view guests they've created (via reservations they own)
CREATE POLICY "ta_select_guests"
  ON public.guests
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT guest_id FROM public.reservations
      WHERE agent_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Travel Agent'
    )
  );
