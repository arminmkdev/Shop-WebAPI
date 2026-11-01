import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllOrders } from "../services/orderService";
import { money, safeText } from "../utils/format";
import { useMessage } from "../hooks/useMessage";
import Alert from "./Alert";

export default function Orders() {
  const [orders, setOrders] = useState([]),
    [alert, show, clear] = useMessage();

  async function load() {
    try {
      setOrders(await getAllOrders());
    } catch (e) {
      show(`Could not load orders: ${e.message}`, "danger");
    }
  }

  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener("shop-refresh-data", refresh);
    return () => window.removeEventListener("shop-refresh-data", refresh);
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 md:py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold mb-1 font-display">
            My Orders
          </h1>
          <p className="text-muted m-0">View your orders and order details.</p>
        </div>
        <button
          className="px-4 py-2 border border-brand-700 text-brand-700 rounded-lg hover:bg-brand-100"
          onClick={load}
        >
          Refresh Orders
        </button>
      </div>

      <Alert message={alert?.message} type={alert?.type} onClose={clear} />

      <section className="bg-surface border border-app rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-app flex justify-between items-center">
          <h2 className="text-base font-bold m-0">Order History</h2>
          <span className="text-xs bg-cream-200 text-brand-700 px-2 py-1 rounded-full">
            {orders.length} orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-200 dark:bg-brand-900/30 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3 pl-4">Order ID</th>
                <th className="p-3">Status</th>
                <th className="p-3">Total</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((o) => (
                  <tr
                    key={o.orderId}
                    className="border-t border-app hover:bg-cream-100 dark:hover:bg-white/5"
                  >
                    <td className="p-3 pl-4">{o.orderId}</td>
                    <td className="p-3">{safeText(o.orderStatus)}</td>
                    <td className="p-3">{money(o.totalPrice)}</td>
                    <td className="p-3 pr-4 text-right">
                      <Link
                        className="px-3 py-1 text-sm border border-brand-700 text-brand-700 rounded-lg hover:bg-brand-100"
                        to={`/order-details?id=${encodeURIComponent(o.orderId)}`}
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-10">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-4">
        <Link
          to="/"
          className="text-brand-700 hover:text-brand-900 no-underline"
        >
          ← Continue Shopping
        </Link>
      </div>
    </main>
  );
}
