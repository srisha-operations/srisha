import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { clearCart } from "@/services/cart";
import { clearWishlist } from "@/services/wishlist";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const AdminSignin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [notAdminUserId, setNotAdminUserId] = useState<string | null>(null);
  const [policyBlocked, setPolicyBlocked] = useState(false);

  const handleLogin = async () => {
    setError("");

    // Clear local guest state to avoid merging it into an admin account
    try { localStorage.removeItem('srisha_cart'); } catch (e) {}
    try { localStorage.removeItem('srisha_wishlist'); } catch (e) {}

    // Validation
    if (!email.includes("@") || !email.includes(".")) {
      const msg = "Please enter a valid email address.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (password.length < 6) {
      const msg = "Password must be at least 6 characters.";
      setError(msg);
      toast.error(msg);
      return;
    }

    // Login via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      let msg = error.message;
      if (msg.includes("Invalid login")) {
        msg = "Invalid email or password.";
      }
      setError(msg);
      toast.error(msg);
      return;
    }

    // Check admin table: prefer role column if present
    // Attempt to select role column if present; fallback to selecting id only if role missing
    let adminRow: any = null;
    try {
      const res = await supabase.from("admins").select("id, role").eq("id", data.user.id).single();
      if (res.error) {
        // If PostgREST returns 406 it usually means `.single()` didn't find a row (or RLS blocked access)
        if ((res.error as any)?.status === 406) {
          setPolicyBlocked(true);
        }
        // if error likely due to missing role column or no row, try selecting id only
        const fallback = await supabase.from("admins").select("id").eq("id", data.user.id).single();
        if ((fallback.error as any)?.status === 406) setPolicyBlocked(true);
        adminRow = fallback.data;
      } else {
        adminRow = res.data;
      }
    } catch (err) {
      // unexpected error, fallback to id-only select
      const fallback = await supabase.from("admins").select("id").eq("id", data.user.id).single();
      if ((fallback as any)?.error?.status === 406) setPolicyBlocked(true);
      adminRow = fallback.data;
    }

    // If a role is present on the admin row, require it to be 'admin'
    if (!adminRow || (adminRow.role && adminRow.role !== 'admin')) {
      setError("Not authorized as admin.");
      setNotAdminUserId(data.user.id);
      await supabase.auth.signOut();
      return;
    }

    // Clear any customer state (cart, wishlist) to avoid cross-account leakage
    try {
      await clearCart(data.user.id);
    } catch (e) {
      console.error("Failed to clear cart on admin login", e);
    }
    try {
      await clearWishlist(data.user.id);
    } catch (e) {
      console.error("Failed to clear wishlist on admin login", e);
    }

    navigate("/admin");
  };

  return (
    <>
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
    {notAdminUserId && (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded text-sm">
        <p className="mb-2">Your account is not present in the <code>admins</code> table.</p>
        <p className="mb-2">Run the following SQL in your Supabase SQL editor (replace if needed):</p>
        <pre className="p-2 bg-white border rounded text-xs overflow-auto">INSERT INTO admins (id, role) VALUES ('{notAdminUserId}', 'admin') ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;</pre>
        <div className="flex gap-2 mt-2">
          <button
            className="px-3 py-1 bg-primary text-white rounded"
            onClick={() => {
              navigator.clipboard.writeText(`INSERT INTO admins (id, role) VALUES ('${notAdminUserId}', 'admin') ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;`);
              setError('Admin SQL copied to clipboard');
            }}
          >
            Copy admin SQL
          </button>
          <a
            className="px-3 py-1 bg-white border rounded text-sm"
            href="https://app.supabase.com/" target="_blank" rel="noreferrer noopener"
          >Open Supabase</a>
        </div>
      </div>
    )}
    {policyBlocked && (
      <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded text-sm">
        <h4 className="font-medium mb-2">DB access blocked by RLS / policy</h4>
        <p className="mb-2">The client successfully signed in, but the app could not read the <code>admins</code> row because the DB blocked the request (PostgREST returned 406). This usually happens when Row Level Security (RLS) prevents the authenticated user from selecting that table.</p>
        <p className="mb-2">To allow the signed-in user to check their admin row, run this SQL in Supabase SQL editor:</p>
        <pre className="p-2 bg-white border rounded text-xs overflow-auto">-- allow authenticated users to select their own admins row
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AllowAdminSelectOwn" ON public.admins
  FOR SELECT USING (auth.uid() = id);
</pre>
        <p className="mt-2">After applying the policy, sign in again to access the admin dashboard. If you want admins to view all orders, also run:</p>
        <pre className="p-2 bg-white border rounded text-xs overflow-auto">-- allow admins to read all orders
CREATE POLICY "AllowAdminReadOrders" ON public.orders
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
</pre>
      </div>
    )}
    </>
  );
};

export default AdminSignin;
