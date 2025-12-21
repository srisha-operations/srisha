import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser } from "@/services/auth";
import { listCart } from "@/services/cart";
import { createOrder, createPreorder, getShopMode } from "@/services/checkout";
import { clearCart } from "@/services/cart";
import { initiatePayment } from "@/services/payment";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const OWNER_UPI = import.meta.env.VITE_OWNER_UPI || "upi@example";

const validateCheckoutForm = (shipping: any) => {
  const errors: Record<string, string> = {};
  
  if (!shipping.name || shipping.name.trim().length < 2) {
    errors.name = "Please enter your full name (min 2 characters).";
  }
  
  if (!shipping.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) {
    errors.email = "Please enter a valid email address.";
  }
  
  if (!shipping.phone || !/^[6-9]\d{9}$/.test(shipping.phone)) {
    errors.phone = "Please enter a valid 10-digit mobile number starting with 6-9.";
  }
  
  if (!shipping.address_line1 || shipping.address_line1.trim().length < 5) {
    errors.address_line1 = "Please enter your shipping address.";
  }
  
  if (!shipping.pincode || !/^\d{6}$/.test(shipping.pincode)) {
    errors.pincode = "PIN code must be 6 digits.";
  }
  
  return errors;
};

const Checkout = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<"normal" | "preorder">("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [shipping, setShipping] = useState({
    name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const { toast } = useToast();

  // Real-time validation
  useEffect(() => {
    if (mode === "normal") {
      const validationErrors = validateCheckoutForm(shipping);
      setErrors(validationErrors);
      setIsFormValid(Object.keys(validationErrors).length === 0);
    } else {
      // For preorder, only require name/email/phone
      const preorderErrors: Record<string, string> = {};
      if (!shipping.name || shipping.name.trim().length < 2) {
        preorderErrors.name = "Name required";
      }
      if (!shipping.email) {
        preorderErrors.email = "Email required";
      }
      if (!shipping.phone) {
        preorderErrors.phone = "Phone required";
      }
      setErrors(preorderErrors);
      setIsFormValid(Object.keys(preorderErrors).length === 0);
    }
  }, [shipping, mode]);

  useEffect(() => {
    (async () => {
      try {
        const u = await getCurrentUser();
        setUser(u);

        // read shop mode
        const shopMode = await getShopMode();
        setMode(shopMode);

        // load cart items
        const cart = await listCart(u?.id);
        if (!cart || !cart.length) {
          setItems([]);
          setLoading(false);
          return;
        }

        const pids = cart.map((c: any) => c.product_id);
        const { data: products } = await supabase
          .from("products")
          .select("*, product_images(*), product_variants(*)")
          .in("id", pids);

        const filled = cart.map((c: any) => {
          const prod = products?.find((p: any) => p.id === c.product_id);
          return { ...prod, cartMeta: c };
        });

        setItems(filled || []);

        // prefill user data
        if (u?.email) {
          setShipping((prev) => ({
            ...prev,
            email: u.email,
            name: u.user_metadata?.name || "",
          }));
        }
      } catch (e) {
        console.error("Checkout load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = items.reduce(
    (sum, it) => sum + (it.price || 0) * (it.cartMeta?.quantity || 1),
    0
  );

  const handlePlaceOrder = async () => {
    // Debug logs removed to reduce console noise during normal usage
    if (!items.length) {
      toast({ title: "Cart is empty", description: "Your cart is empty.", duration: 3000 });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "preorder") {
        // Preorder: just create an order with is_preorder=true
        const orderItems = items.map((item) => ({
          product_id: item.id,
          variant_id: item.cartMeta?.variant_id || null,
          quantity: item.cartMeta?.quantity || 1,
          unit_price: item.price || 0,
          metadata: { size: item.cartMeta?.size || null },
        }));

        const result = await createPreorder(
          {
            customer_name: shipping.name || user?.user_metadata?.name || user?.email || "Guest",
            customer_email: shipping.email || user?.email || "",
            customer_phone: shipping.phone || "",
            shipping_address: shipping,
            total_amount: total,
            is_preorder: true,
          },
          orderItems,
          user?.id
        );

        toast({ title: `Preorder submitted`, description: `Order #${result.orderNumber}. Admin will contact you shortly.`, duration: 4000 });
        // Clear cart
        window.dispatchEvent(new Event("cartUpdated"));
        window.location.href = "/";
        return;
      }

      // Normal order flow - validate
      const newErrors = validateCheckoutForm(shipping);

      if (Object.keys(newErrors).length) {
        setErrors(newErrors);
        setIsSubmitting(false);
        // show first error as toast and scroll to first error
        const firstErrorKey = Object.keys(newErrors)[0];
        const firstErrorElement = document.getElementById(firstErrorKey);
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          firstErrorElement.focus();
        }
        toast({ title: "Validation Error", description: Object.values(newErrors)[0] });
        return;
      }
      setErrors({});

      const orderItems = items.map((item) => ({
        product_id: item.id,
        variant_id: item.cartMeta?.variant_id || null,
        quantity: item.cartMeta?.quantity || 1,
        unit_price: item.price || 0,
        metadata: { size: item.cartMeta?.size || null },
      }));

      const result = await createOrder(
        {
          customer_name: shipping.name,
          customer_email: shipping.email || user?.email || "",
          customer_phone: shipping.phone,
          shipping_address: shipping,
          total_amount: total,
          is_preorder: false,
        },
        orderItems,
        user?.id
      );

      toast({ title: `Order created!`, description: `Order #${result.orderNumber}. Initiating payment...`, duration: 4000 });

      // Clear the cart so the UI shows no items
      try {
        await clearCart(user?.id);
      } catch (e) {
        console.error("Failed to clear cart post-order", e);
      }

      // Initiate payment via backend service
      // The backend will create payment intent and return safe data
      console.log("Razorpay script loaded:", typeof (window as any).Razorpay);
      
      const paymentResult = await initiatePayment({
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        amount: total,
        customerEmail: shipping.email || user?.email || "",
        customerName: shipping.name,
        customerPhone: shipping.phone,
      });

      console.log("Payment initiation response:", paymentResult);

      // Open Razorpay Checkout modal with order details from backend
      if (paymentResult.razorpayOrderId && paymentResult.razorpayKeyId) {
        // Defensive check: ensure Razorpay script is loaded
        const RazorpayClass = (window as any).Razorpay;
        if (!RazorpayClass) {
          console.error("Razorpay script not loaded. Window.Razorpay is undefined.");
          console.error("Checked at:", new Date().toISOString());
          console.error("window object keys related to Razorpay:", 
            Object.keys(window).filter(key => key.toLowerCase().includes('razor')));
          toast({
            title: "Payment gateway error",
            description: "Razorpay is not available. Please reload and try again.",
            duration: 4000,
          });
          navigate(`/orders/${result.orderId}`);
          return;
        }

        try {
          // Razorpay checkout options
          const options = {
            key: paymentResult.razorpayKeyId,
            amount: total * 100, // Amount in paise
            currency: "INR",
            name: "SRISHA",
            description: `Order ${result.orderNumber}`,
            order_id: paymentResult.razorpayOrderId,
            customer_notification: 1, // Razorpay will send SMS/email
            prefill: {
              name: shipping.name,
              email: shipping.email || user?.email || "",
              contact: shipping.phone,
            },
            theme: {
              color: "#000000", // SRISHA brand color
            },
            // Callback handlers
            handler: function (response: any) {
              // This is called after successful payment
              console.log("Payment successful. Razorpay response:", response);
              toast({
                title: "Payment successful",
                description: "Your order has been confirmed.",
                duration: 4000,
              });
              navigate(`/orders/${result.orderId}`);
            },
          };

          console.log("Creating Razorpay checkout with options:", JSON.stringify(options, null, 2));
          
          // Create Razorpay instance
          const checkout = new RazorpayClass(options);
          console.log("Razorpay checkout instance created successfully");

          // Handle payment failure
          checkout.on("payment.failed", function (response: any) {
            console.error("Payment failed. Razorpay error:", response.error);
            toast({
              title: "Payment failed",
              description: "Please try again or contact support.",
              duration: 4000,
            });
            // Navigate to order page - order still exists
            navigate(`/orders/${result.orderId}`);
          });

          // Handle modal dismissal (user closes without paying)
          checkout.on("payment.dismiss", function () {
            console.log("Payment modal dismissed by user");
            // Poll to check if payment actually went through
            setTimeout(() => {
              console.log("Checking payment status after modal close...");
            }, 500);
            toast({
              title: "Payment cancelled",
              description: "You can complete payment later from your orders.",
              duration: 4000,
            });
            // Navigate to order page - order still exists
            navigate(`/orders/${result.orderId}`);
          });

          console.log("About to call checkout.open()...");
          // Open the checkout modal - MUST happen before any navigation
          checkout.open();
          console.log("checkout.open() called successfully");
        } catch (error) {
          console.error("Error creating/opening Razorpay checkout:", error);
          console.error("Error stack:", (error as any).stack);
          toast({
            title: "Payment error",
            description: "Failed to open payment modal. Please try again.",
            duration: 4000,
          });
          navigate(`/orders/${result.orderId}`);
        }
      } else {
        // Fallback if Razorpay details not available
        console.warn("Razorpay payment details not available:", paymentResult);
        console.warn("Expected razorpayOrderId and razorpayKeyId in response");
        toast({
          title: "Payment initiated",
          description: `Order #${result.orderNumber} is ready. Waiting for payment confirmation...`,
          duration: 4000,
        });
        navigate(`/orders/${result.orderId}`);
      }
    } catch (e) {
      console.error("Order creation failed:", e);
      toast({ title: "Failed to create order", description: (e as any).message || "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading) return <div className="pt-24">Loading...</div>;

  return (
    <div className="w-full min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20 px-8 lg:px-16 xl:px-24">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" className="p-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-tenor text-4xl">Checkout</h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-lato text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => (window.location.href = "/products")}>Continue Shopping</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-8">
              <div className="border border-border rounded p-6">
                <h2 className="font-tenor text-2xl mb-6">Order Summary</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.cartMeta?.variant_id || 'no-variant'}-${item.cartMeta?.id || ''}`} className="flex justify-between py-3 border-b border-border last:border-b-0">
                      <div>
                        <p className="font-tenor">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.cartMeta?.quantity || 1}
                        </p>
                      </div>
                      <p className="font-lato">
                        {formatPrice((item.price || 0) * (item.cartMeta?.quantity || 1))}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-border flex justify-between text-lg">
                  <span className="font-tenor">Total:</span>
                  <span className="font-tenor">{formatPrice(total)}</span>
                </div>
              </div>

              {mode === "normal" && (
                <div className="border border-border rounded p-6">
                  <h2 className="font-tenor text-2xl mb-6">Shipping Address</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={shipping.name}
                        onChange={(e) =>
                          setShipping({ ...shipping, name: e.target.value })
                        }
                        className={`mt-1 ${errors.name ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                      {errors.name && (
                        <p className="text-destructive text-sm mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shipping.email}
                        onChange={(e) =>
                          setShipping({ ...shipping, email: e.target.value })
                        }
                        className={`mt-1 ${errors.email ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                      {errors.email && (
                        <p className="text-destructive text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={shipping.phone}
                        onChange={(e) =>
                          setShipping({ ...shipping, phone: e.target.value })
                        }
                        className={`mt-1 ${errors.phone ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                      {errors.phone && (
                        <p className="text-destructive text-sm mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="address1">Address Line 1 *</Label>
                      <Input
                        id="address1"
                        value={shipping.address_line1}
                        onChange={(e) =>
                          setShipping({ ...shipping, address_line1: e.target.value })
                        }
                        className={`mt-1 ${errors.address_line1 ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                      {errors.address_line1 && (
                        <p className="text-destructive text-sm mt-1">{errors.address_line1}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                      <Input
                        id="address2"
                        value={shipping.address_line2}
                        onChange={(e) =>
                          setShipping({ ...shipping, address_line2: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={shipping.city}
                          onChange={(e) =>
                            setShipping({ ...shipping, city: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={shipping.state}
                          onChange={(e) =>
                            setShipping({ ...shipping, state: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="pincode">PIN Code *</Label>
                      <Input
                        id="pincode"
                        value={shipping.pincode}
                        onChange={(e) =>
                          setShipping({ ...shipping, pincode: e.target.value })
                        }
                        className={`mt-1 ${errors.pincode ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                      {errors.pincode && (
                        <p className="text-destructive text-sm mt-1">{errors.pincode}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || !isFormValid}
                    className="w-full mt-6 bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Processing..." : "Place Order & Pay"}
                  </Button>
                </div>
              )}

              {mode === "preorder" && (
                <div className="border border-border rounded p-6 bg-amber-50">
                  <h2 className="font-tenor text-2xl mb-4">Pre-Order Request</h2>
                  <p className="font-lato text-muted-foreground mb-6">
                    This is a pre-order. Our team will contact you shortly to confirm details and pricing.
                  </p>

                  <div>
                    <Label htmlFor="preorder-name">Your Name</Label>
                    <Input
                      id="preorder-name"
                      value={shipping.name}
                      onChange={(e) =>
                        setShipping({ ...shipping, name: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="preorder-email">Email</Label>
                    <Input
                      id="preorder-email"
                      type="email"
                      value={shipping.email}
                      onChange={(e) =>
                        setShipping({ ...shipping, email: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="preorder-phone">Phone</Label>
                    <Input
                      id="preorder-phone"
                      value={shipping.phone}
                      onChange={(e) =>
                        setShipping({ ...shipping, phone: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || !isFormValid}
                    className="w-full mt-6 bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Pre-Order Request"}
                  </Button>
                </div>
              )}
            </div>

            {/* Order Total Sidebar */}
            <div className="lg:col-span-1">
              <div className="border border-border rounded p-6 sticky top-24">
                <h3 className="font-tenor text-xl mb-4">Order Total</h3>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-tenor border-t border-border pt-4">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {mode === "normal" && (
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    <p className="mb-2">💳 Secure Payment via Razorpay</p>
                    <p>You will be redirected to a secure payment gateway after submitting your order.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
