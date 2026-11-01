import { API_PATHS, apiGet, apiDelete } from "../api/client";

export async function getCart() {
  return apiGet(API_PATHS.cart);
}

export async function clearCart() {
  return apiDelete(API_PATHS.cart);
}
