import { Outlet, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

const AdminLayout = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/signin";
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r p-6 bg-white">
        <h2 className="font-tenor text-2xl mb-6">SRISHA Admin</h2>

        <nav className="flex flex-col gap-3">
          {/* Dashboard */}
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `font-lato ${
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`
            }
          >
            Dashboard
          </NavLink>

          {/* Products */}
          <NavLink
            to="/admin/products"
            className={({ isActive }) =>
              `font-lato ${
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`
            }
          >
            Products
          </NavLink>

          {/* Content Settings Section */}
          <h3 className="mt-4 mb-2 font-tenor text-lg text-foreground">
            Content
          </h3>

          <NavLink
            to="/admin/content/brand"
            className={({ isActive }) =>
              `font-lato ml-2 ${
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`
            }
          >
            Brand
          </NavLink>

          <NavLink
            to="/admin/content/hero"
            className={({ isActive }) =>
              `font-lato ml-2 ${
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`
            }
          >
            Hero
          </NavLink>

          <NavLink
            to="/admin/content/gallery"
            className={({ isActive }) =>
              `font-lato ml-2 ${
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`
            }
          >
            Gallery
          </NavLink>

          <NavLink
            to="/admin/content/footer"
            className={({ isActive }) =>
              `font-lato ml-2 ${
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`
            }
          >
            Footer
          </NavLink>

          <NavLink
            to="/admin/content/shop"
            className={({ isActive }) =>
              `font-lato ml-2 ${
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`
            }
          >
            Shop Settings
          </NavLink>

          {/* Inquiries */}
          <h3 className="mt-4 mb-2 font-tenor text-lg text-foreground">
            Inquiries
          </h3>

          <NavLink
            to="/admin/inquiries"
            className={({ isActive }) =>
              `font-lato ml-2 ${
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`
            }
          >
            Inquiry List
          </NavLink>
        </nav>

        <Button
          className="mt-8 w-full font-tenor"
          variant="outline"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-8 bg-background">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
