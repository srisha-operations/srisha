import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updatePassword, getCurrentUser, signOut } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader } from "@/components/ui/loader";

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // Supabase handles the hash parsing and session setting automatically
      // We just need to verify we have a user
      const user = await getCurrentUser();
      if (!user) {
        toast.error("Invalid or expired reset link.");
        navigate("/");
      }
      setCheckingAuth(false);
    };
    
    // Give Supabase a moment to process the hash
    setTimeout(checkSession, 1000);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      toast.success("Password updated successfully!");
      navigate("/");
    } catch (error: any) {
      console.error("Update password error:", error);
      toast.error("Failed to update password", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="font-tenor text-3xl mb-2">Reset Password</h1>
            <p className="text-muted-foreground">Enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <Button className="w-full py-6" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UpdatePassword;
