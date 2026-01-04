# SRISHA - Luxury Fashion E-Commerce

SRISHA is a modern, high-performance e-commerce platform built for a luxury fashion brand. It features a stunning storefront for customers and a comprehensive admin dashboard for inventory and order management.

![SRISHA Banner](https://xvatizmdsnsstumjhxxg.supabase.co/storage/v1/object/public/srisha/gallery/gallery-43-1.JPEG)

## 🌟 Key Features

### Storefront (Customer Experience)
- **Luxury Aesthetic**: Brand-focused design with smooth animations and premium typography (`Tenor Sans` & `Lato`).
- **Product Gallery**: High-fidelity product showcases with size selection (S, M, L) and detailed descriptions.
- **Dynamic Content**: Gallery and brand stories powered by a dynamic content system (Database + Local Fallback).
- **Shopping Cart & Wishlist**: Persistent cart and wishlist functionality using local storage and database sync.
- **Secure Checkout**: Integrated Razorpay payment gateway for secure transactions.
- **Order Tracking**: Customers can track order status (Confirmed, Dispatched, Delivered) and view estimated delivery dates.

### Admin Dashboard
- **Secure Authentication**: Role-based access control (RBAC) ensuring only admins can access the portal.
- **Order Management**:
    - View all orders with status filtering.
    - Update order status (Pending → Confirmed → Dispatched → Delivered).
    - Set and update **Estimated Delivery Dates**.
    - View detailed timelines of order events.
- **Inventory & Analytics**: (Coming Soon) Product management and sales analytics.
- **Mobile Responsive**: Fully functional admin interface on mobile devices via a responsive Drawer sidebar.

## 🛠️ Technology Stack

- **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Edge Functions, Storage)
- **State Management**: React Query (TanStack Query) + Context API
- **Payments**: [Razorpay](https://razorpay.com/)
- **Deployment**: Vercel / Netlify (Recommended)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Supabase project
- A Razorpay test account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/srisha.git
   cd srisha
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:8080](http://localhost:8080) to view the app.

## 🗄️ Database Setup

The project uses Supabase. Run the following SQL scripts in your Supabase SQL Editor to set up the schema:

1. **Schema Setup**: (Ensure tables for `products`, `orders`, `order_items`, `admins`, `site_content` exist).
2. **Order Events**:
   ```sql
   create table public.order_events (
     id uuid default gen_random_uuid() primary key,
     order_id uuid references public.orders(id) not null,
     status text not null,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     payload jsonb
   );
   ```
3. **Admins**:
   ```sql
   create table public.admins (
     id uuid references auth.users not null primary key,
     role text default 'admin'
   );
   -- Insert your user ID as admin
   -- INSERT INTO admins (id, role) VALUES ('your-user-id', 'admin');
   ```

## 💳 Payment Integration

This project uses **Razorpay** for payments.
- The checkout flow initiates an order via a Supabase Edge Function (`create-razorpay-order`).
- Verify payments via another Edge Function (`verify-payment`) to ensure security.

**Edge Functions:**
- `create-razorpay-order`: Generates an Order ID from Razorpay.
- `verify-payment`: Validates the `razorpay_signature` on the backend.

## 🤝 Contribution

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Crafted with ❤️ for SRISHA*
