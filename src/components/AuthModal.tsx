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
import { Separator } from "./ui/separator";
import { X } from "lucide-react";
import { signIn, signUp } from "@/services/auth";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: "signin" | "signup";
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

    // Basic Validation
    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      toast.error("Invalid Email", {
        description: "Please enter a valid email address.",
      });
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

    try {
      let user;
      if (view === "signup") {
        if (!formData.name.trim()) {
          toast.error("Name required", { description: "Please enter your full name." });
          setIsLoading(false);
          return;
        }
        
        user = await signUp(
          formData.name,
          formData.email,
          formData.phone,
          formData.password
        );
        toast.success("Signup successful!", {
          description: "Check your email to confirm your account.",
        });
      } else {
        user = await signIn(formData.email, formData.password);

        onAuthSuccess?.({
          name: user.user_metadata?.name || user.email.split("@")[0],
          email: user.email,
        });

        toast.success("Welcome back!", {
          description: `Signed in as ${user.email}`,
        });
      }

      setFormData({ name: "", email: "", phone: "", password: "" });
      onOpenChange(false);
      
      // Execute pending action callback (e.g., sync cart/wishlist)
      if (onAfterAuthSuccess) {
        setTimeout(() => {
          onAfterAuthSuccess();
        }, 100);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || "Authentication failed";
      
      // Map Supabase errors to user-friendly messages
      if (msg.includes("User already registered")) msg = "User already exists. Please sign in instead.";
      if (msg.includes("Invalid login credentials")) msg = "Invalid email or password.";
      if (msg.includes("rate limit")) msg = "Too many attempts. Please try again later.";

      toast.error(view === "signin" ? "Sign In Failed" : "Sign Up Failed", {
        description: msg,
      });
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
              {view === "signin" ? "Sign In" : "Sign Up"}
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

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              <Button className="w-full py-6" type="submit" disabled={isLoading}>
                {isLoading ? "Loading..." : (view === "signin" ? "Sign In" : "Sign Up")}
              </Button>
            </form>

            <div className="text-center">
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
