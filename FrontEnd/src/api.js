const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");
export const API_PATHS = {
  register: "/identity/register",
  login: "/identity/login",
  products: "/products",
  categories: "/Categories",
  cart: "/carts",
  cartItems: "/cartItems",
  orders: "/orders",
};
export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("shop.accessToken");
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData) && options.body !== undefined)
    headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) throw new Error("Please sign in to continue.");
    if (response.status === 403)
      throw new Error("You do not have permission to access this resource.");
    let message = `Request failed (${response.status})`;
    try {
      const data = JSON.parse(text);
      message =
        data.message || data.detail || data.title || data.error || message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  if ([204, 205].includes(response.status)) return null;
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json") || type.includes("text/json"))
    return response.json();
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
export const apiGet = (path) => apiRequest(path);
export const apiPost = (path, body) =>
  apiRequest(path, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
export const apiPatch = (path, body) =>
  apiRequest(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = (path, body) =>
  apiRequest(path, {
    method: "DELETE",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
export function unwrapArray(payload) {
  if (Array.isArray(payload)) return payload;
  return (
    payload?.items ||
    payload?.data ||
    payload?.products ||
    payload?.categories ||
    payload?.orders ||
    []
  );
}
export const money = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value || 0),
  );
export const safeText = (value, fallback = "—") =>
  value == null || value === "" ? fallback : String(value);
export const getProductImageUrl = (imageUrl) => {
  const value = safeText(imageUrl, "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
};
export async function getCurrentUserId() {
  try {
    const user = await apiGet("/identity/user");
    if (!user?.id) return "";
    localStorage.setItem("shop.userId", user.id);
    return user.id;
  } catch {
    localStorage.removeItem("shop.userId");
    return "";
  }
}
