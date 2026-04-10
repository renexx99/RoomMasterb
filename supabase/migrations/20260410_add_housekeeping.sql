-- Housekeeping Role MVP Migration
-- Run this in Supabase SQL Editor / Console

-- 1. Add 'Housekeeping' role if not exists
INSERT INTO public.roles (name, description)
VALUES ('Housekeeping', 'Housekeeping staff responsible for room cleaning and maintenance reporting')
ON CONFLICT (name) DO NOTHING;

-- 2. Create housekeeping_tasks table
CREATE TABLE IF NOT EXISTS public.housekeeping_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  room_id uuid NOT NULL,
  assigned_to uuid,
  task_type text NOT NULL DEFAULT 'cleaning' CHECK (task_type IN ('cleaning', 'inspection', 'turndown', 'deep_cleaning')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  notes text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT housekeeping_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT housekeeping_tasks_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id),
  CONSTRAINT housekeeping_tasks_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT housekeeping_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id)
);

-- 3. Create maintenance_reports table
CREATE TABLE IF NOT EXISTS public.maintenance_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  room_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('plumbing', 'electrical', 'furniture', 'appliance', 'structural', 'other')),
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated')),
  image_url text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT maintenance_reports_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_reports_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id),
  CONSTRAINT maintenance_reports_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT maintenance_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.profiles(id)
);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_hotel_status ON public.housekeeping_tasks(hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_assigned ON public.housekeeping_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_hotel ON public.maintenance_reports(hotel_id, status);
