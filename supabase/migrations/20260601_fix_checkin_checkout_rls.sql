-- =====================================================
-- Migration: Fix Check-In/Check-Out RLS Issue
-- Date: 2026-06-01
-- Description: 
--   RLS is enabled on `rooms` table but no UPDATE policy exists 
--   for Front Office / Housekeeping / Manager roles.
--   This causes room status updates during check-in/check-out 
--   to silently fail (0 rows updated).
--
-- Solution:
--   1. Create SECURITY DEFINER RPC functions for check-in & check-out
--   2. Add a broad UPDATE policy on rooms for operational staff
-- =====================================================

-- =====================================================
-- 1. RPC: check_in_room
--    Sets room status to 'occupied' and cleaning_status to 'clean'
-- =====================================================
CREATE OR REPLACE FUNCTION check_in_room(
  p_reservation_id uuid,
  p_room_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate inputs
  IF p_reservation_id IS NULL OR p_room_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Update Room: Occupied + Clean
  UPDATE public.rooms
  SET status = 'occupied',
      cleaning_status = 'clean',
      updated_at = NOW()
  WHERE id = p_room_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 2. Update Reservation: Set check-in timestamp
  UPDATE public.reservations
  SET checked_in_at = NOW()
  WHERE id = p_reservation_id;

  RETURN TRUE;
END;
$$;

-- =====================================================
-- 2. RPC: check_out_room
--    Sets room status to 'available' and cleaning_status to 'dirty'
--    Also auto-creates a housekeeping cleaning task
-- =====================================================
CREATE OR REPLACE FUNCTION check_out_room(
  p_reservation_id uuid,
  p_room_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hotel_id uuid;
BEGIN
  -- Validate inputs
  IF p_reservation_id IS NULL OR p_room_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Update Room: Available + Dirty
  UPDATE public.rooms
  SET status = 'available',
      cleaning_status = 'dirty',
      updated_at = NOW()
  WHERE id = p_room_id
  RETURNING hotel_id INTO v_hotel_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 2. Update Reservation: Set check-out timestamp
  UPDATE public.reservations
  SET checked_out_at = NOW()
  WHERE id = p_reservation_id;

  -- 3. Auto-create housekeeping cleaning task
  INSERT INTO public.housekeeping_tasks (hotel_id, room_id, task_type, priority, status, notes)
  VALUES (
    v_hotel_id,
    p_room_id,
    'cleaning',
    'normal',
    'pending',
    'Auto-generated after checkout of reservation ' || p_reservation_id::text
  );

  RETURN TRUE;
END;
$$;

-- =====================================================
-- 3. UPDATE policy on rooms for operational staff
--    Allows Front Office, Housekeeping, Hotel Manager,
--    Hotel Admin, and Super Admin to update rooms
-- =====================================================
DO $$
BEGIN
  -- Drop if exists to make this idempotent
  DROP POLICY IF EXISTS "staff_update_rooms" ON public.rooms;
END $$;

CREATE POLICY "staff_update_rooms"
  ON public.rooms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('Front Office', 'Housekeeping', 'Hotel Manager', 'Hotel Admin', 'Super Admin')
        AND (ur.hotel_id = rooms.hotel_id OR r.name = 'Super Admin')
    )
  );

-- =====================================================
-- 4. SELECT policy on rooms for operational staff
--    (in case they can't read rooms either)
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "staff_select_rooms" ON public.rooms;
END $$;

CREATE POLICY "staff_select_rooms"
  ON public.rooms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('Front Office', 'Housekeeping', 'Hotel Manager', 'Hotel Admin', 'Super Admin')
        AND (ur.hotel_id = rooms.hotel_id OR r.name = 'Super Admin')
    )
  );

-- =====================================================
-- 5. Ensure reservations UPDATE policy exists for FO
-- =====================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "staff_update_reservations" ON public.rooms;
  DROP POLICY IF EXISTS "staff_update_reservations" ON public.reservations;
  DROP POLICY IF EXISTS "staff_select_reservations" ON public.reservations;
END $$;

CREATE POLICY "staff_select_reservations"
  ON public.reservations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('Front Office', 'Housekeeping', 'Hotel Manager', 'Hotel Admin', 'Super Admin')
        AND (ur.hotel_id = reservations.hotel_id OR r.name = 'Super Admin')
    )
  );

CREATE POLICY "staff_update_reservations"
  ON public.reservations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('Front Office', 'Hotel Manager', 'Hotel Admin', 'Super Admin')
        AND (ur.hotel_id = reservations.hotel_id OR r.name = 'Super Admin')
    )
  );
