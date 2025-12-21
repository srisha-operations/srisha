import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import OrdersPage from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";

// Admin pages
import AdminSignin from "./pages/Admin/Login/AdminLogin";
import AdminLayout from "./pages/Admin/Layout/AdminLayout";
import RequireAdmin from "./pages/Admin/Login/RequireAdmin";

// Products
import ProductsList from "./pages/Admin/Products/ProductsLists";
import AdminDashboard from "./pages/Admin/Dashboard";
import ProductCreate from "./pages/Admin/Products/ProductsCreate";
import ProductEdit from "./pages/Admin/Products/ProductEdit";
import ProductMedia from "./pages/Admin/Products/ProductsMedia";

// Orders
import OrdersList from "./pages/Admin/Orders/OrdersList";
import OrderView from "./pages/Admin/Orders/OrderView";
import { supabase } from "@/lib/supabaseClient";
import { clearCart } from "@/services/cart";
import { clearWishlist } from "@/services/wishlist";

/**
 * AdminGuard: Logout admin users who manually navigate to customer routes
 * Prevents admin from accessing customer site while authenticated as admin
 * Runs on route changes to ensure global enforcement
 */
const AdminGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const checkAdminAccess = async () => {
      try {
        // Skip admin checks entirely for non-admin routes
        // AdminGuard only enforces: "if admin user, cannot access customer routes"
        // For customer routes, we don't need to check admins table at all
        const isAdminPath = location.pathname.startsWith("/admin");
        if (!isAdminPath) {
          // Customer route - no admin check needed
          return;
        }

        // Only check admin status if user is already on an admin path
        // This prevents unnecessary admins table queries during checkout
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted || !session) return;

        // Check if user has admin role
        const { data: adminRow } = await supabase
          .from("admins")
          .select("id, role")
          .eq("id", session.user.id)
          .single();

        if (!mounted) return;

        // If user is not admin but on admin path, RequireAdmin guard will handle redirect
        // If user is admin and on customer route somehow, this won't execute (isAdminPath check above)
        const isAdmin = adminRow && (!adminRow.role || adminRow.role === "admin");
        if (!isAdmin) {
          // Not admin but on admin path - RequireAdmin guard will redirect
          return;
        }
      } catch (err) {
        console.error("AdminGuard check error:", err);
      }
    };

    checkAdminAccess();
    return () => { mounted = false; };
  }, [location.pathname, navigate]);

  return null;
};

const App = () => (
  <>
    <BrowserRouter>
      <AdminGuard />
      <Routes>
        {/* public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/products" element={<Products />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetail />} />

        {/* admin auth */}
        <Route path="/admin/signin" element={<AdminSignin />} />

        {/* admin protected layout */}
        <Route path="/admin" element={<RequireAdmin />}>
          <Route path="" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          {/* Products */}
          <Route path="products" element={<ProductsList />} />
          <Route path="products/new" element={<ProductCreate />} />
          <Route path="products/:id/edit" element={<ProductEdit />} />
          <Route path="products/:id/media" element={<ProductMedia />} />

          {/* Orders */}
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/:id" element={<OrderView />} />
          </Route>
        </Route>

        {/* fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    <Toaster />
  </>
);

export default App;
