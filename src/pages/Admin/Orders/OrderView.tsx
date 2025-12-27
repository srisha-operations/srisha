import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, MapPin, CreditCard, Box, Calendar, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center text-muted-foreground animate-pulse">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-xl font-tenor text-foreground">Order Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/admin/orders')} className="font-lato">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-6">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin/orders")} className="shrink-0 h-10 w-10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-tenor text-foreground">Order {order.order_number}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                  order.order_status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                  order.order_status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                  'bg-blue-50 text-blue-800 border border-blue-100'
                }`}>
                {humanizeStatus(order.order_status)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground font-lato">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                {new Date(order.created_at).toLocaleDateString("en-IN", {
                  year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </span>
              <span className="hidden md:inline text-gray-300">•</span>
              <span className="flex items-center gap-1.5">
                <Box className="w-4 h-4 text-gray-400" />
                {items.reduce((acc, item) => acc + item.quantity, 0)} Items
              </span>
              <span className="hidden md:inline text-gray-300">•</span>
              <span className="font-medium text-foreground">
                Total: ₹{(order.total_amount || order.total || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Items & Timeline (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-tenor text-foreground">Order Items</h2>
              <span className="text-xs font-mono text-muted-foreground bg-white border rounded px-2 py-1">
                ID: {order.id.slice(0, 8)}...
              </span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border">
                    <TableHead className="font-tenor text-xs uppercase tracking-wider pl-6">Product</TableHead>
                    <TableHead className="font-tenor text-xs uppercase tracking-wider">Variant / Size</TableHead>
                    <TableHead className="font-tenor text-xs uppercase tracking-wider text-center">Qty</TableHead>
                    <TableHead className="font-tenor text-xs uppercase tracking-wider text-right">Price</TableHead>
                    <TableHead className="font-tenor text-xs uppercase tracking-wider text-right pr-6">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const product = productMap[item.product_id];
                    return (
                      <TableRow key={item.id} className="border-b border-border/50 hover:bg-slate-50/50">
                        <TableCell className="font-lato font-medium text-foreground pl-6">
                           <div className="flex items-center gap-2">
                             <span>{product?.name || item.product_id}</span>
                             {order.is_preorder && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">PREORDER</span>}
                           </div>
                        </TableCell>
                        <TableCell className="font-lato text-muted-foreground text-sm">{item.metadata?.size || item.variant_id || '-'}</TableCell>
                        <TableCell className="font-lato text-center">{item.quantity}</TableCell>
                        <TableCell className="font-lato text-right text-muted-foreground">₹{item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-lato font-medium text-foreground pr-6">₹{(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-gray-50/30 font-lato">
                    <TableCell colSpan={4} className="text-right font-medium text-muted-foreground pt-4 pb-2">Subtotal</TableCell>
                    <TableCell className="text-right font-medium pt-4 pb-2 pr-6">₹{(order.total_amount || order.total || 0).toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-gray-50/30 font-lato border-0">
                    <TableCell colSpan={4} className="text-right font-medium text-muted-foreground py-2">Shipping</TableCell>
                    <TableCell className="text-right font-medium py-2 pr-6">Free</TableCell>
                  </TableRow>
                  <TableRow className="bg-gray-50/50 font-lato border-t border-border">
                    <TableCell colSpan={4} className="text-right font-bold text-foreground py-4">Total</TableCell>
                    <TableCell className="text-right font-bold text-foreground py-4 pr-6 text-lg">₹{(order.total_amount || order.total || 0).toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="bg-white rounded-xl border border-border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                 <h2 className="text-lg font-tenor text-foreground">Timeline</h2>
                 <div className="h-px bg-border flex-1"></div>
              </div>
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pl-8 py-2">
                {timeline.map((event, index) => (
                  <div key={event.id || index} className="relative">
                    <span className={`absolute -left-[41px] flex items-center justify-center w-6 h-6 rounded-full border-2 ring-4 ring-white ${
                        index === 0 ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                    }`}>
                      {index === 0 && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                    </span>
                    <div>
                      <h3 className={`text-sm font-semibold mb-1 ${index === 0 ? 'text-blue-700' : 'text-foreground'}`}>
                        {humanizeStatus(event.status)}
                      </h3>
                      <time className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {new Date(event.created_at).toLocaleString('en-IN', {
                          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </time>
                      {event.payload?.estimated_delivery_date && (
                         <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1.5 rounded border border-blue-100 inline-block">
                            Updated Delivery Estimate: {new Date(event.payload.estimated_delivery_date).toLocaleDateString()}
                         </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Admin Actions & details (Sidebar) */}
        <div className="space-y-6">
          
          {/* Admin Actions Card */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-6 sticky top-6 z-10 transition-shadow hover:shadow-md">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 font-tenor">Order Actions</h2>
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-xs font-semibold text-foreground">Order Status</label>
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
               </div>

               <Separator />

               <div className="space-y-2">
                 <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Estimated Delivery</span>
                    {order.estimated_delivery_date && <span className="text-[10px] text-green-600 font-normal">Active</span>}
                 </label>
                 <input 
                       type="date"
                       className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-lato"
                       value={order.estimated_delivery_date ? new Date(order.estimated_delivery_date).toISOString().split('T')[0] : ""}
                       onChange={async (e) => {
                          const date = e.target.value; // YYYY-MM-DD
                          if (!date) return;
                          toast.promise(
                            updateOrderStatus(order.id, order.order_status, new Date(date).toISOString()).then(res => {
                                if (res.success) loadOrder();
                                else throw new Error("Failed");
                            }),
                            {
                                loading: 'Updating estimate...',
                                success: 'Estimated delivery date updated',
                                error: 'Failed to update date'
                            }
                          );
                       }}
                    />
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Visible to customer on their order page.
                  </p>
               </div>
            </div>
          </div>

          {/* Customer & Address Combined */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
             <div className="p-4 border-b border-border bg-gray-50/50">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground font-tenor">Customer</h2>
             </div>
             <div className="p-5 space-y-6">
                <div className="flex items-start gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-500" />
                   </div>
                   <div>
                      <p className="font-medium text-foreground">{order.customer_name}</p>
                      <a href={`mailto:${order.customer_email}`} className="text-sm text-blue-600 hover:underline block">{order.customer_email}</a>
                      <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                   </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-slate-500" />
                   </div>
                   <div className="text-sm text-foreground space-y-0.5">
                      <p className="font-medium mb-1">Shipping Address</p>
                      {order.shipping_address ? (
                         <>
                            <p>{order.shipping_address.street}</p>
                            <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                            <p>{order.shipping_address.pincode}</p>
                            <p>{order.shipping_address.country || "India"}</p>
                         </>
                      ) : (
                         <p className="text-muted-foreground italic">No address provided</p>
                      )}
                   </div>
                </div>
             </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
             <div className="p-4 border-b border-border bg-gray-50/50">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground font-tenor">Payment</h2>
             </div>
             <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-sm text-muted-foreground">Status</span>
                   <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      order.payment_status === 'PAID' ? 'bg-green-100 text-green-800' :
                      order.payment_status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.payment_status || 'PENDING'}
                   </span>
                </div>
                
                {order.razorpay_payment_id && (
                    <div className="pt-2">
                       <p className="text-xs text-muted-foreground mb-1 uppercase">Payment ID</p>
                       <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded px-2 py-1.5">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <code className="text-xs font-mono text-foreground flex-1 truncate">{order.razorpay_payment_id}</code>
                          <button 
                             onClick={() => {
                                navigator.clipboard.writeText(order.razorpay_payment_id!);
                                toast.success("Copied");
                             }}
                             className="text-slate-400 hover:text-blue-600"
                          >
                             <Copy className="w-3 h-3" />
                          </button>
                       </div>
                    </div>
                )}
             </div>
          </div>

        </div>
      </div>

      {/* Confirmation Dialog (Preserved) */}
      <AlertDialog open={!!statusToUpdate} onOpenChange={(open) => !open && setStatusToUpdate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {doubleConfirm ? <AlertCircle className="text-red-600" /> : <AlertCircle className="text-amber-600" />}
              {doubleConfirm ? "Critical Warning" : "Confirm Status Change"}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              {doubleConfirm ? (
                <div className="bg-red-50 p-4 rounded-md border border-red-100 text-red-800 text-sm space-y-2">
                  <p className="font-semibold">You are about to force a status change to {statusToUpdate}.</p>
                  <p>This action might be inconsistent with the normal order flow or payment status. Please confirm you are absolutely sure.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>
                    Are you sure you want to change the order status from <span className="font-semibold text-foreground">{order.order_status}</span> to <span className="font-semibold text-foreground">{statusToUpdate}</span>?
                  </p>
                  {isBackwardStatusChange(order.order_status, statusToUpdate!) && (
                    <p className="text-amber-600 text-sm bg-amber-50 p-2 rounded border border-amber-100">
                      Warning: You are moving the status backwards. This usually requires double confirmation.
                    </p>
                  )}
                  {statusToUpdate === 'CANCELLED' && (
                     <p className="text-amber-600 text-sm bg-amber-50 p-2 rounded border border-amber-100">
                      Warning: Cancelling an order handles inventory and status, but refunds must be processed manually via Razorpay dashboard if applicable.
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDoubleConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); 
                confirmStatusChange();
              }}
              className={doubleConfirm ? "bg-red-600 hover:bg-red-700 text-white" : ""}
            >
              {doubleConfirm ? "Yes, Force Update" : "Confirm Change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderView;
