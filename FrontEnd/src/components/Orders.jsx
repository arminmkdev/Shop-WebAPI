import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMessage } from "../hooks/useMessage";
import Alert from "./Alert";
import { API_PATHS, apiGet, unwrapArray, money, safeText } from "../api";

export default function Orders() {
  const [orders, setOrders] = useState([]),
    [alert, show, clear] = useMessage();
  async function load() {
    try {
      setOrders(unwrapArray(await apiGet(API_PATHS.orders)));
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
    <main className="container py-4 py-md-5">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">My Orders</h1>
          <p className="text-secondary mb-0">
            View your orders and order details.
          </p>
        </div>
        <button className="btn btn-outline-primary" onClick={load}>
          Refresh Orders
        </button>
      </div>
      <Alert message={alert?.message} type={alert?.type} onClose={clear} />
      <section className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h2 className="h6 mb-0">Order History</h2>
          <span className="badge text-bg-light">{orders.length} orders</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-3">Order ID</th>
                <th>Status</th>
                <th>Total</th>
                <th className="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((o) => (
                  <tr key={o.orderId}>
                    <td className="ps-3">{o.orderId}</td>
                    <td>{safeText(o.orderStatus)}</td>
                    <td>{money(o.totalPrice)}</td>
                    <td className="text-end pe-3">
                      <Link
                        className="btn btn-sm btn-outline-primary"
                        to={`/order-details?id=${encodeURIComponent(
                          o.orderId,
                        )}`}
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-secondary py-5">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-3">
        <Link to="/" className="text-decoration-none">
          ← Continue Shopping
        </Link>
      </div>
    </main>
  );
}
