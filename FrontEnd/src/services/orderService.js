import { API_PATHS, apiGet, apiPost } from "../api/client";
import { unwrapArray } from "../utils/array";

export async function getAllOrders() {
  return unwrapArray(await apiGet(API_PATHS.orders));
}

export async function getOrderById(id) {
  return apiGet(`${API_PATHS.orders}/${encodeURIComponent(id)}`);
}

export async function createOrder() {
  return apiPost(API_PATHS.orders);
}
