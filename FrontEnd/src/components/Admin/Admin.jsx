import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMessage } from "../../hooks/useMessage";
import Alert from "../Alert";
import { fileToCompactDataUrl } from "../../utils/imageUtils";
import {
  API_PATHS,
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  unwrapArray,
  money,
  safeText,
  getProductImageUrl,
} from "../../api";

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
      apiGet(API_PATHS.products).then(unwrapArray),
      apiGet(API_PATHS.categories).then(unwrapArray),
      apiGet(API_PATHS.orders).then(unwrapArray),
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
        await apiPatch(
          `${API_PATHS.products}/${encodeURIComponent(editing.productId)}`,
          {
            id: Number(editing.productId),
            ...data,
            categoryId: String(data.categoryId),
          },
        );
      else await apiPost(API_PATHS.products, data);
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
      await apiDelete(
        `${API_PATHS.products}/${encodeURIComponent(p.productId)}`,
      );
      show("Product deleted.", "success");
      await load(true);
    } catch (e) {
      show(`Could not delete product: ${e.message}`, "danger");
    }
  }
  async function detail(o) {
    try {
      const d = await apiGet(
        `${API_PATHS.orders}/${encodeURIComponent(o.orderId)}`,
      );
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
    <main className="admin-page">
      <div className="admin-topline">
        <div className="container-fluid admin-container">
          <div>
            <span className="eyebrow">SHOP MANAGEMENT</span>
            <h1>Admin dashboard</h1>
            <p>Manage your catalog and keep an eye on store activity.</p>
          </div>
          <button
            className="btn btn-light admin-refresh"
            onClick={() => load()}
            disabled={busy}
          >
            <span className={busy ? "spin" : ""}>↻</span>{" "}
            {busy ? "Refreshing…" : "Refresh data"}
          </button>
        </div>
      </div>
      <div className="container-fluid admin-container admin-content">
        <Alert message={alert?.message} type={alert?.type} onClose={clear} />
        <div className="row g-3 admin-stat-row">
          <div className="col-6 col-xl-3">
            <div className="admin-stat">
              <span className="stat-icon blue">▦</span>
              <span className="stat-label">Total products</span>
              <strong>{products.length}</strong>
              <small>Items in catalog</small>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="admin-stat">
              <span className="stat-icon violet">◈</span>
              <span className="stat-label">Categories</span>
              <strong>{categories.length}</strong>
              <small>Product groups</small>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="admin-stat">
              <span className="stat-icon orange">↗</span>
              <span className="stat-label">Orders</span>
              <strong>{orders.length}</strong>
              <small>Orders in system</small>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="admin-stat">
              <span className="stat-icon green">✓</span>
              <span className="stat-label">Active products</span>
              <strong>
                {products.filter((p) => p.isActive !== false).length}
              </strong>
              <small>Visible in store</small>
            </div>
          </div>
        </div>
        <div className="admin-workspace">
          <aside className="admin-sidebar">
            <div className="sidebar-caption">WORKSPACE</div>
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`admin-side-link ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                <span>{t.icon}</span>
                {t.label}
                {t.id === "orders" && <small>{orders.length}</small>}
              </button>
            ))}
            <div className="sidebar-note">
              <span>●</span>
              <div>
                <strong>Store connected</strong>
                <small>Live API data</small>
              </div>
            </div>
          </aside>
          <section className="admin-main-panel">
            {tab === "products" && (
              <>
                <div className="panel-heading">
                  <div>
                    <h2>Product catalog</h2>
                    <p>Review, search, and update your products.</p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => openProduct()}
                  >
                    ＋ Add product
                  </button>
                </div>
                <div className="admin-toolbar">
                  <div className="search-wrap admin-search">
                    <span>⌕</span>
                    <input
                      className="form-control"
                      placeholder="Search products…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <span className="result-count">
                    {visibleProducts.length} products
                  </span>
                </div>
                <div className="table-responsive admin-table-wrap">
                  <table className="table align-middle admin-table mb-0">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleProducts.length ? (
                        visibleProducts.map((p) => (
                          <tr key={p.productId}>
                            <td>
                              <div className="admin-product-cell">
                                {getProductImageUrl(p.imageUrl) ? (
                                  <img
                                    src={getProductImageUrl(p.imageUrl)}
                                    alt=""
                                  />
                                ) : (
                                  <div className="admin-thumb-placeholder">
                                    S
                                  </div>
                                )}
                                <div>
                                  <strong>
                                    {safeText(p.name, "Untitled product")}
                                  </strong>
                                  <small>ID: {p.productId}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              {categories.find(
                                (c) =>
                                  String(c.categoryId) === String(p.categoryId),
                              )?.name ||
                                p.categoryId ||
                                "—"}
                            </td>
                            <td className="fw-semibold">{money(p.price)}</td>
                            <td>{p.quantity}</td>
                            <td>
                              <span
                                className={`status-chip ${
                                  p.isActive === false ? "inactive" : "active"
                                }`}
                              >
                                <span />{" "}
                                {p.isActive === false ? "Inactive" : "Active"}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  className="btn btn-sm btn-action-edit"
                                  onClick={() => openProduct(p)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-action-delete"
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
                          <td colSpan="6">
                            <div className="table-empty">
                              <strong>No products found</strong>
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
                <div className="panel-heading">
                  <div>
                    <h2>Categories</h2>
                    <p>Browse product categories available in the API.</p>
                  </div>
                </div>
                <div className="table-responsive admin-table-wrap">
                  <table className="table align-middle admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c) => (
                        <tr key={c.categoryId}>
                          <td>{c.categoryId}</td>
                          <td className="fw-semibold">{c.name}</td>
                          <td>{safeText(c.description)}</td>
                          <td>
                            <span
                              className={`status-chip ${
                                c.isActive === false ? "inactive" : "active"
                              }`}
                            >
                              <span />
                              {c.isActive === false ? "Inactive" : "Active"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!categories.length && (
                    <div className="table-empty">No categories found.</div>
                  )}
                </div>
                <p className="small text-secondary mt-3">
                  Category editing is not available in the current API.
                </p>
              </>
            )}
            {tab === "orders" && (
              <>
                <div className="panel-heading">
                  <div>
                    <h2>Orders</h2>
                    <p>Recent orders received by your store.</p>
                  </div>
                  <span className="result-count">{orders.length} total</span>
                </div>
                <div className="table-responsive admin-table-wrap">
                  <table className="table align-middle admin-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>User</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th className="text-end">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length ? (
                        orders.map((o) => (
                          <tr key={o.orderId}>
                            <td>
                              <strong>#{o.orderId}</strong>
                            </td>
                            <td>{safeText(o.userId)}</td>
                            <td>
                              <span className="order-status">
                                {safeText(o.orderStatus)}
                              </span>
                            </td>
                            <td className="fw-semibold">
                              {money(o.totalPrice)}
                            </td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-action-edit"
                                onClick={() => detail(o)}
                              >
                                View details ↗
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">
                            <div className="table-empty">No orders found.</div>
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
                <div className="panel-heading">
                  <div>
                    <h2>User management</h2>
                    <p>Identity administration</p>
                  </div>
                </div>
                <div className="notice-card">
                  <div className="notice-icon">♙</div>
                  <div>
                    <strong>User management endpoint not available</strong>
                    <p>
                      The current API does not expose an endpoint to list, edit,
                      or remove users. Add protected admin endpoints to enable
                      these actions.
                    </p>
                    <Link className="btn btn-outline-primary btn-sm" to="/">
                      Back to store
                    </Link>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
      {modal && (
        <div className="modal-backdrop-custom">
          <div
            className="modal d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <form className="modal-content product-modal" onSubmit={save}>
                <div className="modal-header">
                  <div>
                    <span className="eyebrow text-primary">CATALOG</span>
                    <h2 className="modal-title fs-5">
                      {editing ? "Edit product" : "Add a new product"}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setModal(false)}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <div className="row g-4">
                    <div className="col-md-7">
                      <div className="mb-3">
                        <label className="form-label">Product name</label>
                        <input
                          className="form-control"
                          required
                          maxLength="150"
                          placeholder="e.g. Everyday backpack"
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="Describe the product…"
                          value={form.description}
                          onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                          }
                        />
                      </div>
                      <div className="row">
                        <div className="col-6 mb-3">
                          <label className="form-label">Price</label>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={form.price}
                            onChange={(e) =>
                              setForm({ ...form, price: e.target.value })
                            }
                          />
                        </div>
                        <div className="col-6 mb-3">
                          <label className="form-label">Stock quantity</label>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            step="1"
                            required
                            value={form.quantity}
                            onChange={(e) =>
                              setForm({ ...form, quantity: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Category</label>
                        <select
                          className="form-select"
                          required
                          value={form.categoryId}
                          onChange={(e) =>
                            setForm({ ...form, categoryId: e.target.value })
                          }
                        >
                          <option value="">Choose a category</option>
                          {categories.map((c) => (
                            <option key={c.categoryId} value={c.categoryId}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="active"
                          checked={form.isActive}
                          onChange={(e) =>
                            setForm({ ...form, isActive: e.target.checked })
                          }
                        />
                        <label className="form-check-label" htmlFor="active">
                          Product is active
                        </label>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <label className="form-label">Product image</label>
                      <label className="image-upload-box">
                        <input
                          type="file"
                          accept="image/*"
                          className="visually-hidden"
                          onChange={(e) => chooseImage(e.target.files?.[0])}
                        />
                        {form.imageUrl ? (
                          <img
                            src={getProductImageUrl(form.imageUrl)}
                            alt="Product preview"
                            className="image-upload-preview"
                          />
                        ) : (
                          <div className="image-upload-empty">
                            <span>＋</span>
                            <strong>Choose an image</strong>
                            <small>JPG, PNG or WebP · up to 8 MB</small>
                          </div>
                        )}
                        <span className="image-upload-action">
                          {form.imageUrl ? "Change image" : "Browse files"}
                        </span>
                      </label>
                      {form.imageUrl && (
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-danger px-0"
                          onClick={() => setForm({ ...form, imageUrl: "" })}
                        >
                          Remove image
                        </button>
                      )}
                      <p className="small text-secondary mt-2">
                        Image is resized before sending to the API.
                      </p>
                    </div>
                  </div>
                  <div className="small text-danger mt-3">{error}</div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={busy}
                  >
                    {busy ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Saving…
                      </>
                    ) : (
                      "Save product"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
