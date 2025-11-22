import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: "signin" | "signup";
  onAuthSuccess?: (user: { name: string; email: string }) => void;
}

// localStorage key: srisha_user
const USER_KEY = "srisha_user";

const AuthModal = ({ open, onOpenChange, defaultView = "signin", onAuthSuccess }: AuthModalProps) => {
  const [view, setView] = useState<"signin" | "signup">(defaultView);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleGoogleAuth = () => {
    // UI-only placeholder
    console.log("Google OAuth triggered");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // UI-only: store in localStorage
    const user = {
      name: view === "signup" ? formData.name : formData.email.split("@")[0],
      email: formData.email,
    };
    
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    if (onAuthSuccess) {
      onAuthSuccess(user);
    }
    
    onOpenChange(false);
    setFormData({ name: "", email: "", phone: "", password: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="font-tenor text-2xl text-center tracking-wide">
            {view === "signin" ? "Sign In" : "Sign Up"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Google Auth Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full font-lato"
            onClick={handleGoogleAuth}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {view === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="font-lato text-sm">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="font-lato"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-lato text-sm">
                Email {view === "signin" && "or Phone"}
              </Label>
              <Input
                id="email"
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="font-lato"
              />
            </div>

            {view === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-lato text-sm">
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="font-lato"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="font-lato text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="font-lato"
              />
            </div>

            {view === "signin" && (
              <button
                type="button"
                className="text-sm text-accent hover:underline font-lato"
              >
                Forgot password?
              </button>
            )}

            <Button type="submit" className="w-full font-lato">
              {view === "signin" ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          {/* Toggle View */}
          <p className="text-center text-sm font-lato text-muted-foreground">
            {view === "signin" ? "New to Srisha?" : "Already registered?"}{" "}
            <button
              type="button"
              onClick={() => setView(view === "signin" ? "signup" : "signin")}
              className="text-accent hover:underline font-medium"
            >
              {view === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
