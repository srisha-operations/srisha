import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { clearCart } from "@/services/cart";
import { clearWishlist } from "@/services/wishlist";
import { useEffect, useState } from "react";

const RequireAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      try {
        // Step 1: Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (sessionError || !session) {
          // No session – not admin
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Step 2: Check if user is in admins table
        const { data: adminRow, error: adminError } = await supabase
          .from("admins")
          .select("id, role")
          .eq("id", session.user.id)
          .single();

        if (!isMounted) return;

        if (adminError || !adminRow) {
          // Not in admins table – not admin
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Step 3: Verify role is 'admin' (if role column exists)
        if (adminRow.role && adminRow.role !== "admin") {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // All checks passed
        setIsAdmin(true);
        setLoading(false);
      } catch (err) {
        console.error("Admin check error:", err);
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await clearCart();
    } catch (e) {
      /* ignore */
    }
    try {
      await clearWishlist();
    } catch (e) {
      /* ignore */
    }
    await supabase.auth.signOut();
    navigate("/admin/signin", { replace: true });
  };

  // Still checking auth
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin border-4 border-gray-200 border-t-primary rounded-full w-10 h-10 mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">Checking admin access…</div>
        </div>
      </div>
    );
  }

  // Auth check complete: not an admin, redirect to signin
  if (!isAdmin) {
    return <Navigate to="/admin/signin" replace />;
  }

  // Auth check complete: is admin, render outlet
  return <Outlet />;
};

export default RequireAdmin;
