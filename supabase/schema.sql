-- LabLink Supabase PostgreSQL Schema with Row Level Security & Booking Conflict Prevention
-- Run this SQL in your Supabase SQL Editor when connecting a live Supabase project.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Profiles & Role Management (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin')),
  department TEXT NOT NULL DEFAULT 'Bioengineering',
  title TEXT NOT NULL DEFAULT 'Student Researcher',
  weekly_quota_hours NUMERIC(5,2) NOT NULL DEFAULT 6.00,
  certifications TEXT[] NOT NULL DEFAULT ARRAY['General Lab Safety'],
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Departments & Laboratories
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  head_name TEXT NOT NULL,
  uptime_percent NUMERIC(5,2) NOT NULL DEFAULT 98.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.laboratories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  building TEXT NOT NULL,
  room TEXT NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'Keycard Access',
  capacity INTEGER NOT NULL DEFAULT 8,
  occupied INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'high_load', 'calibrating', 'closed')),
  manager_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Equipment & Storage Buckets
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Robotics', 'Electronics', 'Manufacturing', 'Research', 'Computing', 'Fabrication')),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  laboratory_id UUID NOT NULL REFERENCES public.laboratories(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
  hourly_rate NUMERIC(8,2) NOT NULL DEFAULT 35.00,
  requires_faculty_approval BOOLEAN NOT NULL DEFAULT FALSE,
  certification_required TEXT NOT NULL DEFAULT 'General Lab Safety',
  description TEXT NOT NULL,
  specs_preview TEXT NOT NULL,
  specs JSONB NOT NULL DEFAULT '[]'::jsonb,
  guidelines JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT,
  last_calibrated_at DATE DEFAULT CURRENT_DATE,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Research Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  grant_code TEXT NOT NULL,
  department TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  recommended_equipment_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Reservations with Database-Level Overlap Prevention
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  start_hour INTEGER NOT NULL CHECK (start_hour BETWEEN 7 AND 21),
  duration_hours INTEGER NOT NULL CHECK (duration_hours BETWEEN 1 AND 8),
  time_range INT4RANGE GENERATED ALWAYS AS (int4range(start_hour, start_hour + duration_hours)) STORED,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'rejected', 'cancelled', 'alternative_suggested')),
  faculty_reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ai_note TEXT,
  total_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Enforces database-level prevention of overlapping active/confirmed slots on the same instrument & date
  CONSTRAINT no_overlapping_active_bookings EXCLUDE USING gist (
    equipment_id WITH =,
    booking_date WITH =,
    time_range WITH &&
  ) WHERE (status IN ('confirmed', 'pending'))
);

-- 6. Maintenance & Notifications
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  technician TEXT NOT NULL,
  task_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'cleared')),
  scheduled_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Storage bucket for equipment photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-images', 'equipment-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to inspect current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Public read access for campus catalog
CREATE POLICY "Catalog readable by authenticated users" ON public.departments FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Labs readable by authenticated users" ON public.laboratories FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Equipment readable by authenticated users" ON public.equipment FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Maintenance readable by authenticated users" ON public.maintenance_logs FOR SELECT TO authenticated USING (TRUE);

-- Admin write policies for catalog management
CREATE POLICY "Admins manage departments" ON public.departments FOR ALL TO authenticated USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "Admins manage labs" ON public.laboratories FOR ALL TO authenticated USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "Admins manage equipment" ON public.equipment FOR ALL TO authenticated USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "Admins manage maintenance" ON public.maintenance_logs FOR ALL TO authenticated USING (public.current_user_role() IN ('admin', 'faculty')) WITH CHECK (public.current_user_role() IN ('admin', 'faculty'));

-- Profiles policies
CREATE POLICY "Users view own profile or faculty/admin view all" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.current_user_role() IN ('faculty', 'admin'));
CREATE POLICY "Users update own non-role profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins manage roles" ON public.profiles FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');

-- Projects policies
CREATE POLICY "Users manage own projects and faculty/admin view all" ON public.projects FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.current_user_role() IN ('faculty', 'admin'));
CREATE POLICY "Students create own projects" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update own projects" ON public.projects FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Bookings policies (Faculty/Admin retain final approval & override authority)
CREATE POLICY "View own bookings or faculty/admin view all" ON public.bookings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() IN ('faculty', 'admin'));
CREATE POLICY "Create booking for self" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Cancel own booking or faculty/admin approve/override" ON public.bookings FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.current_user_role() IN ('faculty', 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.current_user_role() IN ('faculty', 'admin'));

-- Notifications policies
CREATE POLICY "Users view and mark own notifications" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
