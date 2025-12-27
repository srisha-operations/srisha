import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [productsCount, setProductsCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [pendingShipments, setPendingShipments] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Orders: Fetch needed fields
        const { data: ordersData, error: ordersErr } = await supabase
          .from("orders")
          .select("id, total_amount, created_at, order_status, payment_status, order_number, customer_name")
          .order("created_at", { ascending: false }); // Get all for counts, but could limit if too large

        if (ordersErr) console.warn("orders fetch failed", ordersErr);

        const allOrders = ordersData || [];
        const ordCount = allOrders.length;
        
        // Revenue: Sum of PAID orders only
        const rev = allOrders
          .filter(o => o.payment_status === 'PAID')
          .reduce((s, o) => s + (o.total_amount || 0), 0);

        // Pending Shipments: Confirmed or Paid, but not Dispatched/Delivered/Cancelled
        const pending = allOrders.filter(o => 
          (o.order_status === 'CONFIRMED' || (o.payment_status === 'PAID' && o.order_status === 'PENDING')) &&
          o.order_status !== 'DISPATCHED' && 
          o.order_status !== 'DELIVERED' && 
          o.order_status !== 'CANCELLED'
        ).length;

        // Recent Orders (Top 5)
        const recent = allOrders.slice(0, 5);

        // Products
        const { count: pCount, error: productsErr } = await supabase.from("products").select("id", { count: 'exact', head: true });
        if (productsErr) console.warn("products fetch failed", productsErr);

        // Users (best-effort)
        let userCount = null;
           const { count: uCount } = await supabase.from("users").select("id", { count: 'exact', head: true });
           userCount = uCount;



        if (!mounted) return;
        setOrdersCount(ordCount);
        setRevenue(rev);
        setProductsCount(pCount);
        setUsersCount(userCount);
        setPendingShipments(pending);
        setRecentOrders(recent);

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-tenor text-foreground mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your store performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-tenor text-muted-foreground">Total Revenue (Paid)</h3>
          <p className="text-2xl font-bold mt-2">₹{revenue?.toLocaleString('en-IN') ?? 0}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-tenor text-muted-foreground">Pending Shipments</h3>
          <p className="text-2xl font-bold mt-2 text-orange-600">{pendingShipments ?? 0}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-tenor text-muted-foreground">Total Orders</h3>
          <p className="text-2xl font-bold mt-2">{ordersCount ?? "—"}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-tenor text-muted-foreground">Total Customers</h3>
          <p className="text-2xl font-bold mt-2">{usersCount ?? "—"}</p>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="overflow-hidden border-border">
        <div className="p-6 border-b border-border bg-slate-50">
          <h3 className="text-lg font-tenor text-foreground">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b border-border text-muted-foreground font-tenor uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Order #</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium font-lato">{order.order_number}</td>
                  <td className="px-6 py-4 font-lato">{order.customer_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                      {order.order_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        order.payment_status === 'PAID' ? 'bg-green-100 text-green-800' :
                        order.payment_status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.payment_status || 'PENDING'}
                      </span>
                  </td>
                  <td className="px-6 py-4 font-lato font-semibold">₹{(order.total_amount || 0).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-muted-foreground font-lato">
                    {new Date(order.created_at).toLocaleDateString("en-IN", { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No recent orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
