export type { Product, Category, Banner, Review, Coupon } from "@/db/schema";

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "new", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const PRICE_BANDS = [
  { value: "under-5000", label: "Under ₹5,000", min: 0, max: 4999 },
  { value: "5000-15000", label: "₹5,000 – ₹15,000", min: 5000, max: 15000 },
  { value: "15000-30000", label: "₹15,000 – ₹30,000", min: 15000, max: 30000 },
  { value: "above-30000", label: "Above ₹30,000", min: 30000, max: 10_000_000 },
] as const;

export const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"] as const;
