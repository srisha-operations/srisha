// src/components/CartDrawer.tsx
import { useEffect, useState } from "react";
import { Loader } from "./ui/loader";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { AspectRatio } from "./ui/aspect-ratio";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { listCart, removeFromCart, submitPreorder } from "@/services/cart";
import { getCurrentUser } from "@/services/auth";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartDrawer = ({ open, onOpenChange }: Props) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"normal" | "inquiry">("normal");
  const { toast } = useToast();

  const load = async () => {
    const user = await getCurrentUser();
    if (!user) {
      // guest -> read local storage and fetch product rows
      const s = localStorage.getItem("srisha_cart");
      const local = s ? JSON.parse(s) : [];
      if (!local.length) {
        setItems([]);
        return;
      }
      const pids = local.map((l: any) => l.product_id);
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*), product_variants(*)")
        .in("id", pids);
      // attach qty & local ids
      // Fix: Map over LOCAL items, not products, to support multiple variants of same product
      const filled = local.map((l: any) => {
        const p = data?.find((d: any) => d.id === l.product_id);
        if (!p) return null;
        return {
          ...p,
          cartMeta: l, // Unify structure with logged-in flow
          quantity: l.quantity || 1, // keeping top-level quantity for compat if needed, but better to use cartMeta
        };
      }).filter(Boolean);
      setItems(filled);
      return;
    }

    const cart = await listCart(user.id);
    if (!cart.length) {
      setItems([]);
      return;
    }
    const pids = cart.map((c: any) => c.product_id);
    const { data } = await supabase
      .from("products")
      .select("*, product_images(*), product_variants(*)")
      .in("id", pids);
    // join
    const filled = cart.map((c: any) => {
      const prod = data.find((d: any) => d.id === c.product_id);
      return { ...prod, cartMeta: c };
    });
    setItems(filled);
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
    const onUpdate = () => load();
    window.addEventListener("cartUpdated", onUpdate);
    return () => window.removeEventListener("cartUpdated", onUpdate);
  }, [open]);

  useEffect(() => {
    // read shop mode from site_content
    (async () => {
      const { data } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "shop_settings")
        .single();
      const m = data?.value?.mode || "normal";
      setMode(m === "inquiry" ? "inquiry" : "normal");
    })();
  }, []);

  const handleRemove = async (productId: string) => {
    // optimistic UI update
    const prev = items;
    setItems((cur) => cur.filter((p) => p.id !== productId));

    const user = await getCurrentUser();

    if (!user) {
      try {
        await removeFromCart(productId);
      } catch (err) {
        console.error("remove cart local failed", err);
        setItems(prev);
      }
      return;
    }

    try {
      // find the cart item id for logged in user and delete
      const cart = await listCart(user.id);
      const ci = cart.find((c: any) => c.product_id === productId);
      if (ci) {
        await removeFromCart(ci.id, user.id);
      }
      // reload to ensure accurate state
      await load();
    } catch (err) {
      console.error("remove cart failed", err);
      setItems(prev);
    }
  };

  const handleCheckout = async () => {
    const user = await getCurrentUser();
    if (!user) {
      window.dispatchEvent(
        new CustomEvent("openAuthModal", { detail: "signin" })
      );
      return;
    }

    if (mode === "inquiry") {
      await submitPreorder(user.id);
      toast({ title: "Preorder sent", description: "The admin will contact you.", duration: 4000 });
      load();
      return;
    }

    // normal flow - go to checkout
    window.location.href = "/checkout";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full md:w-[400px] lg:w-[500px] bg-background overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="font-tenor text-2xl tracking-wide text-foreground">
            Cart
          </SheetTitle>
        </SheetHeader>

        {loading ? (
           <Loader />
        ) : !items.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="font-lato text-muted-foreground mb-4">
              Your cart is empty
            </p>
            <Link to="/" onClick={() => onOpenChange(false)}>
              <Button variant="outline" className="font-lato">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((p: any, idx: number) => (
              <div
                key={p.id}
                className="flex gap-4 items-start pb-6 border-b border-border last:border-0"
              >
                <div className="flex-shrink-0 w-8 text-center pt-2">
                  <span className="font-lato text-sm font-medium text-muted-foreground">
                    {idx + 1}
                  </span>
                </div>
                <div className="w-24 flex-shrink-0 hover:opacity-80 transition-opacity">
                  <AspectRatio ratio={4 / 5}>
                    <img
                      src={p.product_images?.[0]?.url}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className="font-tenor text-lg text-foreground mb-1">
                    {p.name}
                  </h4>
                  <p className="text-base text-muted-foreground">₹{p.price}</p>
                  {(() => {
                     // resolve size
                     const vid = p.cartMeta?.variant_id;
                     const v = p.product_variants?.find((x: any) => x.id === vid);
                     if (v && v.size) {
                       return <p className="text-sm text-muted-foreground mt-0.5">Size: {v.size}</p>;
                     }
                     return null;
                  })()}
                </div>
                <div className="flex-shrink-0 pt-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(p.id)}
                    className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-6 border-t border-border">
          <Button onClick={handleCheckout} className="w-full">
            {mode === "inquiry" ? "Pre-order / Send Inquiry" : "Checkout"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
