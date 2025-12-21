import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { getOrder, getOrderItems, Order, OrderItem, updateOrderStatus } from "@/services/orders";
import { humanizeStatus } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const OrderView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productMap, setProductMap] = useState<Record<string, any>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    const orderData = await getOrder(id);
    if (orderData) {
      setOrder(orderData);
      const orderItems = await getOrderItems(id);
      setItems(orderItems);

      // Fetch product details for all items
      const productIds = orderItems.map((item) => item.product_id);
      if (productIds.length > 0) {
        const { data } = await supabase
          .from("products")
          .select("id, name, price")
          .in("id", productIds);

        const pMap: Record<string, any> = {};
        data?.forEach((p) => {
          pMap[p.id] = p;
        });
        setProductMap(pMap);
      }
    }
    setLoading(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    const orderId = id;
    if (!orderId) return;
    const result = await updateOrderStatus(orderId, newStatus as Order["order_status"]);
    if (result.success) {
      toast({ title: "Order status updated", duration: 2000 });
      loadOrder();
    } else {
      toast({ title: `Error: ${result.error}`, duration: 3000 });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading order...</div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/admin/orders')} className="font-lato">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <div className="text-center py-12 text-muted-foreground">Order not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/orders")} className="font-lato">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-tenor text-foreground">Order {order?.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            {order && new Date(order.created_at).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Details */}
        <div className="bg-white rounded-lg border border-border p-6 space-y-4">
          <div>
            <h2 className="text-lg font-tenor text-foreground mb-4">Order Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Order Number</p>
                <p className="font-lato">{order.order_number}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Status</p>
                <div className="flex items-center gap-2">
                  <Select value={order.order_status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full font-lato">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">{humanizeStatus(order.order_status)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Total Amount</p>
                <p className="font-lato text-lg font-semibold">₹{(order.total_amount || order.total || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Is Preorder</p>
                <p className="font-lato">{order.is_preorder ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg border border-border p-6 space-y-4">
          <div>
            <h2 className="text-lg font-tenor text-foreground mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Name</p>
                <p className="font-lato">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Email</p>
                <p className="font-lato text-sm break-all">{order.customer_email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Phone</p>
                <p className="font-lato">{order.customer_phone}</p>
              </div>
              {order.user_id && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">User ID</p>
                  <p className="font-lato text-xs break-all">{order.user_id}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {order.shipping_address && (
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-tenor text-foreground mb-4">Shipping Address</h2>
          <div className="text-sm font-lato space-y-1 text-foreground">
            <p>{order.shipping_address.street || ""}</p>
            <p>
              {order.shipping_address.city}, {order.shipping_address.state}{" "}
              {order.shipping_address.pincode}
            </p>
            <p>{order.shipping_address.country || "India"}</p>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-tenor text-foreground">Order Items</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-tenor">Product</TableHead>
                <TableHead className="font-tenor">Variant</TableHead>
                <TableHead className="font-tenor">Quantity</TableHead>
                <TableHead className="font-tenor">Unit Price</TableHead>
                <TableHead className="font-tenor text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const product = productMap[item.product_id];
                return (
                  <TableRow key={item.id} className="border-b border-border">
                    <TableCell className="font-lato">{product?.name || item.product_id}</TableCell>
                    <TableCell className="font-lato">{item.metadata?.size || item.variant_id || '-'}</TableCell>
                    <TableCell className="font-lato">{item.quantity}</TableCell>
                    <TableCell className="font-lato">₹{item.unit_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-lato">₹{(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default OrderView;
