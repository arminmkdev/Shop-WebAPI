import { API_PATHS, apiPost, apiPatch, apiDelete } from "../api/client";

export async function addCartItem(productId, quantity = 1) {
  return apiPost(API_PATHS.cartItems, {
    productId: Number(productId),
    quantity,
  });
}

export async function updateCartItem(id, quantity) {
  return apiPatch(
    `${API_PATHS.cartItems}/${encodeURIComponent(id)}`,
    { quantity }
  );
}

export async function deleteCartItem(id) {
  return apiDelete(`${API_PATHS.cartItems}/${encodeURIComponent(id)}`);
}