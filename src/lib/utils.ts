import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price as INR currency
 * @param price Price as number
 * @returns Formatted price string (e.g., "₹1,999")
 */
export function formatPrice(price: number | string): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(numPrice);
  } catch (err) {
    // Fallback if Intl fails
    return `₹${numPrice.toLocaleString("en-IN")}`;
  }
}
