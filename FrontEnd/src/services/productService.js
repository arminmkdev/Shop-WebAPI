import { API_PATHS, apiGet, apiPost, apiPatch, apiDelete } from "../api/client";
import { unwrapArray } from "../utils/array";

export async function getAllProducts() {
  return unwrapArray(await apiGet(API_PATHS.products));
}

export async function getProductById(id) {
  return apiGet(`${API_PATHS.products}/${encodeURIComponent(id)}`);
}

export async function createProduct(data) {
  return apiPost(API_PATHS.products, data);
}

export async function updateProduct(id, data) {
  return apiPatch(`${API_PATHS.products}/${encodeURIComponent(id)}`, data);
}

export async function deleteProduct(id) {
  return apiDelete(`${API_PATHS.products}/${encodeURIComponent(id)}`);
}
