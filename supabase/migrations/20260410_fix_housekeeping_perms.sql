-- Migration: Fix Housekeeping Permissions and Auto-completion
-- Description: Create a secure RPC function to allow Housekeeping staff to update room statuses without RLS blocking, and auto-complete tasks.

-- Alter ENUM clean_status to support new tracking statuses
ALTER TYPE clean_status ADD VALUE IF NOT EXISTS 'cleaning';
ALTER TYPE clean_status ADD VALUE IF NOT EXISTS 'inspected';

CREATE OR REPLACE FUNCTION update_room_cleaning_status(
  p_room_id uuid,
  p_new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hotel_id uuid;
BEGIN
  -- Validate inputs
  IF p_room_id IS NULL OR p_new_status IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Update the rooms table
  UPDATE public.rooms
  SET cleaning_status = p_new_status::clean_status,
      updated_at = NOW()
  WHERE id = p_room_id
  RETURNING hotel_id INTO v_hotel_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 2. If status is clean, auto-complete related cleaning tasks
  IF p_new_status = 'clean' THEN
    UPDATE public.housekeeping_tasks
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE room_id = p_room_id
      AND status NOT IN ('completed', 'skipped');
  END IF;

  RETURN TRUE;
END;
$$;
