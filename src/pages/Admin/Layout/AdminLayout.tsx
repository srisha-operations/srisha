import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { clearCart } from "@/services/cart";
import { clearWishlist } from "@/services/wishlist";
import { 
  LayoutDashboard, 
  FileText, 
  Image, 
  Settings, 
  MessageSquare, 
  LogOut,
  Package,
  ShoppingCart
} from "lucide-react";

const AdminLayout = () => {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await clearCart();
    } catch (e) {
      /* ignore */
    }
    try {
      await clearWishlist();
    } catch (e) {
      /* ignore */
    }
    await supabase.auth.signOut();
    // Use router navigation rather than hard reload
    navigate('/admin/signin', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-slate-50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border bg-white">
          <h2 className="font-tenor text-2xl tracking-wider text-foreground">SRISHA</h2>
          <p className="font-lato text-xs text-muted-foreground mt-1">Admin Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {/* Main Section */}
          <div className="mb-6">
            <div className="px-3 mb-3">
              <p className="font-tenor text-xs tracking-widest text-muted-foreground uppercase">Main</p>
            </div>
            
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg font-lato text-sm transition-colors ${
                  isActive
                    ? "bg-white text-foreground font-semibold shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </NavLink>
          </div>

          {/* Products Section */}
          <div className="mb-6">
            <div className="px-3 mb-3">
              <p className="font-tenor text-xs tracking-widest text-muted-foreground uppercase">Inventory</p>
            </div>

            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg font-lato text-sm transition-colors ${
                  isActive
                    ? "bg-white text-foreground font-semibold shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                }`
              }
            >
              <Package className="w-4 h-4" />
              Products
            </NavLink>
          </div>

          {/* Orders Section */}
          <div className="mb-6">
            <div className="px-3 mb-3">
              <p className="font-tenor text-xs tracking-widest text-muted-foreground uppercase">Orders</p>
            </div>

            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg font-lato text-sm transition-colors ${
                  isActive
                    ? "bg-white text-foreground font-semibold shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                }`
              }
            >
              <ShoppingCart className="w-4 h-4" />
              Orders
            </NavLink>
          </div>
        </nav>

        {/* Footer with Logout */}
        <div className="border-t border-border p-4 bg-white">
          <Button
            className="w-full font-tenor flex items-center justify-center gap-2"
            variant="outline"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 bg-gradient-to-br from-background to-slate-50 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
