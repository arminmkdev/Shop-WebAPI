import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMessage } from "../hooks/useMessage";
import Alert from "./Alert";
import { API_PATHS, apiGet, money, safeText } from "../api";

export default function OrderDetails() {
  const [params] = useSearchParams(),
    id = params.get("id"),
    [order, setOrder] = useState(null),
    [alert, show, clear] = useMessage();
  useEffect(() => {
    let alive = true;
    async function load() {
      if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        show("Invalid order ID.", "danger");
        return;
      }
      try {
        const data = await apiGet(
          `${API_PATHS.orders}/${encodeURIComponent(id)}`,
        );
        if (alive) setOrder(data);
      } catch (e) {
        if (alive) show(`Could not load order details: ${e.message}`, "danger");
      }
    }
    load();
    const refresh = () => load();
    window.addEventListener("shop-refresh-data", refresh);
    return () => {
      alive = false;
      window.removeEventListener("shop-refresh-data", refresh);
    };
  }, [id]);
  const items = Array.isArray(order?.orderDetails) ? order.orderDetails : [];
  return (
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Order Details</h1>
        <Link to="/orders" className="btn btn-outline-secondary">
          Back to Orders
        </Link>
      </div>
      <Alert message={alert?.message} type={alert?.type} onClose={clear} />
      <section className="card mb-4">
        <div className="card-body">
          <p className="mb-2">
            <strong>Order ID:</strong> {safeText(order?.orderId)}
          </p>
          <p className="mb-2">
            <strong>Status:</strong> {safeText(order?.orderStatus)}
          </p>
          <p className="mb-0">
            <strong>Total:</strong> {order ? money(order.totalPrice) : "—"}
          </p>
        </div>
      </section>
      <h2 className="h4 mb-3">Order Items</h2>
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((i, n) => (
                <tr key={i.orderDetailId || n}>
                  <td>{safeText(i.productId)}</td>
                  <td>{money(i.price)}</td>
                  <td>{safeText(i.quantity)}</td>
                  <td>{money(i.totalPrice)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center text-secondary py-4">
                  {order
                    ? "No items found for this order."
                    : "Loading order..."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
