-- Migration script to add operational hours to the hotels table
-- Add check-in and check-out policies required for MVP hotel operations

ALTER TABLE public.hotels
ADD COLUMN IF NOT EXISTS check_in_time time DEFAULT '14:00:00',
ADD COLUMN IF NOT EXISTS check_out_time time DEFAULT '12:00:00';

-- Force existing rows to have default values if they are null
UPDATE public.hotels 
SET 
  check_in_time = '14:00:00' WHERE check_in_time IS NULL;

UPDATE public.hotels
SET 
  check_out_time = '12:00:00' WHERE check_out_time IS NULL;
