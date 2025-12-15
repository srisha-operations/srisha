-- ========================================
-- Migration 3: Enable RLS and Create Admin Access Policy for site_content
-- ========================================
-- Description: Restricts site_content updates to admin users only via Row Level Security
-- Admins are users whose ID exists in the admins table
-- Run this third in Supabase SQL editor
-- ========================================

-- Enable Row Level Security on site_content table
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to READ (SELECT) site_content
DROP POLICY IF EXISTS "Allow public to read site_content" ON site_content;
CREATE POLICY "Allow public to read site_content"
  ON site_content
  FOR SELECT
  TO public
  USING (true);

-- Policy 2: Allow only admins to INSERT, UPDATE, DELETE site_content
-- An admin is defined as a user whose auth.users.id exists in the admins.id column
DROP POLICY IF EXISTS "Allow admins to modify site_content" ON site_content;
CREATE POLICY "Allow admins to modify site_content"
  ON site_content
  FOR ALL
  TO authenticated
  USING (
    -- Check if current user's auth ID is in the admins table
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    -- Same check for INSERT/UPDATE operations
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- Verification: Check RLS is enabled and policies exist
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'site_content';
-- SELECT policyname, qual, with_check FROM pg_policies WHERE tablename = 'site_content';