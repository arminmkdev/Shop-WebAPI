import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../services/productService";
import { getAllCategories } from "../../services/categoryService";
import { getAllOrders, getOrderById } from "../../services/orderService";
import { money, safeText, getProductImageUrl } from "../../utils/format";
import { useMessage } from "../../hooks/useMessage";
import { fileToCompactDataUrl } from "../../utils/imageUtils";
import Alert from "../Alert";

const ICON_BG = {
  blue: "bg-brand-100 text-brand-700",
  violet: "bg-purple-100 text-purple-700",
  orange: "bg-amber-100 text-amber-700",
  green: "bg-emerald-100 text-emerald-700",
};

export default function Admin() {
  const [tab, setTab] = useState("products"),
    [products, setProducts] = useState([]),
    [categories, setCategories] = useState([]),
    [orders, setOrders] = useState([]),
    [alert, show, clear] = useMessage(),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [form, setForm] = useState({
      name: "",
      description: "",
      price: "",
      quantity: 0,
      categoryId: "",
      isActive: true,
      imageUrl: "",
    });
  async function load(silent = false) {
    if (!silent) clear();
    setBusy(true);
    const r = await Promise.allSettled([
      getAllProducts(),
      getAllCategories(),
      getAllOrders(),
    ]);
    setProducts(r[0].status === "fulfilled" ? r[0].value : []);
    setCategories(r[1].status === "fulfilled" ? r[1].value : []);
    setOrders(r[2].status === "fulfilled" ? r[2].value : []);
    const errs = r
      .filter((x) => x.status === "rejected")
      .map((x) => x.reason?.message || "API error");
    if (errs.length)
      show(`Some data could not be loaded: ${errs.join("; ")}`, "warning");
    setBusy(false);
  }
  useEffect(() => {
    load();
    const refresh = () => load(true);
    window.addEventListener("shop-refresh-data", refresh);
    return () => window.removeEventListener("shop-refresh-data", refresh);
  }, []);
  function openProduct(p = null) {
    setEditing(p);
    setForm({
      name: p?.name || "",
      description: p?.description || "",
      price: p?.price ?? "",
      quantity: p?.quantity ?? 0,
      categoryId: p?.categoryId ?? "",
      isActive: p?.isActive ?? true,
      imageUrl: p?.imageUrl || "",
    });
    setError("");
    setModal(true);
  }
  async function chooseImage(file) {
    if (!file) return;
    try {
      const imageUrl = await fileToCompactDataUrl(file);
      setForm((current) => ({ ...current, imageUrl }));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  async function save(e) {
    e.preventDefault();
    setError("");
    const data = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      quantity: Number(form.quantity),
      isActive: form.isActive,
      categoryId: Number(form.categoryId),
      imageUrl: form.imageUrl || null,
    };
    try {
      setBusy(true);
      if (editing)
        await updateProduct(editing.productId, {
          id: Number(editing.productId),
          ...data,
          categoryId: String(data.categoryId),
        });
      else await createProduct(data);
      setModal(false);
      show(editing ? "Product updated." : "Product created.", "success");
      await load(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function del(p) {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await deleteProduct(p.productId);
      show("Product deleted.", "success");
      await load(true);
    } catch (e) {
      show(`Could not delete product: ${e.message}`, "danger");
    }
  }
  async function detail(o) {
    try {
      const d = await getOrderById(o.orderId);
      window.alert(JSON.stringify(d, null, 2));
    } catch (e) {
      show(e.message, "danger");
    }
  }
  const visibleProducts = products.filter((p) =>
    `${p.name || ""} ${p.description || ""} ${p.productId || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const tabs = [
    { id: "products", label: "Products", icon: "▦" },
    { id: "categories", label: "Categories", icon: "◈" },
    { id: "orders", label: "Orders", icon: "↗" },
    { id: "users", label: "Users", icon: "♙" },
  ];
  return (
    <main className="min-h-[calc(100vh-72px)] bg-app pb-16">
      {/* topline */}
      <div className="bg-brand-900 text-white py-8">
        <div className="max-w-[1500px] mx-auto px-4 md:px-10 flex justify-between items-center gap-5">
          <div>
            <span className="block text-[0.69rem] tracking-[0.17em] font-extrabold text-sky-400 mb-1.5">
              SHOP MANAGEMENT
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold mb-1.5 font-display">
              Admin dashboard
            </h1>
            <p className="text-brand-200 m-0">
              Manage your catalog and keep an eye on store activity.
            </p>
          </div>
          <button
            className="rounded-lg font-bold whitespace-nowrap bg-cream-100 text-brand-900 px-4 py-2 hover:bg-white disabled:opacity-60"
            onClick={() => load()}
            disabled={busy}
          >
            <span
              className={busy ? "inline-block animate-spin mr-1.5" : "mr-1.5"}
            >
              ↻
            </span>
            {busy ? "Refreshing…" : "Refresh data"}
          </button>
        </div>
      </div>

      {/* content */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-10 pt-6">
        <Alert message={alert?.message} type={alert?.type} onClose={clear} />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[
            {
              icon: "▦",
              color: "blue",
              label: "Total products",
              value: products.length,
              note: "Items in catalog",
            },
            {
              icon: "◈",
              color: "violet",
              label: "Categories",
              value: categories.length,
              note: "Product groups",
            },
            {
              icon: "↗",
              color: "orange",
              label: "Orders",
              value: orders.length,
              note: "Orders in system",
            },
            {
              icon: "✓",
              color: "green",
              label: "Active products",
              value: products.filter((p) => p.isActive !== false).length,
              note: "Visible in store",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="relative min-h-[145px] bg-surface border border-app rounded-2xl p-5 flex flex-col shadow-sm"
            >
              <span
                className={`grid place-items-center w-9 h-9 rounded-lg mb-3 text-lg ${ICON_BG[s.color]}`}
              >
                {s.icon}
              </span>
              <span className="text-xs text-muted">{s.label}</span>
              <strong className="text-2xl font-extrabold leading-tight mt-0.5">
                {s.value}
              </strong>
              <small className="text-xs text-muted">{s.note}</small>
            </div>
          ))}
        </div>

        {/* workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-5 items-start">
          {/* sidebar */}
          <aside className="bg-surface border border-app rounded-2xl p-4 lg:min-h-[420px] flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            <div className="hidden lg:block text-[0.65rem] tracking-[0.15em] font-extrabold text-muted px-2.5 pt-2 pb-3">
              WORKSPACE
            </div>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold whitespace-nowrap transition ${
                  tab === t.id
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-700/30 dark:text-brand-200"
                    : "text-muted hover:bg-cream-100 dark:hover:bg-white/5"
                }`}
              >
                <span className="w-5 text-center text-lg">{t.icon}</span>
                {t.label}
                {t.id === "orders" && (
                  <small className="ml-auto bg-cream-200 dark:bg-white/10 rounded-md px-1.5 py-0.5 text-xs">
                    {orders.length}
                  </small>
                )}
              </button>
            ))}
            <div className="hidden lg:flex border-t border-app mt-6 pt-4 px-2 items-center gap-2.5">
              <span className="text-emerald-500 text-xs">●</span>
              <div>
                <strong className="block text-xs">Store connected</strong>
                <small className="block text-[0.68rem] text-muted mt-0.5">
                  Live API data
                </small>
              </div>
            </div>
          </aside>

          {/* main panel */}
          <section className="bg-surface border border-app rounded-2xl p-5 md:p-7 min-w-0 shadow-sm">
            {tab === "products" && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold mb-1">
                      Product catalog
                    </h2>
                    <p className="text-sm text-muted m-0">
                      Review, search, and update your products.
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 bg-brand-700 text-white rounded-lg font-bold hover:bg-brand-900 whitespace-nowrap"
                    onClick={() => openProduct()}
                  >
                    ＋ Add product
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <div className="flex items-center gap-2.5 bg-surface border border-app rounded-xl px-3.5 flex-1 max-w-[400px]">
                    <span className="text-xl text-muted">⌕</span>
                    <input
                      className="w-full bg-transparent border-0 py-2.5 outline-none text-app placeholder:text-muted"
                      placeholder="Search products…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <span className="text-muted text-sm whitespace-nowrap">
                    {visibleProducts.length} products
                  </span>
                </div>

                <div className="border border-app rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-200 dark:bg-brand-900/30 text-left text-[0.68rem] uppercase tracking-wider text-muted">
                      <tr>
                        <th className="px-4 py-3.5 border-b border-app whitespace-nowrap">
                          Product
                        </th>
                        <th className="px-4 py-3.5 border-b border-app whitespace-nowrap">
                          Category
                        </th>
                        <th className="px-4 py-3.5 border-b border-app whitespace-nowrap">
                          Price
                        </th>
                        <th className="px-4 py-3.5 border-b border-app whitespace-nowrap">
                          Stock
                        </th>
                        <th className="px-4 py-3.5 border-b border-app whitespace-nowrap">
                          Status
                        </th>
                        <th className="px-4 py-3.5 border-b border-app whitespace-nowrap text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleProducts.length ? (
                        visibleProducts.map((p) => (
                          <tr
                            key={p.productId}
                            className="border-b border-app last:border-0"
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3 min-w-[190px]">
                                {getProductImageUrl(p.imageUrl) ? (
                                  <img
                                    src={getProductImageUrl(p.imageUrl)}
                                    alt=""
                                    className="w-11 h-11 rounded-lg object-cover bg-brand-100"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-lg grid place-items-center bg-brand-100 text-brand-500 font-extrabold">
                                    S
                                  </div>
                                )}
                                <div>
                                  <strong className="block text-sm max-w-[180px] truncate">
                                    {safeText(p.name, "Untitled product")}
                                  </strong>
                                  <small className="block text-[0.68rem] text-muted mt-1">
                                    ID: {p.productId}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              {categories.find(
                                (c) =>
                                  String(c.categoryId) === String(p.categoryId),
                              )?.name ||
                                p.categoryId ||
                                "—"}
                            </td>
                            <td className="px-4 py-3.5 font-semibold">
                              {money(p.price)}
                            </td>
                            <td className="px-4 py-3.5">{p.quantity}</td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold ${
                                  p.isActive === false
                                    ? "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {p.isActive === false ? "Inactive" : "Active"}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex justify-end gap-2">
                                <button
                                  className="border border-brand-300 text-brand-700 bg-surface px-3 py-1 text-sm rounded-lg hover:bg-brand-100"
                                  onClick={() => openProduct(p)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="border border-blush-400 text-blush-500 bg-surface px-3 py-1 text-sm rounded-lg hover:bg-blush-100"
                                  onClick={() => del(p)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-4 py-12">
                            <div className="flex flex-col items-center gap-1 text-muted">
                              <strong className="text-app">
                                No products found
                              </strong>
                              <span>Try another search or add a product.</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tab === "categories" && (
              <>
                <div className="flex justify-between items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold mb-1">Categories</h2>
                    <p className="text-sm text-muted m-0">
                      Browse product categories available in the API.
                    </p>
                  </div>
                </div>
                <div className="border border-app rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-200 dark:bg-brand-900/30 text-left text-[0.68rem] uppercase tracking-wider text-muted">
                      <tr>
                        <th className="px-4 py-3.5 border-b border-app">ID</th>
                        <th className="px-4 py-3.5 border-b border-app">
                          Name
                        </th>
                        <th className="px-4 py-3.5 border-b border-app">
                          Description
                        </th>
                        <th className="px-4 py-3.5 border-b border-app">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c) => (
                        <tr
                          key={c.categoryId}
                          className="border-b border-app last:border-0"
                        >
                          <td className="px-4 py-3.5">{c.categoryId}</td>
                          <td className="px-4 py-3.5 font-semibold">
                            {c.name}
                          </td>
                          <td className="px-4 py-3.5">
                            {safeText(c.description)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold ${
                                c.isActive === false
                                  ? "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {c.isActive === false ? "Inactive" : "Active"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!categories.length && (
                    <div className="px-4 py-12 text-center text-muted">
                      No categories found.
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted mt-4">
                  Category editing is not available in the current API.
                </p>
              </>
            )}

            {tab === "orders" && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold mb-1">Orders</h2>
                    <p className="text-sm text-muted m-0">
                      Recent orders received by your store.
                    </p>
                  </div>
                  <span className="text-muted text-sm whitespace-nowrap">
                    {orders.length} total
                  </span>
                </div>
                <div className="border border-app rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-200 dark:bg-brand-900/30 text-left text-[0.68rem] uppercase tracking-wider text-muted">
                      <tr>
                        <th className="px-4 py-3.5 border-b border-app">
                          Order
                        </th>
                        <th className="px-4 py-3.5 border-b border-app">
                          User
                        </th>
                        <th className="px-4 py-3.5 border-b border-app">
                          Status
                        </th>
                        <th className="px-4 py-3.5 border-b border-app">
                          Total
                        </th>
                        <th className="px-4 py-3.5 border-b border-app text-right">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length ? (
                        orders.map((o) => (
                          <tr
                            key={o.orderId}
                            className="border-b border-app last:border-0"
                          >
                            <td className="px-4 py-3.5">
                              <strong>#{o.orderId}</strong>
                            </td>
                            <td className="px-4 py-3.5">
                              {safeText(o.userId)}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="bg-brand-100 text-brand-700 px-2 py-1 rounded-md text-xs">
                                {safeText(o.orderStatus)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-semibold">
                              {money(o.totalPrice)}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                className="border border-brand-300 text-brand-700 bg-surface px-3 py-1 text-sm rounded-lg hover:bg-brand-100"
                                onClick={() => detail(o)}
                              >
                                View details ↗
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-4 py-12 text-center text-muted"
                          >
                            No orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tab === "users" && (
              <>
                <div className="flex justify-between items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold mb-1">
                      User management
                    </h2>
                    <p className="text-sm text-muted m-0">
                      Identity administration
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 bg-cream-100 dark:bg-brand-900/30 border border-app rounded-xl p-5">
                  <div className="grid place-items-center shrink-0 w-11 h-11 rounded-xl bg-brand-100 text-brand-700 text-xl">
                    ♙
                  </div>
                  <div>
                    <strong className="block mb-1.5">
                      User management endpoint not available
                    </strong>
                    <p className="text-sm text-muted">
                      The current API does not expose an endpoint to list, edit,
                      or remove users. Add protected admin endpoints to enable
                      these actions.
                    </p>
                    <Link
                      className="px-4 py-2 border border-brand-700 text-brand-700 rounded-lg hover:bg-brand-100 text-sm inline-block mt-2"
                      to="/"
                    >
                      Back to store
                    </Link>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* ============ PRODUCT MODAL ============ */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto p-5">
          <form
            onSubmit={save}
            className="bg-surface rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full mx-auto my-10"
          >
            <div className="flex justify-between items-start px-6 py-5 border-b border-app">
              <div>
                <span className="block text-[0.62rem] tracking-[0.17em] font-extrabold text-brand-700 mb-1">
                  CATALOG
                </span>
                <h2 className="text-lg font-extrabold m-0">
                  {editing ? "Edit product" : "Add a new product"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModal(false)}
                aria-label="Close"
                className="w-8 h-8 text-muted hover:text-app text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-7">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1.5">
                      Product name
                    </label>
                    <input
                      required
                      maxLength="150"
                      placeholder="e.g. Everyday backpack"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full border border-app rounded-lg px-3 py-2 bg-surface text-app focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Describe the product…"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      className="w-full border border-app rounded-lg px-3 py-2 bg-surface text-app focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={form.price}
                        onChange={(e) =>
                          setForm({ ...form, price: e.target.value })
                        }
                        className="w-full border border-app rounded-lg px-3 py-2 bg-surface text-app focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Stock quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={form.quantity}
                        onChange={(e) =>
                          setForm({ ...form, quantity: e.target.value })
                        }
                        className="w-full border border-app rounded-lg px-3 py-2 bg-surface text-app focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1.5">
                      Category
                    </label>
                    <select
                      required
                      value={form.categoryId}
                      onChange={(e) =>
                        setForm({ ...form, categoryId: e.target.value })
                      }
                      className="w-full border border-app rounded-lg px-3 py-2 bg-surface text-app focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Choose a category</option>
                      {categories.map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
                      className="w-4 h-4 accent-brand-700"
                    />
                    <label htmlFor="active" className="text-sm">
                      Product is active
                    </label>
                  </div>
                </div>

                <div className="md:col-span-5">
                  <label className="block text-sm font-medium mb-1.5">
                    Product image
                  </label>
                  <label className="w-full min-h-[235px] border border-dashed border-brand-300 rounded-xl bg-cream-100 dark:bg-brand-900/20 flex flex-col items-center justify-center p-3.5 cursor-pointer overflow-hidden hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/40">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => chooseImage(e.target.files?.[0])}
                    />
                    {form.imageUrl ? (
                      <img
                        src={getProductImageUrl(form.imageUrl)}
                        alt="Product preview"
                        className="w-full h-[185px] object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-center gap-2 text-muted">
                        <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-100 text-brand-700 text-2xl">
                          ＋
                        </span>
                        <strong className="text-sm text-app">
                          Choose an image
                        </strong>
                        <small className="text-xs">
                          JPG, PNG or WebP · up to 8 MB
                        </small>
                      </div>
                    )}
                    <span className="text-sm font-bold text-brand-700 mt-3">
                      {form.imageUrl ? "Change image" : "Browse files"}
                    </span>
                  </label>
                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, imageUrl: "" })}
                      className="text-blush-500 hover:underline text-sm mt-2"
                    >
                      Remove image
                    </button>
                  )}
                  <p className="text-sm text-muted mt-2">
                    Image is resized before sending to the API.
                  </p>
                </div>
              </div>
              <div className="text-sm text-blush-500 mt-3">{error}</div>
            </div>

            <div className="px-6 py-4 border-t border-app flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="px-4 py-2 bg-cream-200 text-brand-900 rounded-lg hover:bg-cream-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 bg-brand-700 text-white rounded-lg font-bold hover:bg-brand-900 disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  "Save product"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
