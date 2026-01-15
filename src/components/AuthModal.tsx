// src/components/AuthModal.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { X } from "lucide-react";
import { signIn, signUp, resetPasswordForEmail } from "@/services/auth";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: "signin" | "signup" | "forgot_password";
  onAuthSuccess?: (user: any) => void;
  onAfterAuthSuccess?: () => void;
}

const AuthModal = ({
  open,
  onOpenChange,
  defaultView = "signin",
  onAuthSuccess,
  onAfterAuthSuccess,
}: AuthModalProps) => {
  const [view, setView] = useState(defaultView);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    if (open) setView(defaultView);
  }, [open, defaultView]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic Validation for Email
    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      toast.error("Invalid Email", {
        description: "Please enter a valid email address.",
      });
      setIsLoading(false);
      return;
    }

    try {
      if (view === "forgot_password") {
        await resetPasswordForEmail(formData.email);
        toast.success("Reset Link Sent", {
          description: "Check your email for the password reset link.",
        });
        // Close modal or switch to signin
        onOpenChange(false);
      } else if (view === "signup") {
        if (!formData.name.trim()) {
          toast.error("Name required", { description: "Please enter your full name." });
          setIsLoading(false);
          return;
        }
        
        if (formData.password.length < 6) {
          toast.error("Password too short", {
             description: "Password must be at least 6 characters long.",
          });
          setIsLoading(false);
          return;
        }

        const { user, session } = await signUp(
          formData.name,
          formData.email,
          formData.phone,
          formData.password
        );

        if (session && user) {
           // Auto-login active
           onAuthSuccess?.({
            name: user.user_metadata?.name || formData.name,
            email: user.email,
          });

          toast.success("Welcome to SRISHA!", {
            description: `Account created. Signed in as ${user.email}`,
          });
          
          if (onAfterAuthSuccess) {
             setTimeout(() => onAfterAuthSuccess(), 100);
          }

          // Trigger "Welcome Email" (via Magic Link)
          // Since "Confirm Email" is disabled for auto-login, we use Magic Link as the notification.
          // The user should style the "Magic Link" template in Supabase to look like a Welcome email.
          try {
             const { supabase } = await import("@/lib/supabaseClient");
             await supabase.auth.signInWithOtp({
               email: user.email,
               options: {
                 shouldCreateUser: false,
                 emailRedirectTo: window.location.origin,
               }
             });
          } catch (e) {
            console.error("Failed to send welcome email:", e);
          }
        } else {
           // Fallback if mechanism requires email confirmation
           toast.success("Welcome to SRISHA!", {
            description: "Account created successfully.",
          });
        }

        setFormData({ name: "", email: "", phone: "", password: "" });
        onOpenChange(false);
      } else {
        // Sign In
        const user = await signIn(formData.email, formData.password);

        onAuthSuccess?.({
          name: user.user_metadata?.name || user.email?.split("@")[0],
          email: user.email,
        });

        toast.success("Welcome back!", {
          description: `Signed in as ${user.email}`,
        });

        setFormData({ name: "", email: "", phone: "", password: "" });
        onOpenChange(false);
        
        if (onAfterAuthSuccess) {
          setTimeout(() => {
            onAfterAuthSuccess();
          }, 100);
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || "Authentication failed";
      
      // Map Supabase errors
      if (msg.includes("User already registered")) msg = "User already exists. Please sign in instead.";
      if (msg.includes("Invalid login credentials")) msg = "Invalid email or password.";
      if (msg.includes("rate limit")) msg = "Too many attempts. Please try again later.";

      toast.error(
        view === "signin" 
          ? "Sign In Failed" 
          : view === "signup" 
            ? "Sign Up Failed"
            : "Request Failed", 
        { description: msg }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background p-0">
        <DialogClose className="absolute top-4 right-4 opacity-70 hover:opacity-100">
          <X className="w-5 h-5" />
        </DialogClose>

        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-tenor text-2xl text-center">
              {view === "signin" 
                ? "Sign In" 
                : view === "signup" 
                  ? "Sign Up" 
                  : "Reset Password"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {view === "signup" && (
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              {view === "signup" && (
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              )}

              {view !== "forgot_password" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Password</Label>
                    {view === "signin" && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:underline"
                        onClick={() => setView("forgot_password")}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              )}

              <Button className="w-full py-6" type="submit" disabled={isLoading}>
                {isLoading 
                  ? "Loading..." 
                  : view === "signin" 
                    ? "Sign In" 
                    : view === "signup" 
                      ? "Sign Up" 
                      : "Send Reset Link"}
              </Button>
            </form>

            <div className="text-center">
              {view === "forgot_password" ? (
                <button
                  className="text-sm text-muted-foreground"
                  onClick={() => setView("signin")}
                  disabled={isLoading}
                >
                  Back to Sign In
                </button>
              ) : (
                <button
                  className="text-sm text-muted-foreground"
                  onClick={() =>
                    setView(view === "signin" ? "signup" : "signin")
                  }
                  disabled={isLoading}
                >
                  {view === "signin"
                    ? "New here? Sign Up"
                    : "Already registered? Sign In"}
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
