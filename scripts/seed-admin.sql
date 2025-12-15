-- seed-admin.sql
-- Run this script in psql or the Supabase SQL editor (adjust role and user IDs accordingly)

/*
  This script inserts an admin row into the `admins` table for an existing Supabase auth user.
  It assumes the user already exists in the `auth.users` table (create via Supabase auth UI or Admin API).
  Replace <USER_ID> with the actual user's UUID from Supabase auth.
*/

INSERT INTO admins (id, role)
VALUES ('<USER_ID>', 'admin')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Optional: Verify row created
SELECT * FROM admins WHERE id = '<USER_ID>';
