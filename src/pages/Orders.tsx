import { useEffect, useState } from "react";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/services/auth";
import { formatPrice, humanizeStatus } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const OrderStageMap: Record<string, number> = {
  pending_payment: 2,
  pending_approval: 3,
  processing: 3,
  shipped: 4,
  delivered: 5,
  cancelled: 1,
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        // redirect to home and open auth modal
        window.dispatchEvent(new CustomEvent("openAuthModal", { detail: "signin" }));
        navigate('/');
        return;
      }
      try {
        // fetch orders with nested order_items and product details
        const { data } = await supabase
          .from("orders")
          .select(
            `*, order_items(*, product:products(*, product_images(*)))`
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!mounted) return;
        const orders = data || [];
        setOrders(orders as any[]);
      } catch (e) {
        console.error("Failed to fetch orders", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (loading) return <Loader fullScreen />;

  return (
    <div className="w-full min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20 px-8 lg:px-16 xl:px-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="p-0" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-tenor text-4xl">My Orders</h1>
          </div>
        </div>

        {(() => {
          if (orders.length === 0) {
            return (
              <div className="text-center py-20">
                <p className="font-lato text-muted-foreground mb-4">You haven’t placed any orders yet</p>
                <Button onClick={() => (window.location.href = "/products")}>Continue Shopping</Button>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {orders.map((order: any) => {
              // stepper removed from Orders list - details page shows stepper only.

              const itemElements = (order.order_items || []).map((item: any) => {
                const p = item.product || item.product_snapshot || {};
                return (
                  <div key={`oitem-${order.id}-${item.id}`} className="flex justify-between text-sm items-center">
                    <div className="flex items-center gap-3">
                      {p?.product_images?.[0]?.url ? (
                        <img src={p.product_images[0].url} className="w-10 h-10 object-cover rounded" alt={p.name} />
                      ) : null}
                      <div>
                        <div>{p?.name || item.product_id}</div>
                        <div className="text-xs text-muted-foreground">{formatPrice(item.unit_price)}</div>
                        {item.metadata?.size && (
                          <div className="text-xs text-muted-foreground">Size: {item.metadata.size}</div>
                        )}
                        {item.metadata?.color && (
                          <div className="text-xs text-muted-foreground">Color: {item.metadata.color}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-muted-foreground">Qty: {item.quantity}</div>
                  </div>
                );
              });

              return (
                <div key={order.id} onClick={() => navigate(`/orders/${order.id}`)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/orders/${order.id}`); }} className="border border-border rounded p-4 md:p-6 cursor-pointer hover:shadow-sm transition-all" role="button">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-tenor text-lg">Order #{order.order_number}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold">{formatPrice(order.total_amount || order.total || 0)}</p>
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap gap-3 items-center">
                  <div className="flex gap-4 items-center text-sm text-muted-foreground">
                    <span>
                      Payment: <span className={
                        order.payment_status === "PAID" ? "text-green-600 font-medium" :
                        order.payment_status === "FAILED" ? "text-red-600 font-medium" :
                        "text-amber-600 font-medium"
                      }>
                        {
                          order.payment_status === "INITIATED" ? "Pending" :
                          order.payment_status === "PAID" ? "Completed" :
                          order.payment_status === "FAILED" ? "Failed" :
                          humanizeStatus(order.payment_status || order.order_status)
                        }
                      </span>
                    </span>
                    <span className="hidden md:inline">•</span>
                    <span className="hidden md:inline">Status: {humanizeStatus(order.order_status)}</span>
                  </div>
                  <div className="flex-1 flex justify-end gap-3 items-center">
                     {/* Quick Pay Now Button */}
                     {/* Quick Pay Now Button removed - use details page */}
                    <Button className="text-sm" variant="link" onClick={(e)=>{e.stopPropagation(); navigate(`/orders/${order.id}`);}}>View details</Button>
                  </div>
                </div>

                {/* Removed tracking stepper from orders list (moved to Order Details page only) */}

                {/* optional small image preview if available */}
                <div className="mb-2 flex items-center gap-2">
                  {order.order_items?.slice(0, 3).map((item: any, idx: number) => {
                    const p = item.product || item.product_snapshot || {};
                    const thumb = p?.product_images?.[0]?.url;
                    return thumb ? (
                      <img key={`thumb-${order.id}-${idx}`} src={thumb} className="w-10 h-10 rounded object-cover" alt={item?.product?.name || item.product_id} />
                    ) : null;
                  })}
                </div>

                {/* Product list if available (temporary) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm text-muted-foreground">Items</h4>
                    <Button aria-expanded={expanded[order.id] ? true : false} variant="outline" size="sm" onClick={(e)=>{e.stopPropagation(); setExpanded(prev => ({...prev, [order.id]: !prev[order.id]}));}}>
                      {expanded[order.id] ? "Hide items" : "View items"}
                    </Button>
                  </div>
                  {expanded[order.id] ? itemElements : (
                    <div className="text-sm text-muted-foreground">{order.order_items?.length || 0} items</div>
                  )}
                </div>
              </div>
              );
              })}
            </div>
          );
        })()}
      </main>
      <Footer />
    </div>
  );
};

export default OrdersPage;
