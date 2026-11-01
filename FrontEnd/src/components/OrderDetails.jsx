import { getOrderById } from "../services/orderService";
import { money, safeText } from "../utils/format";
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMessage } from "../hooks/useMessage";
import Alert from "./Alert";

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
        const data = await getOrderById(id);
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
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold font-display">Order Details</h1>
        <Link
          to="/orders"
          className="px-4 py-2 border border-app text-muted rounded-lg hover:bg-cream-200"
        >
          Back to Orders
        </Link>
      </div>
      <Alert message={alert?.message} type={alert?.type} onClose={clear} />
      <section className="bg-surface border border-app rounded-2xl shadow-sm mb-6">
        <div className="p-5">
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
      <h2 className="text-xl font-bold mb-4">Order Items</h2>
      <div className="overflow-x-auto bg-surface border border-app rounded-2xl shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-cream-200 dark:bg-brand-900/30 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="p-3 pl-4">Product ID</th>
              <th className="p-3">Price</th>
              <th className="p-3">Quantity</th>
              <th className="p-3 pr-4">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((i, n) => (
                <tr
                  key={i.orderDetailId || n}
                  className="border-t border-app hover:bg-cream-100 dark:hover:bg-white/5"
                >
                  <td className="p-3 pl-4">{safeText(i.productId)}</td>
                  <td className="p-3">{money(i.price)}</td>
                  <td className="p-3">{safeText(i.quantity)}</td>
                  <td className="p-3 pr-4">{money(i.totalPrice)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center text-muted py-6">
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
