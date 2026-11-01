import { useState, useEffect } from "react";
import { useMessage } from "../hooks/useMessage";
import { getAllProducts } from "../services/productService";
import { getAllCategories } from "../services/categoryService";
import { addCartItem } from "../services/cartItemService";
import { getCurrentUserId } from "../services/authService";
import { money, safeText, getProductImageUrl } from "../utils/format";
import Alert from "./Alert";

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
        getAllProducts(),
        getAllCategories().catch(() => []),
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
      await addCartItem(p.productId, 1);
      show("Product added to cart.", "success");
      window.dispatchEvent(new Event("shop-auth-changed"));
    } catch (e) {
      show(e.message, "danger");
    }
  }

  return (
    <main>
      {/* ============ HERO ============ */}
      <section className="bg-brand-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 min-h-[350px] flex items-center justify-between gap-8 py-14 md:py-16 relative">
          <div className="max-w-[560px] relative z-10">
            <span className="block text-[0.69rem] tracking-[0.17em] font-extrabold text-sky-400 mb-3">
              A BETTER WAY TO SHOP
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.08] mb-5 font-display">
              Find something
              <br />
              <span className="text-sky-400">you'll love.</span>
            </h1>
            <p className="text-brand-200 max-w-[430px] leading-relaxed mb-7">
              Explore the collection, discover your next favorite, and shop with
              confidence.
            </p>
            <a
              href="#catalog"
              className="inline-flex items-center gap-3 bg-cream-100 text-brand-900 font-bold rounded-xl px-5 py-3.5 hover:bg-white transition"
            >
              Explore products <span aria-hidden="true">→</span>
            </a>
          </div>

          <div
            className="hidden md:block w-[390px] h-[260px] relative shrink-0"
            aria-hidden="true"
          >
            <div className="absolute border border-white/20 rounded-full w-[370px] h-[190px] top-7 left-2 -rotate-[25deg]" />
            <div className="absolute border border-white/20 rounded-full w-[280px] h-[230px] top-2 left-11 rotate-[42deg]" />
            <div className="absolute grid place-items-center left-[126px] top-[45px] w-[132px] h-[150px] rounded-[28px_28px_36px_36px] bg-gradient-to-br from-brand-300 to-brand-500 text-brand-900 text-6xl font-extrabold shadow-2xl -rotate-[7deg]">
              S<span className="absolute right-3.5 top-2.5 text-2xl">+</span>
            </div>
            <div className="absolute px-3.5 py-2.5 border border-white/20 rounded-xl bg-white/10 backdrop-blur text-xs font-bold top-[45px] right-0">
              Quality picks
            </div>
            <div className="absolute px-3.5 py-2.5 border border-white/20 rounded-xl bg-white/10 backdrop-blur text-xs font-bold bottom-7 left-0">
              Simple shopping
            </div>
          </div>
        </div>
      </section>

      {/* ============ CATALOG ============ */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div>
            <span className="block text-[0.69rem] tracking-[0.17em] font-extrabold text-brand-700 mb-2">
              THE COLLECTION
            </span>
            <h2 className="text-3xl font-extrabold mb-1.5 font-display">
              Shop products
            </h2>
            <p className="text-muted mb-0">
              A considered selection, ready to explore.
            </p>
          </div>
          <button
            className="px-4 py-2 border border-app text-muted rounded-lg hover:bg-cream-200 transition whitespace-nowrap"
            onClick={() => load()}
            disabled={loading}
          >
            <span className={loading ? "inline-block animate-spin" : ""}>
              ↻
            </span>{" "}
            {loading ? "Updating…" : "Refresh"}
          </button>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 mb-7">
          <div className="flex items-center gap-2.5 bg-surface border border-app rounded-xl px-3.5 flex-1 min-w-0">
            <span className="text-xl text-muted">⌕</span>
            <input
              className="w-full bg-transparent border-0 py-3 outline-none text-app placeholder:text-muted"
              aria-label="Search products"
              placeholder="Search by name or description…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          <select
            className="w-full sm:w-auto max-w-[220px] h-[47px] border border-app rounded-xl px-3 bg-surface text-app"
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
          <span className="text-muted text-sm whitespace-nowrap">
            {filtered.length} items
          </span>
        </div>

        <Alert message={alert?.message} type={alert?.type} onClose={clear} />

        {loading && !products.length ? (
          <div className="flex min-h-[260px] items-center justify-center gap-3.5 text-muted">
            <div
              className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"
              role="status"
            />
            <span>Loading collection…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <article
                key={p.productId}
                className="bg-surface border border-app rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-lg transition"
              >
                {getProductImageUrl(p.imageUrl) ? (
                  <img
                    className="h-[220px] w-full object-contain p-4 bg-white dark:bg-brand-900/20"
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
                  className="h-[220px] w-full bg-gradient-to-br from-brand-100 to-cream-100 text-brand-300 text-3xl font-extrabold tracking-widest items-center justify-center"
                  style={{
                    display: getProductImageUrl(p.imageUrl) ? "none" : "flex",
                  }}
                >
                  <span>SHOP</span>
                </div>

                <div className="p-5 flex flex-col">
                  <div className="flex justify-between items-center gap-2 mb-2.5">
                    <span className="text-[0.7rem] text-muted bg-cream-200 dark:bg-brand-900/40 px-2 py-1 rounded-md">
                      {categories.find(
                        (c) => String(c.categoryId) === String(p.categoryId),
                      )?.name || "Collection"}
                    </span>
                    {p.isActive === false && (
                      <span className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded-md">
                        Unavailable
                      </span>
                    )}
                  </div>

                  <h2 className="font-bold text-base leading-snug mb-1">
                    {safeText(p.name, "Untitled product")}
                  </h2>
                  <p className="text-sm text-muted leading-relaxed min-h-[44px] flex-grow">
                    {safeText(p.description, "No description available.")}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-3">
                    <strong className="text-lg font-bold text-brand-700">
                      {money(p.price)}
                    </strong>
                    <button
                      className="bg-brand-700 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-brand-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
            ))}
          </div>
        )}

        {!loading && !filtered.length && (
          <div className="flex flex-col items-center justify-center text-center p-16 bg-surface border border-dashed border-app rounded-2xl">
            <div className="text-3xl text-brand-300 mb-3">⌕</div>
            <h3 className="text-xl font-bold mb-2">No matching products</h3>
            <p className="text-muted mb-4">
              Try a different search or category.
            </p>
            <button
              className="px-4 py-2 border border-brand-700 text-brand-700 rounded-lg hover:bg-brand-100 transition"
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

      {/* ============ FOOTER ============ */}
      <footer className="bg-brand-900 text-brand-200 py-6 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex justify-between flex-wrap gap-2">
          <span>
            Shop<span className="text-sky-400">.</span>
          </span>
          <span>Thoughtful finds. Simple checkout.</span>
        </div>
      </footer>
    </main>
  );
}
