import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getOrder, getOrderItems, Order, OrderItem, updateOrderStatus } from "@/services/orders";
import { humanizeStatus } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const OrderView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productMap, setProductMap] = useState<Record<string, any>>({});
  const [statusToUpdate, setStatusToUpdate] = useState<string | null>(null);
  const [doubleConfirm, setDoubleConfirm] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);

  // Status Hierarchy for validation
  const STATUS_ORDER: Record<string, number> = {
    'PENDING': 0,
    'CONFIRMED': 1,
    'DISPATCHED': 2,
    'DELIVERED': 3,
    'CANCELLED': 4 
  };

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
      
      // Fetch timeline (order_events) - best effort
      try {
        const { data: events } = await supabase
          .from("order_events")
          .select("*")
          .eq("order_id", id)
          .order("created_at", { ascending: false });
        if (events) setTimeline(events);
      } catch (e) {
        // Table might not exist yet
      }

      const orderItems = await getOrderItems(id);
      setItems(orderItems);

      // Fetch product details for all items
      const productIds = orderItems.map((item) => item.product_id);
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from("products")
          .select("id, name, price")
          .in("id", productIds);

        const pMap: Record<string, any> = {};
        productsData?.forEach((p) => {
          pMap[p.id] = p;
        });
        setProductMap(pMap);
      }
    }
    setLoading(false);
  };

  const isBackwardStatusChange = (current: string, next: string) => {
    if (next === 'CANCELLED') return false; // allowing cancellation freely
    if (current === 'CANCELLED') return true; // restoring is sensitive
    
    const currRank = STATUS_ORDER[current] ?? -1;
    const nextRank = STATUS_ORDER[next] ?? -1;
    return nextRank < currRank;
  };

  const handleStatusChangeRequest = (newStatus: string) => {
    // 1. Strict Cancellation Check
    if (newStatus === 'CANCELLED') {
      if (order?.payment_status === 'PAID') {
        toast.error("Cannot cancel a PAID order.");
        return;
      }
      if (order?.order_status !== 'PENDING') {
        toast.error("Can only cancel PENDING orders.");
        return;
      }
      // Force double confirm for cancellation
      setDoubleConfirm(false); // First click opens dialog, logic inside confirmStatusChange handles the rest or we can force it here
    }

    setStatusToUpdate(newStatus);
    setDoubleConfirm(false); 
  };

  const confirmStatusChange = async () => {
    if (!order || !statusToUpdate) return;
    
    // Check for backward change logic
    const isBackward = isBackwardStatusChange(order.order_status, statusToUpdate);
    
    // If it's a backward change OR CANCELLATION and we haven't double confirmed yet
    if ((isBackward || statusToUpdate === 'CANCELLED') && !doubleConfirm) {
      setDoubleConfirm(true); // Show second warning
      return;
    }

    const result = await updateOrderStatus(order.id, statusToUpdate as Order["order_status"]);
    if (result.success) {
      toast.success(`Order status updated to ${statusToUpdate}`);
      loadOrder();
    } else {
      toast.error(result.error || "Failed to update status");
    }
    setStatusToUpdate(null);
    setDoubleConfirm(false);
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
                  <Select 
                    value={order.order_status} 
                    onValueChange={handleStatusChangeRequest}
                    disabled={order.order_status === 'DELIVERED' || order.order_status === 'CANCELLED'}
                  >
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

        <AlertDialog open={!!statusToUpdate} onOpenChange={(open) => !open && setStatusToUpdate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {doubleConfirm ? "⚠️ Critical Warning" : (statusToUpdate ? "Change Order Status" : "Confirm Action")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {doubleConfirm ? (
                  <span className="text-red-600 block bg-red-50 p-3 rounded-md border border-red-200">
                    <strong>Warning:</strong> {statusToUpdate === 'CANCELLED' ? "You are about to CANCEL this order." : `You are reverting the order status backwards from ${order.order_status} to ${statusToUpdate}.`}
                    <br/><br/>
                    {statusToUpdate === 'CANCELLED' ? "This action should only be taken if you are absolutely sure. Ensure the customer is aware." : "This is generally not recommended if the customer has already paid or if the order has progressed."}
                    <br/><br/>
                    Are you absolutely sure you want to proceed?
                  </span>
                ) : (
                  <span>
                    Are you sure you want to change the order status from <strong>{order.order_status}</strong> to <strong>{statusToUpdate}</strong>?
                    {isBackwardStatusChange(order.order_status, statusToUpdate!) && (
                      <span className="block mt-2 text-amber-600 font-medium">
                        Using a previous status status will require double confirmation.
                      </span>
                    )}
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDoubleConfirm(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault(); // Prevent auto-close
                  confirmStatusChange();
                }}
                className={doubleConfirm ? "bg-red-600 hover:bg-red-700 text-white" : ""}
              >
                {doubleConfirm ? "Yes, Force Update" : "Confirm Change"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
          <div className="bg-white rounded-lg border border-border p-6 space-y-4 shadow-sm">
             <div>
               <h2 className="text-lg font-tenor text-foreground mb-4">Delivery Estimate</h2>
               <div className="space-y-3">
                 <p className="text-xs text-muted-foreground uppercase font-medium">Estimated Delivery Date</p>
                 <div className="flex items-center gap-2">
                    <input 
                      type="date"
                      className="border border-border rounded px-3 py-2 font-lato text-sm w-full"
                      value={order.estimated_delivery_date ? new Date(order.estimated_delivery_date).toISOString().split('T')[0] : ""}
                      onChange={async (e) => {
                         const date = e.target.value; // YYYY-MM-DD
                         if (!date) return;
                         // Save immediately
                         const res = await updateOrderStatus(order.id, order.order_status, new Date(date).toISOString());
                         if (res.success) {
                            toast.success("Estimated delivery date updated");
                            loadOrder();
                         } else {
                            toast.error("Failed to update date");
                         }
                      }}
                    />
                 </div>
                 <p className="text-xs text-muted-foreground">
                    Setting this will display the date to the customer.
                 </p>
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

        {/* Payment Information */}
        <div className="bg-white rounded-lg border border-border p-6 space-y-4">
          <div>
            <h2 className="text-lg font-tenor text-foreground mb-4">Payment Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Status</p>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  order.payment_status === 'PAID' ? 'bg-green-100 text-green-800' :
                  order.payment_status === 'FAILED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.payment_status || 'PENDING'}
                </span>
              </div>
              {order.razorpay_payment_id && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Payment ID</p>
                  <div className="flex items-center gap-2">
                    <p className="font-lato text-xs font-mono bg-slate-50 p-1 rounded border">{order.razorpay_payment_id}</p>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
                      navigator.clipboard.writeText(order.razorpay_payment_id!);
                      toast.success("Copied");
                    }}>
                      <span className="sr-only">Copy</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </Button>
                  </div>
                </div>
              )}
              {order.razorpay_order_id && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Razorpay Order ID</p>
                  <p className="font-lato text-xs font-mono">{order.razorpay_order_id}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order History Timeline */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-tenor text-foreground mb-4">Order History</h2>
          <div className="relative border-l border-gray-200 ml-3 space-y-6">
            {timeline.map((event, index) => (
              <div key={event.id || index} className="mb-6 ml-6 relative">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-9 ring-4 ring-white">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </span>
                <h3 className="flex items-center mb-1 text-sm font-semibold text-gray-900">
                  {humanizeStatus(event.status)}
                </h3>
                <time className="block mb-2 text-xs font-normal leading-none text-gray-400">
                  {new Date(event.created_at).toLocaleString('en-IN', {
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </time>
                {/* <p className="mb-4 text-xs font-normal text-gray-500">
                  Status changed to {humanizeStatus(event.status)}
                </p> */}
              </div>
            ))}
          </div>
        </div>
      )}

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
                <TableHead className="font-tenor">Variant / Size</TableHead>
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
