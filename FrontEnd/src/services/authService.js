import { API_PATHS, apiGet, apiPost } from "../api/client";

export async function login(email, password) {
  return apiPost(API_PATHS.login, { email, password });
}

export async function register(email, password) {
  return apiPost(API_PATHS.register, { email, password });
}

export async function getCurrentUser() {
  return apiGet(API_PATHS.user);
}

export async function getCurrentUserId() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return "";
    localStorage.setItem("shop.userId", user.id);
    return user.id;
  } catch {
    localStorage.removeItem("shop.userId");
    return "";
  }
}