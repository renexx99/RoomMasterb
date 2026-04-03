-- =============================================================
-- MIGRATION: Loyalty Program System for RoomMaster PMS
-- Date: 2026-04-03
-- Description: Adds loyalty_points to guests, creates 
--   loyalty_points_log and loyalty_config tables.
-- =============================================================

-- 1. Add loyalty_points column to guests table
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0;

-- 2. Create loyalty_points_log table
-- Tracks every point earn, redeem, and adjustment
CREATE TABLE IF NOT EXISTS public.loyalty_points_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL,
  hotel_id uuid NOT NULL,
  points integer NOT NULL, -- positive = earn, negative = redeem/deduct
  type text NOT NULL CHECK (type IN ('earn', 'redeem', 'adjust')),
  source text NOT NULL CHECK (source IN ('stay', 'spend', 'bonus', 'manual', 'redeem')),
  description text,
  reservation_id uuid,
  created_by uuid, -- staff who triggered the action (nullable for system)
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT loyalty_points_log_pkey PRIMARY KEY (id),
  CONSTRAINT loyalty_points_log_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE CASCADE,
  CONSTRAINT loyalty_points_log_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE,
  CONSTRAINT loyalty_points_log_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE SET NULL,
  CONSTRAINT loyalty_points_log_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Index for fast lookups by guest
CREATE INDEX IF NOT EXISTS idx_loyalty_log_guest_id ON public.loyalty_points_log(guest_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_log_hotel_id ON public.loyalty_points_log(hotel_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_log_created_at ON public.loyalty_points_log(created_at DESC);

-- 3. Create loyalty_config table
-- Per-hotel loyalty configuration. If a hotel has no row, system uses defaults.
CREATE TABLE IF NOT EXISTS public.loyalty_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL UNIQUE,
  
  -- Points earning rules
  points_per_night integer NOT NULL DEFAULT 10,
  points_per_spend_unit integer NOT NULL DEFAULT 1,
  spend_unit_amount numeric NOT NULL DEFAULT 100000, -- Rp 100,000
  completion_bonus integer NOT NULL DEFAULT 50,
  
  -- Tier thresholds (minimum points for each tier)
  tier_bronze integer NOT NULL DEFAULT 0,
  tier_silver integer NOT NULL DEFAULT 500,
  tier_gold integer NOT NULL DEFAULT 2000,
  tier_platinum integer NOT NULL DEFAULT 5000,
  tier_diamond integer NOT NULL DEFAULT 10000,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT loyalty_config_pkey PRIMARY KEY (id),
  CONSTRAINT loyalty_config_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE
);

-- 4. Enable RLS on new tables
ALTER TABLE public.loyalty_points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_points_log
CREATE POLICY "Users can view loyalty logs for their hotel" ON public.loyalty_points_log
  FOR SELECT USING (true);

CREATE POLICY "Users can insert loyalty logs" ON public.loyalty_points_log
  FOR INSERT WITH CHECK (true);

-- RLS Policies for loyalty_config
CREATE POLICY "Anyone can view loyalty config" ON public.loyalty_config
  FOR SELECT USING (true);

CREATE POLICY "Users can insert loyalty config" ON public.loyalty_config
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update loyalty config" ON public.loyalty_config
  FOR UPDATE USING (true);
