import { supabase } from "@/lib/supabaseClient";

export interface OrderPayload {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: any; // JSON
  total_amount: number;
  is_preorder?: boolean;
}

export interface OrderItem {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price: number;
  metadata?: any; // e.g., { size: "M", color: "red" }
}

/**
 * Generate order number: SO-00001, SO-00002, etc.
 * Gets the max order_number and increments
 */
const generateOrderNumber = async (): Promise<string> => {
  const { data } = await supabase
    .from("orders")
    .select("order_number")
    .order("order_number", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].order_number;
    if (lastNumber) {
      const match = lastNumber.match(/\d+$/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
  }

  return `SO-${String(nextNum).padStart(5, "0")}`;
};

/**
 * Create order and order_items in a single transaction-like flow.
 * Sets payment_status = 'INITIATED' for backend payment processing.
 * Frontend must call initiatePayment() to trigger payment intent creation.
 */
export const createOrder = async (
  payload: OrderPayload,
  items: OrderItem[],
  userId?: string | null
): Promise<{ orderId: string; orderNumber: string }> => {
  try {
    const orderNumber = await generateOrderNumber();

    // try primary insert (newer schema with shipping_address, total_amount)
    const insertObj: any = {
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      customer_phone: payload.customer_phone,
      shipping_address: payload.shipping_address,
      total_amount: payload.total_amount,
      is_preorder: payload.is_preorder || false,
      order_number: orderNumber,
      order_status: "PENDING",
      // For non-preorder, set initial payment state
      payment_status: payload.is_preorder ? null : "INITIATED",
    };

    if (userId) insertObj.user_id = userId;

    let orderData: any = null;

    try {
      const res = await supabase.from("orders").insert(insertObj).select("id").single();
      if (res.error) throw res.error;
      orderData = res.data;
    } catch (errPrimary) {
      // Primary insert failed — attempt fallback to older schema (uses 'total' column and user_id)
      console.warn("Primary order insert failed, attempting fallback:", errPrimary);
      const fallback = {
        order_number: orderNumber,
        order_status: "PENDING",
        total: payload.total_amount ?? payload.total ?? 0,
      } as any;
      if (userId) fallback.user_id = userId;
      // For non-preorder, set payment_status if the column exists in older schema
      if (!payload.is_preorder) {
        (fallback as any).payment_status = "INITIATED";
      }

      const res2 = await supabase.from("orders").insert(fallback).select("id").single();
      if (res2.error) {
        throw new Error(`Failed to create order (fallback): ${res2.error.message}`);
      }
      orderData = res2.data;
    }

    if (!orderData?.id) throw new Error("Order insert did not return id");

    const orderId = orderData.id;

    // Insert order items
    const itemsToInsert = items.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      metadata: item.metadata || null,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);

    if (itemsError) {
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    return { orderId, orderNumber };
  } catch (e) {
    console.error("createOrder error:", e);
    throw e;
  }
};

/**
 * Create preorder (is_preorder=true)
 */
export const createPreorder = async (
  payload: OrderPayload,
  items: OrderItem[]
  , userId?: string | null
): Promise<{ orderId: string; orderNumber: string }> => {
  return createOrder(
    { ...payload, is_preorder: true },
    items,
    userId
  );
};

/**
 * Get shop mode from site_content
 */
export const getShopMode = async (): Promise<"normal" | "preorder"> => {
  try {
    const { data, error } = await supabase
      .from("site_content")
      .select("value")
      .eq("key", "shop_settings")
      .single();

    if (error || !data?.value) {
      return "normal"; // default
    }

    const mode = data.value?.mode || "normal";
    return mode === "preorder" ? "preorder" : "normal";
  } catch (e) {
    console.error("getShopMode error:", e);
    return "normal";
  }
};
