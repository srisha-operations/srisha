import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AdminSignin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    // Login via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setError("Invalid credentials.");
      return;
    }

    // Check admin table
    const { data: adminRow } = await supabase
      .from("admins")
      .select("id")
      .eq("id", data.user.id)
      .single();

    if (!adminRow) {
      setError("Not authorized as admin.");
      await supabase.auth.signOut();
      return;
    }

    navigate("/admin");
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="max-w-sm w-full p-6 border rounded">
        <h1 className="text-xl mb-4">Admin Login</h1>

        <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input
          type="password"
          placeholder="Password"
          className="mt-3"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        
        {error && <p className="text-red-500 mt-2">{error}</p>}

        <Button className="mt-4 w-full" onClick={handleLogin}>
          Login
        </Button>
      </div>
    </div>
  );
};

export default AdminSignin;
