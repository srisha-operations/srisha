// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) return navigate("/");

      const user = session.user;

      // Insert user only if not exists
      await supabase.from("users").upsert({
        id: user.id,
        name: user.user_metadata?.name || null,
        phone: user.user_metadata?.phone || null,
      });

      navigate("/");
    };

    run();
  }, []);

  return (
    <div className="w-full h-screen flex items-center justify-center font-tenor text-xl">
      Verifying your email...
    </div>
  );
};

export default AuthCallback;
