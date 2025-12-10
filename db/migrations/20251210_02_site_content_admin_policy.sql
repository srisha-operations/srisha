-- Migration: Enable RLS and allow admins to manage site_content

-- Enable RLS on site_content table
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Policy: allow admin users listed in public.admins table full access
CREATE POLICY IF NOT EXISTS "site_content_admins_full_access"
  ON public.site_content
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );
