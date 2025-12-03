import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminSignin from "./pages/Admin/Login/AdminLogin";
import AdminLayout from "./pages/Admin/Layout/AdminLayout";

// Products
import ProductsList from "./pages/Admin/Products/ProductsLists";
import ProductCreate from "./pages/Admin/Products/ProductsCreate";
import ProductEdit from "./pages/Admin/Products/ProductEdit";
import ProductMedia from "./pages/Admin/Products/ProductsMedia";

// Content
import BrandSettings from "./pages/Admin/Content/BrandSettings";
import HeroSettings from "./pages/Admin/Content/HeroSettings";
import GallerySettings from "./pages/Admin/Content/GallerySettings";
import FooterSettings from "./pages/Admin/Content/FooterSettings";

// Inquiries
// import InquiriesList from "./pages/Admin/Inquiries/InquiriesList";
// import InquiryView from "./pages/Admin/Inquiries/InquiryView";

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/products" element={<Products />} />
      <Route path="/product/:slug" element={<ProductDetail />} />

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

        {/* Content management */}
        <Route path="content/brand" element={<BrandSettings />} />
        <Route path="content/hero" element={<HeroSettings />} />
        <Route path="content/gallery" element={<GallerySettings />} />
        <Route path="content/footer" element={<FooterSettings />} />

        {/* Inquiries */}
        {/* <Route path="inquiries" element={<InquiriesList />} />
        <Route path="inquiries/:id" element={<InquiryView />} /> */}
      </Route>

      {/* fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
