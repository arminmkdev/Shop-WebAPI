// API_BASE_URL will come from (client.js) because getProductImageUrl need it
import { API_BASE_URL } from "../api/client";

export const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));

export const safeText = (value, fallback = "—") =>
  value == null || value === "" ? fallback : String(value);

export const getProductImageUrl = (imageUrl) => {
  const value = safeText(imageUrl, "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
};
