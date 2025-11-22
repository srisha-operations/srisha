import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { X } from "lucide-react";

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

  useEffect(() => {
    if (open) {
      setView(defaultView);
    }
  }, [open, defaultView]);

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
      <DialogContent className="sm:max-w-md bg-background p-0">
        <DialogClose className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity z-50">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-tenor text-2xl text-center tracking-wide">
              {view === "signin" ? "Sign In" : "Sign Up"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Google Auth Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full font-lato py-6"
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
              <Separator className="my-6" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-4 text-sm text-muted-foreground font-lato">OR</span>
              </div>
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
                  {view === "signup" ? "Email" : "Email or Phone"}
                </Label>
                <Input
                  id="email"
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder={view === "signup" ? "Enter your email" : "Enter email or phone"}
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
                    placeholder="Enter your phone"
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
                  placeholder="Enter password"
                  className="font-lato"
                />
              </div>

              <Button type="submit" className="w-full font-tenor tracking-wide py-6 mt-6">
                {view === "signin" ? "Sign In" : "Sign Up"}
              </Button>

              {view === "signin" && (
                <button 
                  type="button"
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors font-lato mt-3"
                >
                  Forgot password?
                </button>
              )}

              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setView(view === "signin" ? "signup" : "signin")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-lato"
                >
                  {view === "signin" ? "New to SRISHA? " : "Already registered? "}
                  <span className="font-medium text-foreground">
                    {view === "signin" ? "Sign Up" : "Sign In"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
