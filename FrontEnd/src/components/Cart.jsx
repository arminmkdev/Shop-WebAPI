import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMessage } from "../hooks/useMessage";
import Alert from "./Alert";
import {
  API_PATHS,
  apiGet,
  apiPatch,
  apiDelete,
  apiPost,
  money,
  safeText,
  getCurrentUserId,
} from "../api";

export default function Cart() {
  const [cart, setCart] = useState(null),
    [alert, show, clear] = useMessage(),
    [busy, setBusy] = useState(false),
    navigate = useNavigate();
  const load = async () => {
    try {
      setCart(await apiGet(API_PATHS.cart));
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
      await apiPatch(
        `${API_PATHS.cartItems}/${encodeURIComponent(item.cartItemId)}`,
        { quantity },
      );
      await load();
    } catch (e) {
      show(e.message, "danger");
    }
  }
  async function remove(item) {
    try {
      await apiDelete(
        `${API_PATHS.cartItems}/${encodeURIComponent(item.cartItemId)}`,
      );
      await load();
    } catch (e) {
      show(e.message, "danger");
    }
  }
  async function clearCart() {
    try {
      await apiDelete(API_PATHS.cart);
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
      await apiPost(API_PATHS.orders);
      await apiDelete(API_PATHS.cart);
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
    <main className="container py-4">
      <h1 className="h3 mb-4">Shopping Cart</h1>
      <Alert message={alert?.message} type={alert?.type} onClose={clear} />
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Unit price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length ? (
                    items.map((i) => (
                      <tr key={i.cartItemId}>
                        <td>
                          {safeText(i.productName, `Product ${i.productId}`)}
                        </td>
                        <td>{money(i.price)}</td>
                        <td>{i.quantity}</td>
                        <td>{money(i.totalPrice)}</td>
                        <td className="text-nowrap">
                          <div className="btn-group btn-group-sm me-2">
                            <button
                              className="btn btn-outline-secondary"
                              title="Decrease quantity"
                              onClick={() =>
                                update(i, Math.max(1, Number(i.quantity) - 1))
                              }
                            >
                              −
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              title="Increase quantity"
                              onClick={() => update(i, Number(i.quantity) + 1)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => remove(i)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center text-secondary py-4"
                      >
                        Your cart is empty.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h2 className="h5">Summary</h2>
              <div className="d-flex justify-content-between mb-3">
                <span>Total</span>
                <strong>{money(cart?.totalPrice)}</strong>
              </div>
              <button
                className="btn btn-primary w-100"
                disabled={busy}
                onClick={checkout}
              >
                {busy ? "Processing…" : "Place order"}
              </button>
              <button
                className="btn btn-outline-danger w-100 mt-2"
                onClick={clearCart}
              >
                Clear cart
              </button>
              <p className="small text-secondary mt-3 mb-0">
                Sign in before using your cart.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
