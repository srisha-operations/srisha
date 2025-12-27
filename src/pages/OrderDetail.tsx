import { useEffect, useState } from "react";
import { Loader } from "@/components/ui/loader";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getOrder, getOrderItems } from "@/services/orders";
import { initiatePayment, verifyPayment } from "@/services/payment";
import { formatPrice, humanizeStatus } from "@/lib/utils";
import Stepper from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, CheckCircle2, AlertCircle, Clock, Package, Truck, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // Initialize from navigation state if available (Instant "PAID" status)
  const [order, setOrder] = useState<any | null>(location.state?.order || null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(!location.state?.order);
  const [paying, setPaying] = useState(false);
  const { toast } = useToast();

  const fetchOrder = async () => {
    if (!id) return;
    const o = await getOrder(id);
    if (!o) return;
    
    setOrder(o);

    // Extract items: Try nested property first, then explicit fetch
    // casting to any to bypass strict type check for debugging if types are loose
    let fetchedItems = ((o as any).order_items as any[]) || [];
    
    if (!fetchedItems.length) {
       fetchedItems = await getOrderItems(id);
    }
    
    setItems(fetchedItems);
  };

  useEffect(() => {
    (async () => {
      // If we already have order from state, don't show loading spinner, just background refresh
      if (!order) setLoading(true);
      await fetchOrder();
      setLoading(false);
    })();
  }, [id]);

  // Polling for status updates if payment is initiated (pending)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const shouldPoll = order && (order.payment_status === "INITIATED" || order.payment_status === "PENDING");
    
    if (shouldPoll) {
      interval = setInterval(async () => {
        // Silent background fetch
        const updatedOrder = await getOrder(order.id);
        if (updatedOrder && updatedOrder.payment_status === "PAID") {
           // Status changed (e.g. to PAID or FAILED), update and stop polling
           setOrder(updatedOrder);
           toast({
             title: "Payment Confirmed",
             description: "Your order status has been updated.",
           });
        }
      }, 5000); // Check every 5 seconds
    }
    return () => clearInterval(interval);
  }, [order?.payment_status, order?.id]); // Re-run when status changes

  const handleRetryPayment = async () => {
    if (!order) return;
    setPaying(true);

    try {
      // Re-initiate payment to get fresh keys/order_id if needed
      const paymentResult = await initiatePayment({
        orderId: order.id,
        orderNumber: order.order_number,
        amount: order.total_amount || order.total,
        customerEmail: order.customer_email || order.shipping_address?.email || "",
        customerName: order.customer_name || order.shipping_address?.name || "",
        customerPhone: order.customer_phone || order.shipping_address?.phone || "",
      });

      const keyId = paymentResult.razorpayKeyId || (paymentResult as any).keyId;

      if (paymentResult.razorpayOrderId && keyId) {
         const RazorpayClass = (window as any).Razorpay;
         if (!RazorpayClass) {
           toast({ title: "Error", description: "Razorpay SDK not loaded", variant: "destructive" });
           setPaying(false);
           return;
         }

         const options = {
            key: keyId,
            amount: (order.total_amount || order.total) * 100,
            currency: "INR",
            name: "SRISHA",
            description: `Order ${order.order_number}`,
            order_id: paymentResult.razorpayOrderId,
            prefill: {
              name: order.customer_name,
              email: order.customer_email,
              contact: order.customer_phone,
            },
            theme: { color: "#000000" },
            handler: async function (response: any) {
              toast({ title: "Verifying Payment", description: "Please wait..." });

              const verification = await verifyPayment(
                response.razorpay_payment_id,
                response.razorpay_order_id,
                response.razorpay_signature,
                order.id
              );

              if (verification.success) {
                  toast({ title: "Payment Successful", description: "Order confirmed." });
                  await fetchOrder(); // Refresh UI
              } else {
                  toast({ title: "Verification Failed", description: "Payment done but verification failed.", variant: "destructive" });
              }
              setPaying(false);
            },
         };

         const checkout = new RazorpayClass(options);
         checkout.on("payment.failed", function (response: any) {
            toast({ title: "Payment Failed", description: response.error.description, variant: "destructive" });
            setPaying(false);
         });
         
         checkout.open();
      } else {
        toast({ title: "Error", description: "Could not initiate payment gateway", variant: "destructive" });
        setPaying(false);
      }
    } catch (e) {
      console.error("Payment retry error", e);
      toast({ title: "Error", description: "Failed to retry payment", variant: "destructive" });
      setPaying(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!order) return <div className="pt-24 text-center">Order not found</div>;

  // Status mapping for Stepper
  const getStepIndex = (status: string, paymentStatus: string) => {
    if (status === "CANCELLED") return 0;
    if (paymentStatus === "INITIATED" || paymentStatus === "PENDING") return 0; // Payment Pending
    if (paymentStatus === "PAID" && status === "PENDING") return 1; // Paid, waiting for confirmation
    if (status === "CONFIRMED") return 2;
    if (status === "DISPATCHED" || status === "SHIPPED") return 3;
    if (status === "DELIVERED" || status === "COMPLETED") return 4;
    return 1;
  };

  const currentStep = getStepIndex(order.order_status, order.payment_status);
  const isPaymentPending = order.payment_status !== "PAID" && order.order_status !== "CANCELLED";

  return (
    <div className="w-full min-h-screen bg-gray-50/50">
      <Header />
      <main className="pt-24 pb-20 px-4 md:px-8 lg:px-16 xl:px-24">
        {/* Top Bar */}
        <div className="max-w-6xl mx-auto mb-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/orders")} className="pl-0 hover:bg-transparent text-muted-foreground mb-2">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to My Orders
                </Button>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-tenor">Order #{order.order_number}</h1>
                  <Badge variant={order.order_status === "CANCELLED" ? "destructive" : "secondary"} className="uppercase text-xs font-sans tracking-wide">
                    {humanizeStatus(order.order_status)}
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={fetchOrder} title="Refresh Order Status">
                      <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                </p>
              </div>
              
              {isPaymentPending && (
                  <Button onClick={handleRetryPayment} disabled={paying} size="lg" className="bg-black text-white hover:bg-gray-800 transition-all font-medium px-8 h-12">
                     {paying ? "Processing..." : "Complete Payment Now"}
                  </Button>
              )}
           </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Detailed Stepper */}
            <div className="bg-white rounded-xl border p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-medium font-tenor mb-8">Order Status</h2>
              <div className="relative">
                 {/* Bar Background */}
                 <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 z-0"></div>
                 {/* Active Bar */}
                 <div 
                   className="absolute top-5 left-0 h-1 bg-black transition-all duration-700 ease-in-out z-0"
                   style={{ 
                     width: `${
                      order.order_status === "PENDING" ? "12%" : 
                      order.order_status === "CONFIRMED" ? "38%" : 
                      order.order_status === "DISPATCHED" ? "65%" : 
                      order.order_status === "DELIVERED" ? "100%" : "0%"
                     }` 
                   }}
                 ></div>
                 
                 <div className="relative z-10 flex justify-between w-full">
                    {[
                      { status: "PENDING", label: "Ordered", icon: Package },
                      { status: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
                      { status: "DISPATCHED", label: "Shipped", icon: Truck },
                      { status: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
                    ].map((step, idx) => {
                       const isCompleted = 
                         (order.order_status === "CONFIRMED" && idx <= 1) ||
                         (order.order_status === "DISPATCHED" && idx <= 2) ||
                         (order.order_status === "DELIVERED" && idx <= 3) ||
                         (order.order_status === "PENDING" && idx === 0);
                       
                       const isCurrent = order.order_status === step.status;

                       return (
                         <div key={idx} className="flex flex-col items-center gap-3">
                            <div className={`
                               w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white
                               ${isCompleted ? "border-black text-black" : "border-gray-200 text-gray-300"}
                            `}>
                               {isCompleted ? <step.icon className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-gray-200" />}
                            </div>
                            <span className={`text-xs md:text-sm font-medium ${isCompleted ? "text-black" : "text-gray-400"}`}>
                              {step.label}
                            </span>
                         </div>
                       )
                    })}
                 </div>
              </div>

              {(order.payment_status === "INITIATED" || order.payment_status === "PENDING" || order.payment_status === "FAILED") && (
                 <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-4">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                       <h3 className="text-sm font-semibold text-amber-800">Payment Pending</h3>
                       <p className="text-sm text-amber-700 mt-1">
                          We noticed your payment hasn't been completed yet. Please pay now to confirm your order.
                       </p>
                    </div>
                 </div>
              )}
            </div>

            {/* Items List */}
            <div className="bg-white rounded-xl border p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-medium font-tenor mb-6 flex items-center gap-2">
                Items from your order
                <span className="text-sm text-muted-foreground font-sans bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
              </h2>
              <div className="space-y-6">
                {items.length > 0 ? items.map((item, idx) => {
                  // Fallback for missing product data if API hasn't populated it yet
                  const productName = item.product?.name || item.product_snapshot?.name || "Product";
                  const productImg = item.product?.product_images?.[0]?.url || "";
                  
                  return (
                    <div key={item.id || idx} className="group">
                       <div className="flex gap-4 md:gap-6">
                          {/* Image */}
                          <div className="w-20 h-24 md:w-24 md:h-32 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                             {productImg ? (
                               <img src={productImg} alt={productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-300">
                                 <Package className="w-8 h-8 opacity-20" />
                               </div>
                             )}
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1 flex flex-col justify-between py-1">
                             <div>
                                <div className="flex justify-between items-start gap-4">
                                   <h3 className="font-medium text-base text-gray-900 line-clamp-2">{productName}</h3>
                                   <span className="font-medium text-gray-900">{formatPrice(item.unit_price * item.quantity)}</span>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                   <p>Qty: {item.quantity}</p>
                                   {item.metadata?.size && <p className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-gray-300" /> Size: {item.metadata.size}</p>}
                                   {item.metadata?.color && <p className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-gray-300" /> Color: {item.metadata.color}</p>}
                                </div>
                             </div>
                             {item.unit_price !== item.quantity * item.unit_price && (
                                <p className="text-xs text-muted-foreground">{formatPrice(item.unit_price)} each</p>
                             )}
                          </div>
                       </div>
                       {idx < items.length - 1 && <Separator className="my-6" />}
                    </div>
                  );
                }) : (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                       <Package className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-muted-foreground">Loading order items...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Estimated Delivery Date - Show only if set and not delivered/cancelled */}
            {order.estimated_delivery_date && order.order_status !== 'DELIVERED' && order.order_status !== 'CANCELLED' && (
               <div className="bg-white rounded-xl border p-6 shadow-sm sticky top-24 border-blue-100 bg-blue-50/50">
                  <div className="flex items-start gap-4">
                     <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-blue-600" />
                     </div>
                     <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-900 mb-1">Estimated Delivery</h3>
                        <p className="text-xl font-tenor text-blue-950">
                           {new Date(order.estimated_delivery_date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">By end of day</p>
                     </div>
                  </div>
               </div>
            )}

            <div className="bg-white rounded-xl border p-6 shadow-sm">
               <h2 className="text-lg font-medium font-tenor mb-6">Order Summary</h2>
               
               <div className="space-y-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                     <span>Subtotal</span>
                     <span>{formatPrice(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                     <span>Shipping</span>
                     <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between items-center">
                     <span className="font-medium text-base">Total</span>
                     <span className="font-bold text-lg">{formatPrice(order.total_amount)}</span>
                  </div>
               </div>

               <div className="mt-8">
                  <div className={`rounded-lg p-4 flex items-center justify-center gap-2 border ${
                     order.payment_status === "PAID" 
                       ? "bg-green-50 border-green-100 text-green-700" 
                       : "bg-amber-50 border-amber-100 text-amber-700"
                  }`}>
                     {order.payment_status === "PAID" ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium">Payment Successful</span>
                        </>
                     ) : (
                        <>
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-medium">Payment Pending</span>
                        </>
                     )}
                  </div>
                  
                  {isPaymentPending && (
                     <Button onClick={handleRetryPayment} disabled={paying} className="w-full mt-4 bg-black text-white hover:bg-gray-800 h-10">
                        {paying ? "Processing..." : "Retry Payment"}
                     </Button>
                  )}
               </div>
            </div>

            <div className="bg-white rounded-xl border p-6 shadow-sm">
               <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Shipping To</h3>
               <div className="text-sm space-y-3">
                  <div>
                    <p className="font-medium text-gray-900 text-base">{order.shipping_address?.name || order.customer_name}</p>
                    <p className="text-muted-foreground leading-relaxed mt-1">
                      {order.shipping_address?.address_line1 || order.shipping_address?.street || "Address info unavailable"}
                      <br />
                      {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}
                    </p>
                  </div>
                  <div className="pt-3 border-t">
                     <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Contact</p>
                     <p className="font-medium">{order.shipping_address?.phone || order.customer_phone}</p>
                     <p className="text-muted-foreground">{order.customer_email}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

function ImageIcon() {
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
    )
}

export default OrderDetail;

