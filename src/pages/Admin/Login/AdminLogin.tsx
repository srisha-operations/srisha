import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { clearCart } from "@/services/cart";
import { clearWishlist } from "@/services/wishlist";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock } from "lucide-react";

const AdminSignin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [notAdminUserId, setNotAdminUserId] = useState<string | null>(null);
  const [policyBlocked, setPolicyBlocked] = useState(false);
  
  // Use a gallery image for background
  const bgImage = "https://xvatizmdsnsstumjhxxg.supabase.co/storage/v1/object/public/srisha/gallery/gallery-43-1.JPEG";

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
    let adminRow: any = null;
    try {
      const res = await supabase.from("admins").select("id, role").eq("id", data.user.id).single();
      if (res.error) {
        if ((res.error as any)?.status === 406) {
          setPolicyBlocked(true);
        }
        const fallback = await supabase.from("admins").select("id").eq("id", data.user.id).single();
        if ((fallback.error as any)?.status === 406) setPolicyBlocked(true);
        adminRow = fallback.data;
      } else {
        adminRow = res.data;
      }
    } catch (err) {
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
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-black">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
         <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8 md:p-10 space-y-6">
            <div className="text-center space-y-2">
               <h1 className="font-tenor text-3xl text-white tracking-widest">SRISHA</h1>
               <p className="font-lato text-white/70 text-sm tracking-wide uppercase">Admin Portal</p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-1">
                <Input 
                  placeholder="Admin Email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50"
                />
              </div>
              <div className="space-y-1">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                   className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:border-white/50"
                />
              </div>
            </div>

            {error && (
              <div className="text-rose-300 text-sm text-center bg-rose-500/10 border border-rose-500/20 p-2 rounded">
                {error}
              </div>
            )}

            <Button 
                className="w-full h-11 bg-white text-black hover:bg-white/90 font-tenor tracking-widest text-sm transition-all"
                onClick={handleLogin}
            >
              <Lock className="w-3.5 h-3.5 mr-2" />
              AUTHENTICATE
            </Button>

            <div className="text-center pt-2">
               <a href="/" className="text-xs text-white/50 hover:text-white transition-colors border-b border-transparent hover:border-white/50 pb-0.5">
                  Back to Store
               </a>
            </div>
         </div>
      </div>
      
      {/* Help Messages (Only show if needed) */}
      {(notAdminUserId || policyBlocked) && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto">
          {notAdminUserId && (
            <div className="p-4 bg-white rounded shadow-lg border border-yellow-100 text-sm mb-2">
              <p className="mb-2 font-medium text-amber-800">Account needs Admin access</p>
              <pre className="p-2 bg-slate-50 border rounded text-xs overflow-auto mb-2 text-slate-700">INSERT INTO admins (id, role) VALUES ('{notAdminUserId}', 'admin') ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;</pre>
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={() => {
                  navigator.clipboard.writeText(`INSERT INTO admins (id, role) VALUES ('${notAdminUserId}', 'admin') ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;`);
                  toast.success("SQL copied");
                }}
              >
                Copy SQL
              </button>
            </div>
          )}
          {policyBlocked && (
             <div className="p-4 bg-white rounded shadow-lg border border-blue-100 text-sm">
                 <p className="mb-2 font-medium text-blue-800">Database Policy required</p>
                 <p className="text-xs text-slate-600 mb-2">RLS is blocking access to the admins table.</p>
                 <pre className="p-2 bg-slate-50 border rounded text-xs overflow-auto text-slate-700">ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AllowAdminSelectOwn" ON public.admins FOR SELECT USING (auth.uid() = id);</pre>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSignin;
