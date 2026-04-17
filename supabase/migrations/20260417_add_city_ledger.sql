-- =====================================================
-- Migration: City Ledger Support for B2B Travel Agent Billing
-- Date: 2026-04-17
-- Description: Adds 'city_ledger' to payment_method and
--              payment_status constraints on reservations.
-- =====================================================

-- 1. Extend payment_method to include 'city_ledger'
ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_payment_method_check;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_payment_method_check
  CHECK (payment_method = ANY (ARRAY[
    'cash'::text,
    'transfer'::text,
    'qris'::text,
    'credit_card'::text,
    'other'::text,
    'city_ledger'::text
  ]));

-- 2. Extend payment_status to include 'city_ledger'
--    city_ledger = guaranteed booking, billed to TA/OTA post-stay
ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_payment_status_check;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_payment_status_check
  CHECK (payment_status = ANY (ARRAY[
    'pending'::text,
    'paid'::text,
    'cancelled'::text,
    'city_ledger'::text
  ]));
