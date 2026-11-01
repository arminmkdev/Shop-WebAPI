import { API_PATHS, apiGet } from "../api/client";
import { unwrapArray } from "../utils/array";

export async function getAllCategories() {
  return unwrapArray(await apiGet(API_PATHS.categories));
}

export async function getCategoryById(id) {
  return apiGet(`${API_PATHS.categories}/${encodeURIComponent(id)}`);
}
