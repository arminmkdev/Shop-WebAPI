import { useState, useEffect } from "react";
import { useMessage } from "../hooks/useMessage";
import Alert from "./Alert";
import {
  API_PATHS,
  apiGet,
  apiPost,
  unwrapArray,
  money,
  safeText,
  getProductImageUrl,
  getCurrentUserId,
} from "../api";

export default function Store() {
  const [products, setProducts] = useState([]),
    [categories, setCategories] = useState([]),
    [term, setTerm] = useState(""),
    [category, setCategory] = useState(""),
    [alert, show, clear] = useMessage(),
    [loading, setLoading] = useState(true);
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [p, c] = await Promise.all([
        apiGet(API_PATHS.products).then(unwrapArray),
        apiGet(API_PATHS.categories)
          .then(unwrapArray)
          .catch(() => []),
      ]);
      setProducts(p);
      setCategories(c);
      clear();
    } catch (e) {
      show(
        `Could not load products: ${e.message}. Check API URL, server status, and CORS settings.`,
        "danger",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    const refresh = () => load(true);
    window.addEventListener("shop-refresh-data", refresh);
    return () => window.removeEventListener("shop-refresh-data", refresh);
  }, []);
  const filtered = products.filter(
    (p) =>
      (safeText(p.name, "").toLowerCase().includes(term.toLowerCase()) ||
        safeText(p.description, "")
          .toLowerCase()
          .includes(term.toLowerCase())) &&
      (!category || String(p.categoryId) === category),
  );
  async function add(p) {
    if (!localStorage.getItem("shop.accessToken")) {
      show("Please log in before adding items to your cart.", "warning");
      return;
    }
    const userId = await getCurrentUserId();
    if (!userId) {
      show(
        "A user ID could not be retrieved. Check the identity endpoint.",
        "warning",
      );
      return;
    }
    try {
      await apiPost(API_PATHS.cartItems, {
        productId: Number(p.productId),
        quantity: 1,
      });
      show("Product added to cart.", "success");
      window.dispatchEvent(new Event("shop-auth-changed"));
    } catch (e) {
      show(e.message, "danger");
    }
  }
  return (
    <main className="store-shell">
      <section className="store-hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">A BETTER WAY TO SHOP</span>
            <h1>
              Find something
              <br />
              <span>you’ll love.</span>
            </h1>
            <p>
              Explore the collection, discover your next favorite, and shop with
              confidence.
            </p>
            <a href="#catalog" className="btn btn-light btn-lg hero-cta">
              Explore products <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-bag">
              S<span>+</span>
            </div>
            <div className="hero-chip chip-one">Quality picks</div>
            <div className="hero-chip chip-two">Simple shopping</div>
          </div>
        </div>
      </section>
      <section id="catalog" className="container catalog-section">
        <div className="catalog-heading">
          <div>
            <span className="eyebrow text-primary">THE COLLECTION</span>
            <h2>Shop products</h2>
            <p className="text-secondary mb-0">
              A considered selection, ready to explore.
            </p>
          </div>
          <button
            className="btn btn-outline-secondary refresh-button"
            onClick={() => load()}
            disabled={loading}
          >
            <span className={loading ? "spin" : ""}>↻</span>{" "}
            {loading ? "Updating…" : "Refresh"}
          </button>
        </div>
        <div className="catalog-tools">
          <div className="search-wrap">
            <span>⌕</span>
            <input
              className="form-control"
              aria-label="Search products"
              placeholder="Search by name or description…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          <select
            className="form-select category-select"
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.name || `Category ${c.categoryId}`}
              </option>
            ))}
          </select>
          <span className="result-count">{filtered.length} items</span>
        </div>
        <Alert message={alert?.message} type={alert?.type} onClose={clear} />
        {loading && !products.length ? (
          <div className="catalog-loading">
            <div className="spinner-border text-primary" role="status" />
            <span>Loading collection…</span>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
            {filtered.map((p) => (
              <div className="col" key={p.productId}>
                <article className="card h-100 product-card polished-product">
                  {getProductImageUrl(p.imageUrl) ? (
                    <img
                      className="product-image card-img-top"
                      src={getProductImageUrl(p.imageUrl)}
                      alt={safeText(p.name, "Product")}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="product-image product-placeholder align-items-center justify-content-center"
                    style={{
                      display: getProductImageUrl(p.imageUrl) ? "none" : "flex",
                    }}
                  >
                    <span>SHOP</span>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <div className="product-meta">
                      <span className="product-category">
                        {categories.find(
                          (c) => String(c.categoryId) === String(p.categoryId),
                        )?.name || "Collection"}
                      </span>
                      {p.isActive === false && (
                        <span className="badge text-bg-secondary">
                          Unavailable
                        </span>
                      )}
                    </div>
                    <h2 className="h6 card-title">
                      {safeText(p.name, "Untitled product")}
                    </h2>
                    <p className="small text-secondary flex-grow-1 product-description">
                      {safeText(p.description, "No description available.")}
                    </p>
                    <div className="d-flex align-items-center justify-content-between gap-2 mt-3">
                      <strong className="product-price">
                        {money(p.price)}
                      </strong>
                      <button
                        className="btn btn-sm btn-primary product-add"
                        disabled={
                          (p.quantity !== null &&
                            p.quantity !== undefined &&
                            p.quantity !== "" &&
                            Number(p.quantity) <= 0) ||
                          p.isActive === false
                        }
                        onClick={() => add(p)}
                      >
                        {p.quantity !== null &&
                        p.quantity !== undefined &&
                        p.quantity !== "" &&
                        Number(p.quantity) <= 0
                          ? "Out of stock"
                          : p.isActive === false
                            ? "Unavailable"
                            : "Add to cart +"}
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
        {!loading && !filtered.length && (
          <div className="empty-state">
            <div className="empty-icon">⌕</div>
            <h3>No matching products</h3>
            <p>Try a different search or category.</p>
            <button
              className="btn btn-outline-primary"
              onClick={() => {
                setTerm("");
                setCategory("");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
      <footer className="shop-footer">
        <div className="container d-flex justify-content-between flex-wrap gap-2">
          <span>
            Shop<span className="brand-dot">.</span>
          </span>
          <span>Thoughtful finds. Simple checkout.</span>
        </div>
      </footer>
    </main>
  );
}
