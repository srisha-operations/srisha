import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [productsCount, setProductsCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Orders
        const { data: ordersData, error: ordersErr } = await supabase.from("orders").select("id,total_amount,created_at");
        if (ordersErr) {
          console.warn("orders fetch failed", ordersErr);
        }

        const ordCount = Array.isArray(ordersData) ? ordersData.length : 0;
        const rev = Array.isArray(ordersData) ? ordersData.reduce((s, o) => s + (o.total_amount || 0), 0) : 0;

        // Products
        const { data: productsData, error: productsErr } = await supabase.from("products").select("id");
        if (productsErr) console.warn("products fetch failed", productsErr);
        const prodCount = Array.isArray(productsData) ? productsData.length : 0;

        // Users (best-effort)
        let userCount = null;
        try {
          const { data: usersData } = await supabase.from("users").select("id");
          userCount = Array.isArray(usersData) ? usersData.length : null;
        } catch (e) {
          userCount = null;
        }

        if (!mounted) return;
        setOrdersCount(ordCount);
        setRevenue(rev);
        setProductsCount(prodCount);
        setUsersCount(userCount);
      } catch (e: any) {
        console.error("dashboard load failed", e);
        setError(e.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="p-6">
        <h3 className="text-sm font-tenor text-muted-foreground">Total Orders</h3>
        <p className="text-2xl font-bold mt-2">{ordersCount ?? "—"}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-tenor text-muted-foreground">Total Revenue</h3>
        <p className="text-2xl font-bold mt-2">₹{revenue ?? 0}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-tenor text-muted-foreground">Product Count</h3>
        <p className="text-2xl font-bold mt-2">{productsCount ?? "—"}</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-tenor text-muted-foreground">User Count</h3>
        <p className="text-2xl font-bold mt-2">{usersCount ?? "—"}</p>
      </Card>
    </div>
  );
};

export default AdminDashboard;
