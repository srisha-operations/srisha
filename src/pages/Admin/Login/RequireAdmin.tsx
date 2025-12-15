import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const RequireAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let sub: any;
    const check = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session – redirect to admin signin
        setAllowed(false);
        setLoading(false);
        toast({ title: 'Admin sign-in required', description: 'Please sign in with an admin account.' });
        navigate('/admin/signin', { replace: true });
        return;
      }

      let adminRow: any = null;
      try {
        const res = await supabase.from("admins").select("id, role").eq("id", session.user.id).single();
        if (res.error) {
          const fallback = await supabase.from("admins").select("id").eq("id", session.user.id).single();
          adminRow = fallback.data;
        } else {
          adminRow = res.data;
        }
      } catch (err) {
        const fallback = await supabase.from("admins").select("id").eq("id", session.user.id).single();
        adminRow = fallback.data;
      }

      if (!adminRow || (adminRow.role && adminRow.role !== 'admin')) {
        // Not an admin – sign out and send to signin
        try { await supabase.auth.signOut(); } catch (err) { /* ignore */ }
        setAllowed(false);
        setLoading(false);
        toast({ title: 'Access denied', description: 'Signed out - admin access required.' });
        navigate('/admin/signin', { replace: true });
        return;
      }

      setAllowed(true);
      setLoading(false);
    };

    // initial check
    check();

    // Listen for auth state changes (login/logout) and re-check
    sub = supabase.auth.onAuthStateChange(async (_event, session) => {
      // re-run the check whenever auth state changes
      await check();
    });

    return () => {
      if (sub && typeof sub.data?.unsubscribe === 'function') sub.data.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/signin');
  };

  if (loading) return null;
  // If not allowed, redirect to admin sign-in
  if (!allowed) {
    return <Navigate to="/admin/signin" replace />;
  }

  return <Outlet />;
};

export default RequireAdmin;
