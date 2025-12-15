import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getOrder, getOrderItems } from "@/services/orders";
import { formatPrice, humanizeStatus } from "@/lib/utils";
import Stepper from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      const o = await getOrder(id);
      setOrder(o);
      setItems((((o as any)?.order_items) as any[]) || (await getOrderItems(id)) || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="pt-24">Loading...</div>;
  if (!order) return <div className="pt-24">Order not found</div>;

  return (
    <div className="w-full min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20 px-8 lg:px-16 xl:px-24">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-tenor">Order {order.order_number}</h1>
            <p className="text-sm text-muted-foreground">{order && new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 border border-border rounded p-6">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="font-tenor text-lg">Order Details</h2>
                <p className="text-sm text-muted-foreground">Payment: {humanizeStatus(order.payment_status || order.status)}</p>
                <p className="text-sm text-muted-foreground">Status: {humanizeStatus(order.status)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-tenor text-lg font-bold">{formatPrice(order.total_amount || order.total || 0)}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm text-muted-foreground mb-2">Items</h3>
              <div className="space-y-3">
                  {items?.map((it) => {
                    const p = it.product || it.product_snapshot || {};
                    return (
                    <div key={it.id} className="flex justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        {p?.product_images?.[0]?.url ? (
                          <img src={p.product_images[0].url} className="w-12 h-12 object-cover rounded" alt={p.name} />
                        ) : null}
                        <div>
                          <div className="font-lato">{p?.name || it.product_id}</div>
                          <div className="text-xs text-muted-foreground">{formatPrice(it.unit_price)}</div>
                          {it.metadata?.size && (
                            <div className="text-xs text-muted-foreground">Size: {it.metadata.size}</div>
                          )}
                          {it.metadata?.color && (
                            <div className="text-xs text-muted-foreground">Color: {it.metadata.color}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-muted-foreground">Qty: {it.quantity}</div>
                    </div>
                    );
                  })}
                </div>
            </div>

            {/* Tracking */}
            <div className="mb-4">
              <h4 className="text-sm text-muted-foreground mb-2">Tracking</h4>
              <div>
                <Stepper steps={["Order Placed","Payment Verification","Order Confirmed","Order Dispatched","Order Delivered"]} currentIndex={(function(){
                  const OrderStageMap: Record<string, number> = {
                    pending_payment: 2,
                    pending_approval: 3,
                    processing: 3,
                    shipped: 4,
                    delivered: 5,
                    cancelled: 1,
                  };
                  return OrderStageMap[order.status] || 1;
                })()} />
              </div>
            </div>
          </div>

          <div className="border border-border rounded p-6">
            <h4 className="text-sm text-muted-foreground mb-2">Shipping Address</h4>
            <div className="text-sm text-foreground font-lato">
              <p>{order.shipping_address?.address_line1 || order.shipping_address?.street || ''}</p>
              <p>{order.shipping_address?.city} {order.shipping_address?.state} {order.shipping_address?.pincode}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderDetail;
