import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

const RequireAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const { data: adminRow } = await supabase
        .from("admins")
        .select("id")
        .eq("id", session.user.id)
        .single();

      setAllowed(!!adminRow);
      setLoading(false);
    };

    check();
  }, []);

  if (loading) return null;
  if (!allowed) return <Navigate to="/admin/signin" replace />;

  return <Outlet />;
};

export default RequireAdmin;
