-- ============================================================
-- Migration: Drop unused tables (Guest Log, Shifts, Approvals)
-- Date: 2026-04-13
-- Description: Removes tables that are no longer used by any 
--              application module after the efficiency cleanup.
-- ============================================================

-- 1. Drop the approval_requests table
--    (Used by Manager > Approvals page, which has been removed)
DROP TABLE IF EXISTS public.approval_requests CASCADE;

-- 2. Drop the staff_shifts table
--    (Used by Manager > Shifts page, which has been removed)
DROP TABLE IF EXISTS public.staff_shifts CASCADE;

-- 3. Drop related enum types if they exist
--    (These were used by the approval_requests table)
DROP TYPE IF EXISTS public.approval_status CASCADE;
DROP TYPE IF EXISTS public.approval_request_type CASCADE;

-- NOTE: There is no "guest_log" table in the database.
-- The Guest Log page in Front Office only read from existing 
-- tables (reservations, guests, etc.), so no table needs to 
-- be dropped for the Guest Log removal.
