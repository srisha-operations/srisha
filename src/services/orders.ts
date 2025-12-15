// src/services/orders.ts
import { supabase } from "@/lib/supabaseClient";

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address?: Record<string, any>;
  total_amount?: number;
  total?: number;
  status: "pending_payment" | "pending_approval" | "processing" | "shipped" | "delivered" | "cancelled";
  is_preorder?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  metadata?: Record<string, any>;
}

/**
 * Fetch all orders with pagination and filtering
 */
export const listOrders = async (
  filter?: {
    status?: string;
    search?: string; // search by email, name, or order number
  },
  limit = 50,
  offset = 0
): Promise<{ orders: Order[]; total: number }> => {
  try {
    let query = supabase.from("orders").select("*", { count: "exact" });

    // Apply filters
    if (filter?.status) {
      query = query.eq("status", filter.status);
    }

    if (filter?.search) {
      // Search across multiple fields
      query = query.or(
        `order_number.ilike.%${filter.search}%,customer_email.ilike.%${filter.search}%,customer_name.ilike.%${filter.search}%`
      );
    }

    // Apply pagination and sorting
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("listOrders error:", error);
      return { orders: [], total: 0 };
    }

    return { orders: data || [], total: count || 0 };
  } catch (err) {
    console.error("listOrders exception:", err);
    return { orders: [], total: 0 };
  }
};

/**
 * Get a single order with its items
 */
export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`*, order_items(*, product:products(*, product_images(*)))`)
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("getOrder error:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("getOrder exception:", err);
    return null;
  }
};

/**
 * Get order items for a specific order
 */
export const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  try {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("getOrderItems error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("getOrderItems exception:", err);
    return [];
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: Order["status"]
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      console.error("updateOrderStatus error:", error);
      return { success: false, error: error.message };
    }

    // Optional: create an order_events entry to notify other systems (this will fail silently if table not present)
    try {
      await supabase.from("order_events").insert({ order_id: orderId, status, created_at: new Date().toISOString() });
    } catch (err) {
      // ignore: some deployments may not have order_events table
    }
    // Create an app-level event record
    await createOrderEvent(orderId, { type: "status_change", payload: { status } });
    // optional: notify via supabase function 'send_order_notification' if available
    try {
      const { supabase: sb } = await import("@/lib/supabaseClient");
      if (sb?.functions?.invoke) {
        // best-effort call to an edge function
        await sb.functions.invoke("send_order_notification", { body: { order_id: orderId, status } });
      }
    } catch (err) {
      // ignore
    }

    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("updateOrderStatus exception:", err);
    return { success: false, error: errMsg };
  }
};

/**
 * Helper to optionally create an order event. Doesn't crash if the table is missing.
 */
export const createOrderEvent = async (orderId: string, event: { type: string; payload?: any }) => {
  try {
    await supabase.from("order_events").insert({ order_id: orderId, type: event.type, payload: event.payload || {}, created_at: new Date().toISOString() });
  } catch (err) {
    // ignore if not present
  }
};

/**
 * Notify customer about an order status change via an edge function (best-effort).
 */
export const notifyCustomerOrderStatusChange = async (orderId: string, status: Order["status"]) => {
  try {
    const { supabase: sb } = await import("@/lib/supabaseClient");
    if (sb?.functions?.invoke) {
      await sb.functions.invoke("send_order_notification", { body: { order_id: orderId, status } });
    }
  } catch (err) {
    // ignore, no function configured
  }
};

/**
 * Delete an order and its items
 */
export const deleteOrder = async (orderId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Delete order items first
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("deleteOrder items error:", itemsError);
      return { success: false, error: itemsError.message };
    }

    // Delete order
    const { error: orderError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (orderError) {
      console.error("deleteOrder order error:", orderError);
      return { success: false, error: orderError.message };
    }

    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("deleteOrder exception:", err);
    return { success: false, error: errMsg };
  }
};
