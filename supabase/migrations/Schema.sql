-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])),
  content text NOT NULL,
  tool_calls jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ai_chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.ai_chat_sessions(id)
);
CREATE TABLE public.ai_chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT ai_chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.ai_prescriptive_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  generated_date date DEFAULT CURRENT_DATE,
  insight_type text NOT NULL,
  content text NOT NULL,
  priority text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  is_actioned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_prescriptive_insights_pkey PRIMARY KEY (id),
  CONSTRAINT ai_prescriptive_insights_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id)
);
CREATE TABLE public.approval_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  reservation_id uuid,
  requested_by_user_id uuid NOT NULL,
  request_type USER-DEFINED NOT NULL,
  details text,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::approval_status,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by_user_id uuid,
  CONSTRAINT approval_requests_pkey PRIMARY KEY (id),
  CONSTRAINT approval_requests_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id),
  CONSTRAINT approval_requests_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id),
  CONSTRAINT approval_requests_requested_by_user_id_fkey FOREIGN KEY (requested_by_user_id) REFERENCES public.profiles(id),
  CONSTRAINT approval_requests_resolved_by_user_id_fkey FOREIGN KEY (resolved_by_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.guests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone_number text,
  created_at timestamp with time zone DEFAULT now(),
  loyalty_tier USER-DEFINED DEFAULT 'bronze'::guest_tier,
  total_spend numeric DEFAULT 0,
  total_stays integer DEFAULT 0,
  preferences jsonb DEFAULT '{}'::jsonb,
  last_visit_at timestamp with time zone,
  title text CHECK (title = ANY (ARRAY['Mr.'::text, 'Mrs.'::text, 'Ms.'::text, 'Dr.'::text, 'Prof.'::text, 'Other'::text])),
  loyalty_points integer NOT NULL DEFAULT 0,
  CONSTRAINT guests_pkey PRIMARY KEY (id),
  CONSTRAINT guests_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id)
);
CREATE TABLE public.hotels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'maintenance'::text, 'suspended'::text])),
  code text,
  image_url text,
  settings jsonb DEFAULT '{}'::jsonb,
  check_in_time time without time zone DEFAULT '14:00:00'::time without time zone,
  check_out_time time without time zone DEFAULT '12:00:00'::time without time zone,
  CONSTRAINT hotels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.housekeeping_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  room_id uuid NOT NULL,
  assigned_to uuid,
  task_type text NOT NULL DEFAULT 'cleaning'::text CHECK (task_type = ANY (ARRAY['cleaning'::text, 'inspection'::text, 'turndown'::text, 'deep_cleaning'::text])),
  priority text NOT NULL DEFAULT 'normal'::text CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'skipped'::text])),
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
CREATE TABLE public.loyalty_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL UNIQUE,
  points_per_night integer NOT NULL DEFAULT 10,
  points_per_spend_unit integer NOT NULL DEFAULT 1,
  spend_unit_amount numeric NOT NULL DEFAULT 100000,
  completion_bonus integer NOT NULL DEFAULT 50,
  tier_bronze integer NOT NULL DEFAULT 0,
  tier_silver integer NOT NULL DEFAULT 500,
  tier_gold integer NOT NULL DEFAULT 2000,
  tier_platinum integer NOT NULL DEFAULT 5000,
  tier_diamond integer NOT NULL DEFAULT 10000,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT loyalty_config_pkey PRIMARY KEY (id),
  CONSTRAINT loyalty_config_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id)
);
CREATE TABLE public.loyalty_points_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL,
  hotel_id uuid NOT NULL,
  points integer NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['earn'::text, 'redeem'::text, 'adjust'::text])),
  source text NOT NULL CHECK (source = ANY (ARRAY['stay'::text, 'spend'::text, 'bonus'::text, 'manual'::text, 'redeem'::text])),
  description text,
  reservation_id uuid,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT loyalty_points_log_pkey PRIMARY KEY (id),
  CONSTRAINT loyalty_points_log_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id),
  CONSTRAINT loyalty_points_log_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id),
  CONSTRAINT loyalty_points_log_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id),
  CONSTRAINT loyalty_points_log_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.maintenance_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  room_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['plumbing'::text, 'electrical'::text, 'furniture'::text, 'appliance'::text, 'structural'::text, 'other'::text])),
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'low'::text CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'escalated'::text])),
  image_url text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT maintenance_reports_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_reports_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id),
  CONSTRAINT maintenance_reports_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT maintenance_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text,
  hotel_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id)
);
CREATE TABLE public.reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  guest_id uuid NOT NULL,
  room_id uuid NOT NULL,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  total_price numeric NOT NULL CHECK (total_price >= 0::numeric),
  payment_status text NOT NULL DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  ai_notes text,
  special_requests text,
  booking_source USER-DEFINED DEFAULT 'walk_in'::booking_source,
  checked_in_at timestamp with time zone,
  checked_out_at timestamp with time zone,
  payment_method text CHECK (payment_method = ANY (ARRAY['cash'::text, 'transfer'::text, 'qris'::text, 'credit_card'::text, 'other'::text])),
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id),
  CONSTRAINT reservations_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT reservations_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id)
);
CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.room_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  name text NOT NULL,
  price_per_night numeric NOT NULL CHECK (price_per_night >= 0::numeric),
  capacity integer NOT NULL CHECK (capacity > 0),
  created_at timestamp with time zone DEFAULT now(),
  amenities jsonb DEFAULT '[]'::jsonb,
  base_price numeric DEFAULT 0,
  description text,
  size_sqm numeric CHECK (size_sqm >= 0::numeric),
  bed_type text CHECK (bed_type IS NULL OR (bed_type = ANY (ARRAY['Single'::text, 'Twin'::text, 'Double'::text, 'Queen'::text, 'King'::text, 'Super King'::text]))),
  bed_count integer DEFAULT 1 CHECK (bed_count > 0),
  view_type text CHECK (view_type IS NULL OR (view_type = ANY (ARRAY['City View'::text, 'Sea View'::text, 'Garden View'::text, 'Pool View'::text, 'Mountain View'::text, 'No View'::text]))),
  smoking_allowed boolean DEFAULT false,
  images jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT room_types_pkey PRIMARY KEY (id),
  CONSTRAINT room_types_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id)
);
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  room_type_id uuid NOT NULL,
  room_number text NOT NULL,
  status text NOT NULL DEFAULT 'available'::text CHECK (status = ANY (ARRAY['available'::text, 'occupied'::text, 'maintenance'::text])),
  created_at timestamp with time zone DEFAULT now(),
  cleaning_status USER-DEFINED DEFAULT 'clean'::clean_status,
  floor_number integer,
  wing text CHECK (wing IS NULL OR (wing = ANY (ARRAY['North Wing'::text, 'South Wing'::text, 'East Wing'::text, 'West Wing'::text, 'Central'::text]))),
  furniture_condition text DEFAULT 'good'::text CHECK (furniture_condition = ANY (ARRAY['excellent'::text, 'good'::text, 'fair'::text, 'needs_replacement'::text])),
  last_renovation_date date,
  special_notes text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id),
  CONSTRAINT rooms_room_type_id_fkey FOREIGN KEY (room_type_id) REFERENCES public.room_types(id)
);
CREATE TABLE public.staff_shifts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  user_id uuid NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  shift_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_shifts_pkey PRIMARY KEY (id),
  CONSTRAINT staff_shifts_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id),
  CONSTRAINT staff_shifts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reservation_id uuid,
  description text NOT NULL,
  amount numeric NOT NULL,
  type text CHECK (type = ANY (ARRAY['charge'::text, 'payment'::text, 'refund'::text])),
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id),
  CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  hotel_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT user_roles_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES public.hotels(id)
);