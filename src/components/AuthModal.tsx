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

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: "signin" | "signup";
  onAuthSuccess?: (user: any) => void;
}

const AuthModal = ({
  open,
  onOpenChange,
  defaultView = "signin",
  onAuthSuccess,
}: AuthModalProps) => {
  const [view, setView] = useState(defaultView);
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

    try {
      let user;
      if (view === "signup") {
        user = await signUp(
          formData.name,
          formData.email,
          formData.phone,
          formData.password
        );
        alert("Signup successful! Check your email to confirm your account.");
      } else {
        user = await signIn(formData.email, formData.password);

        onAuthSuccess?.({
          name: user.user_metadata?.name || user.email.split("@")[0],
          email: user.email,
        });
      }

      onOpenChange(false);
      setFormData({ name: "", email: "", phone: "", password: "" });
    } catch (err: any) {
      alert(err.message);
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
                    required
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
                  required
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
                    required
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
                  required
                />
              </div>

              <Button className="w-full py-6" type="submit">
                {view === "signin" ? "Sign In" : "Sign Up"}
              </Button>
            </form>

            <div className="text-center">
              <button
                className="text-sm text-muted-foreground"
                onClick={() =>
                  setView(view === "signin" ? "signup" : "signin")
                }
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
