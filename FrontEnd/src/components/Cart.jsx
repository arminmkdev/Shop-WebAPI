import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMessage } from "../hooks/useMessage";
import Alert from "./Alert";
import {
  getCart,
  clearCart as clearCartService,
} from "../services/cartService";
import { updateCartItem, deleteCartItem } from "../services/cartItemService";
import { createOrder } from "../services/orderService";
import { getCurrentUserId } from "../services/authService";
import { money, safeText } from "../utils/format";

export default function Cart() {
  const [cart, setCart] = useState(null),
    [alert, show, clear] = useMessage(),
    [busy, setBusy] = useState(false),
    navigate = useNavigate();
  const load = async () => {
    try {
      setCart(await getCart());
    } catch (e) {
      show(e.message, "danger");
      setCart({ cartItems: [], totalPrice: 0 });
    }
  };
  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener("shop-refresh-data", refresh);
    return () => window.removeEventListener("shop-refresh-data", refresh);
  }, []);
  const items = Array.isArray(cart?.cartItems) ? cart.cartItems : [];
  async function update(item, quantity) {
    try {
      await updateCartItem(item.cartItemId, quantity);
      await load();
    } catch (e) {
      show(e.message, "danger");
    }
  }
  async function remove(item) {
    try {
      await deleteCartItem(item.cartItemId);
      await load();
    } catch (e) {
      show(e.message, "danger");
    }
  }
  async function clearCart() {
    try {
      await clearCartService();
      await load();
      show("Cart cleared.", "success");
    } catch (e) {
      show(e.message, "danger");
    }
  }
  async function checkout() {
    if (!items.length) {
      show("Your cart is empty.", "warning");
      return;
    }
    const userId = await getCurrentUserId();
    if (!userId) {
      show(
        "A user ID is required to create an order. Check the identity endpoint and user ID retrieval.",
        "warning",
      );
      return;
    }
    try {
      setBusy(true);
      await createOrder();
      await clearCartService();
      show("Order created successfully.", "success");
      await load();
      navigate("/orders");
    } catch (e) {
      show(`Could not place order: ${e.message}`, "danger");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold mb-6 font-display">
        Shopping Cart
      </h1>
      <Alert message={alert?.message} type={alert?.type} onClose={clear} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-surface border border-app rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream-200 dark:bg-brand-900/30 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Unit price</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Total</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length ? (
                    items.map((i) => (
                      <tr
                        key={i.cartItemId}
                        className="border-t border-app hover:bg-cream-100 dark:hover:bg-white/5"
                      >
                        <td className="p-3">
                          {safeText(i.productName, `Product ${i.productId}`)}
                        </td>
                        <td className="p-3">{money(i.price)}</td>
                        <td className="p-3">{i.quantity}</td>
                        <td className="p-3">{money(i.totalPrice)}</td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="inline-flex rounded-lg overflow-hidden border border-app mr-2">
                            <button
                              className="px-2.5 py-1 bg-surface text-muted hover:bg-cream-200"
                              onClick={() =>
                                update(i, Math.max(1, Number(i.quantity) - 1))
                              }
                            >
                              −
                            </button>
                            <button
                              className="px-2.5 py-1 bg-surface text-muted hover:bg-cream-200"
                              onClick={() => update(i, Number(i.quantity) + 1)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="px-2.5 py-1 text-sm border border-blush-400 text-blush-500 rounded-lg hover:bg-blush-100"
                            onClick={() => remove(i)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-6">
                        Your cart is empty.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-surface border border-app rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold mb-4">Summary</h2>
            <div className="flex justify-between mb-4">
              <span>Total</span>
              <strong className="text-brand-700">
                {money(cart?.totalPrice)}
              </strong>
            </div>
            <button
              className="w-full bg-brand-700 text-white font-semibold rounded-lg py-2.5 hover:bg-brand-900 disabled:opacity-60"
              disabled={busy}
              onClick={checkout}
            >
              {busy ? "Processing…" : "Place order"}
            </button>
            <button
              className="w-full mt-2 border border-blush-400 text-blush-500 font-semibold rounded-lg py-2.5 hover:bg-blush-100"
              onClick={clearCart}
            >
              Clear cart
            </button>
            <p className="text-sm text-muted mt-4 mb-0">
              Sign in before using your cart.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
