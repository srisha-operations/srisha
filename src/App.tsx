import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";

// Admin pages
import AdminSignin from "./pages/Admin/Login/AdminLogin";
import AdminLayout from "./pages/Admin/Layout/AdminLayout";

// Products
import ProductsList from "./pages/Admin/Products/ProductsLists";
import ProductCreate from "./pages/Admin/Products/ProductsCreate";
import ProductEdit from "./pages/Admin/Products/ProductEdit";
import ProductMedia from "./pages/Admin/Products/ProductsMedia";

// Orders
import OrdersList from "./pages/Admin/Orders/OrdersList";
import OrderView from "./pages/Admin/Orders/OrderView";

// Content
import BrandSettings from "./pages/Admin/Content/BrandSettings";
import HeroSettings from "./pages/Admin/Content/HeroSettings";
import GallerySettings from "./pages/Admin/Content/GallerySettings";
import FooterSettings from "./pages/Admin/Content/FooterSettings";
import ShopSettings from "./pages/Admin/Content/ShopSettings";

// Inquiries
// import InquiriesList from "./pages/Admin/Inquiries/InquiriesList";
// import InquiryView from "./pages/Admin/Inquiries/InquiryView";

const App = () => (
  <>
    <BrowserRouter>
      <Routes>
        {/* public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/products" element={<Products />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* admin auth */}
        <Route path="/admin/signin" element={<AdminSignin />} />

        {/* admin protected layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<ProductsList />} />
          {/* Products */}
          <Route path="products" element={<ProductsList />} />
          <Route path="products/new" element={<ProductCreate />} />
          <Route path="products/:id/edit" element={<ProductEdit />} />
          <Route path="products/:id/media" element={<ProductMedia />} />

          {/* Orders */}
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/:id" element={<OrderView />} />

          {/* Content management */}
          <Route path="content/brand" element={<BrandSettings />} />
          <Route path="content/hero" element={<HeroSettings />} />
          <Route path="content/gallery" element={<GallerySettings />} />
          <Route path="content/footer" element={<FooterSettings />} />
          <Route path="content/shop" element={<ShopSettings />} />

          {/* Inquiries */}
          {/* <Route path="inquiries" element={<InquiriesList />} />
        <Route path="inquiries/:id" element={<InquiryView />} /> */}
        </Route>

        {/* fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    <Toaster />
  </>
);

export default App;
