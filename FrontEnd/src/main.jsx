import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  useSearchParams,
  useLocation,
  Navigate
} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './site.css';
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
  getCurrentUserId
} from './api';

function Alert({ message, type = 'info', onClose }) {
  if (!message) return null;
  return (
    <div
      className={`alert alert-${type} d-flex justify-content-between align-items-start`}
      role="alert"
    >
      <span>{message}</span>
      {onClose && (
        <button
          className="btn-close ms-3"
          onClick={onClose}
          aria-label="Close"
        />
      )}
    </div>
  );
}
function useMessage() {
  const [alert, setAlert] = useState(null);
  const show = (message, type = 'info') => setAlert({ message, type });
  return [alert, show, () => setAlert(null)];
}
function readTokenRoles(token = localStorage.getItem('shop.accessToken')) {
  try {
    if (!token || token.split('.').length < 2) return [];
    const payload = JSON.parse(
      decodeURIComponent(
        escape(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      )
    );
    const roleKeys = [
      'role',
      'roles',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    ];
    return roleKeys
      .flatMap(key =>
        payload[key] == null
          ? []
          : Array.isArray(payload[key])
          ? payload[key]
          : [payload[key]]
      )
      .map(String);
  } catch {
    return [];
  }
}
function rolesFromUser(user) {
  const values = [
    user?.role,
    user?.roles,
    user?.roleName,
    user?.claims
  ].flatMap(v => (v == null ? [] : Array.isArray(v) ? v : [v]));
  return values
    .map(v =>
      typeof v === 'string' ? v : v?.value || v?.role || v?.name || ''
    )
    .filter(Boolean)
    .map(String);
}
function isAdminUser(user) {
  return [
    ...readTokenRoles(),
    ...rolesFromUser(user),
    ...(localStorage.getItem('shop.role')
      ? [localStorage.getItem('shop.role')]
      : [])
  ].some(role => role.toLowerCase() === 'admin');
}
function notifyAuthChanged() {
  window.dispatchEvent(new Event('shop-auth-changed'));
}
function Navbar() {
  const [email, setEmail] = useState(localStorage.getItem('shop.email') || '');
  const [isAdmin, setIsAdmin] = useState(isAdminUser());
  const [count, setCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    let alive = true;
    async function sync() {
      const token = localStorage.getItem('shop.accessToken');
      if (!token) {
        setEmail('');
        setIsAdmin(false);
        setCount(0);
        localStorage.removeItem('shop.role');
        return;
      }
      setEmail(localStorage.getItem('shop.email') || 'Signed in');
      setIsAdmin(isAdminUser());
      try {
        const user = await apiGet('/identity/user');
        if (user?.id) localStorage.setItem('shop.userId', user.id);
        const userRoles = rolesFromUser(user);
        if (userRoles.length) localStorage.setItem('shop.role', userRoles[0]);
        const roles = [...readTokenRoles(), ...userRoles];
        if (alive) {
          setEmail(
            user?.email || localStorage.getItem('shop.email') || 'Signed in'
          );
          setIsAdmin(roles.some(r => r.toLowerCase() === 'admin'));
        }
      } catch {
        // Keep the session visible unless the token is explicitly rejected; API calls will show auth errors.
        if (alive) setIsAdmin(isAdminUser());
      }
      try {
        const cart = await apiGet(API_PATHS.cart);
        if (alive)
          setCount(
            (cart?.cartItems || []).reduce(
              (sum, item) => sum + Number(item.quantity || 0),
              0
            )
          );
      } catch {
        if (alive) setCount(0);
      }
    }
    sync();
    const onAuth = () => sync();
    const onStorage = () => sync();
    window.addEventListener('shop-auth-changed', onAuth);
    window.addEventListener('storage', onStorage);
    return () => {
      alive = false;
      window.removeEventListener('shop-auth-changed', onAuth);
      window.removeEventListener('storage', onStorage);
    };
  }, [location.pathname]);
  function logout() {
    [
      'shop.accessToken',
      'shop.refreshToken',
      'shop.email',
      'shop.userId',
      'shop.role'
    ].forEach(k => localStorage.removeItem(k));
    setEmail('');
    setIsAdmin(false);
    setCount(0);
    notifyAuthChanged();
    navigate('/');
  }
  function refreshPage() {
    setRefreshing(true);
    window.dispatchEvent(new Event('shop-refresh-data'));
    window.setTimeout(() => setRefreshing(false), 350);
  }
  return (
    <nav className="navbar navbar-expand-lg navbar-dark shop-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <span className="brand-mark">S</span>
          <span>
            Shop<span className="brand-dot">.</span>
          </span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto gap-lg-1">
            <li className="nav-item">
              <NavLink end className="nav-link" to="/">
                Store
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/cart">
                Cart <span className="cart-pill">{count}</span>
              </NavLink>
            </li>
            {email && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/orders">
                  My Orders
                </NavLink>
              </li>
            )}
            {isAdmin && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin">
                  Admin panel
                </NavLink>
              </li>
            )}
          </ul>
          <div className="d-flex gap-2 align-items-center nav-actions">
            <button
              className="btn btn-nav-refresh"
              onClick={refreshPage}
              title="Refresh current data"
              aria-label="Refresh data"
            >
              <span className={refreshing ? 'spin' : ''}>↻</span>
            </button>
            {email ? (
              <>
                <span className="navbar-text text-light small user-email">
                  {email}
                </span>
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-light btn-sm" to="/login">
                  Login
                </Link>
                <Link className="btn btn-nav-primary btn-sm" to="/register">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
function Store() {
  const [products, setProducts] = useState([]),
    [categories, setCategories] = useState([]),
    [term, setTerm] = useState(''),
    [category, setCategory] = useState(''),
    [alert, show, clear] = useMessage(),
    [loading, setLoading] = useState(true);
  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [p, c] = await Promise.all([
        apiGet(API_PATHS.products).then(unwrapArray),
        apiGet(API_PATHS.categories)
          .then(unwrapArray)
          .catch(() => [])
      ]);
      setProducts(p);
      setCategories(c);
      clear();
    } catch (e) {
      show(
        `Could not load products: ${e.message}. Check API URL, server status, and CORS settings.`,
        'danger'
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    const refresh = () => load(true);
    window.addEventListener('shop-refresh-data', refresh);
    return () => window.removeEventListener('shop-refresh-data', refresh);
  }, []);
  const filtered = products.filter(
    p =>
      (safeText(p.name, '').toLowerCase().includes(term.toLowerCase()) ||
        safeText(p.description, '')
          .toLowerCase()
          .includes(term.toLowerCase())) &&
      (!category || String(p.categoryId) === category)
  );
  async function add(p) {
    if (!localStorage.getItem('shop.accessToken')) {
      show('Please log in before adding items to your cart.', 'warning');
      return;
    }
    const userId = await getCurrentUserId();
    if (!userId) {
      show(
        'A user ID could not be retrieved. Check the identity endpoint.',
        'warning'
      );
      return;
    }
    try {
      await apiPost(API_PATHS.cartItems, {
        productId: Number(p.productId),
        quantity: 1
      });
      show('Product added to cart.', 'success');
      window.dispatchEvent(new Event('shop-auth-changed'));
    } catch (e) {
      show(e.message, 'danger');
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
            <span className={loading ? 'spin' : ''}>↻</span>{' '}
            {loading ? 'Updating…' : 'Refresh'}
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
              onChange={e => setTerm(e.target.value)}
            />
          </div>
          <select
            className="form-select category-select"
            aria-label="Filter by category"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map(c => (
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
            {filtered.map(p => (
              <div className="col" key={p.productId}>
                <article className="card h-100 product-card polished-product">
                  {getProductImageUrl(p.imageUrl) ? (
                    <img
                      className="product-image card-img-top"
                      src={getProductImageUrl(p.imageUrl)}
                      alt={safeText(p.name, 'Product')}
                      loading="lazy"
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="product-image product-placeholder align-items-center justify-content-center"
                    style={{
                      display: getProductImageUrl(p.imageUrl) ? 'none' : 'flex'
                    }}
                  >
                    <span>SHOP</span>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <div className="product-meta">
                      <span className="product-category">
                        {categories.find(
                          c => String(c.categoryId) === String(p.categoryId)
                        )?.name || 'Collection'}
                      </span>
                      {p.isActive === false && (
                        <span className="badge text-bg-secondary">
                          Unavailable
                        </span>
                      )}
                    </div>
                    <h2 className="h6 card-title">
                      {safeText(p.name, 'Untitled product')}
                    </h2>
                    <p className="small text-secondary flex-grow-1 product-description">
                      {safeText(p.description, 'No description available.')}
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
                            p.quantity !== '' &&
                            Number(p.quantity) <= 0) ||
                          p.isActive === false
                        }
                        onClick={() => add(p)}
                      >
                        {p.quantity !== null &&
                        p.quantity !== undefined &&
                        p.quantity !== '' &&
                        Number(p.quantity) <= 0
                          ? 'Out of stock'
                          : p.isActive === false
                          ? 'Unavailable'
                          : 'Add to cart +'}
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
                setTerm('');
                setCategory('');
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
function AuthPage({ register = false }) {
  const [alert, show, clear] = useMessage();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    clear();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get('email')).trim(),
      password = String(form.get('password'));
    setBusy(true);
    try {
      const result = await apiPost(
        register ? API_PATHS.register : API_PATHS.login,
        { email, password }
      );
      if (register) {
        show('Account created. You can now log in.', 'success');
        formElement.reset();
      } else {
        if (result?.accessToken)
          localStorage.setItem('shop.accessToken', result.accessToken);
        if (result?.refreshToken)
          localStorage.setItem('shop.refreshToken', result.refreshToken);
        localStorage.setItem('shop.email', email);
        const roles = [
          ...readTokenRoles(),
          ...rolesFromUser(result?.user || result)
        ];
        if (roles.length) localStorage.setItem('shop.role', roles[0]);
        notifyAuthChanged();
        navigate('/');
      }
    } catch (err) {
      show(err.message, 'danger');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-decoration">
        <div className="auth-brand">
          <span className="brand-mark">S</span>
          <span>
            Shop<span className="brand-dot">.</span>
          </span>
        </div>
        <div>
          <span className="eyebrow">YOUR NEXT FAVORITE</span>
          <h1>
            {register
              ? 'Make room for something great.'
              : 'Good to see you again.'}
          </h1>
          <p>
            {register
              ? 'Create an account and keep your shopping in one place.'
              : 'Sign in to continue to your orders and saved shopping experience.'}
          </p>
        </div>
        <div className="auth-decoration-bottom">
          Simple shopping. Thoughtfully done.
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form-card">
          <Link to="/" className="auth-back">
            ← Back to store
          </Link>
          <span className="eyebrow text-primary">
            {register ? 'GET STARTED' : 'WELCOME BACK'}
          </span>
          <h2>{register ? 'Create your account' : 'Sign in'}</h2>
          <p className="text-secondary mb-4">
            {register
              ? 'It only takes a moment.'
              : 'Enter your details to access your account.'}
          </p>
          <Alert message={alert?.message} type={alert?.type} onClose={clear} />
          <form onSubmit={submit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                className="form-control form-control-lg"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                className="form-control form-control-lg"
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                minLength={register ? 6 : undefined}
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              className="btn btn-primary btn-lg w-100"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Please wait…
                </>
              ) : register ? (
                'Create account'
              ) : (
                'Sign in'
              )}
            </button>
          </form>
          <p className="small text-center mt-4 mb-0">
            {register ? 'Already have an account?' : 'New to Shop?'}{' '}
            <Link to={register ? '/login' : '/register'}>
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
function Cart() {
  const [cart, setCart] = useState(null),
    [alert, show, clear] = useMessage(),
    [busy, setBusy] = useState(false),
    navigate = useNavigate();
  const load = async () => {
    try {
      setCart(await apiGet(API_PATHS.cart));
    } catch (e) {
      show(e.message, 'danger');
      setCart({ cartItems: [], totalPrice: 0 });
    }
  };
  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener('shop-refresh-data', refresh);
    return () => window.removeEventListener('shop-refresh-data', refresh);
  }, []);
  const items = Array.isArray(cart?.cartItems) ? cart.cartItems : [];
  async function update(item, quantity) {
    try {
      await apiPatch(
        `${API_PATHS.cartItems}/${encodeURIComponent(item.cartItemId)}`,
        { quantity }
      );
      await load();
    } catch (e) {
      show(e.message, 'danger');
    }
  }
  async function remove(item) {
    try {
      await apiDelete(
        `${API_PATHS.cartItems}/${encodeURIComponent(item.cartItemId)}`
      );
      await load();
    } catch (e) {
      show(e.message, 'danger');
    }
  }
  async function clearCart() {
    try {
      await apiDelete(API_PATHS.cart);
      await load();
      show('Cart cleared.', 'success');
    } catch (e) {
      show(e.message, 'danger');
    }
  }
  async function checkout() {
    if (!items.length) {
      show('Your cart is empty.', 'warning');
      return;
    }
    const userId = await getCurrentUserId();
    if (!userId) {
      show(
        'A user ID is required to create an order. Check the identity endpoint and user ID retrieval.',
        'warning'
      );
      return;
    }
    try {
      setBusy(true);
      await apiPost(API_PATHS.orders);
      await apiDelete(API_PATHS.cart);
      show('Order created successfully.', 'success');
      await load();
      navigate('/orders');
    } catch (e) {
      show(`Could not place order: ${e.message}`, 'danger');
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
                    items.map(i => (
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
                {busy ? 'Processing…' : 'Place order'}
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
function Orders() {
  const [orders, setOrders] = useState([]),
    [alert, show, clear] = useMessage();
  async function load() {
    try {
      setOrders(unwrapArray(await apiGet(API_PATHS.orders)));
    } catch (e) {
      show(`Could not load orders: ${e.message}`, 'danger');
    }
  }
  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener('shop-refresh-data', refresh);
    return () => window.removeEventListener('shop-refresh-data', refresh);
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
                orders.map(o => (
                  <tr key={o.orderId}>
                    <td className="ps-3">{o.orderId}</td>
                    <td>{safeText(o.orderStatus)}</td>
                    <td>{money(o.totalPrice)}</td>
                    <td className="text-end pe-3">
                      <Link
                        className="btn btn-sm btn-outline-primary"
                        to={`/order-details?id=${encodeURIComponent(
                          o.orderId
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
function OrderDetails() {
  const [params] = useSearchParams(),
    id = params.get('id'),
    [order, setOrder] = useState(null),
    [alert, show, clear] = useMessage();
  useEffect(() => {
    let alive = true;
    async function load() {
      if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        show('Invalid order ID.', 'danger');
        return;
      }
      try {
        const data = await apiGet(
          `${API_PATHS.orders}/${encodeURIComponent(id)}`
        );
        if (alive) setOrder(data);
      } catch (e) {
        if (alive) show(`Could not load order details: ${e.message}`, 'danger');
      }
    }
    load();
    const refresh = () => load();
    window.addEventListener('shop-refresh-data', refresh);
    return () => {
      alive = false;
      window.removeEventListener('shop-refresh-data', refresh);
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
            <strong>Total:</strong> {order ? money(order.totalPrice) : '—'}
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
                    ? 'No items found for this order.'
                    : 'Loading order...'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
function fileToCompactDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file.'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error('Image must be smaller than 8 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Invalid image file.'));
      image.onload = () => {
        const max = 1000,
          scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
function AdminGate() {
  const [state, setState] = useState('checking');
  const location = useLocation();
  useEffect(() => {
    let alive = true;
    async function verify() {
      if (!localStorage.getItem('shop.accessToken')) {
        if (alive) setState('login');
        return;
      }
      try {
        const user = await apiGet('/identity/user');
        const roles = [...readTokenRoles(), ...rolesFromUser(user)];
        if (roles.some(r => r.toLowerCase() === 'admin')) {
          if (alive) setState('allowed');
        } else if (alive) setState('denied');
      } catch {
        const roles = readTokenRoles();
        if (alive)
          setState(
            roles.some(r => r.toLowerCase() === 'admin') ? 'allowed' : 'denied'
          );
      }
    }
    verify();
    return () => {
      alive = false;
    };
  }, [location.key]);
  if (state === 'checking')
    return (
      <main className="container py-5 text-center">
        <div className="spinner-border text-primary" />
        <p className="text-secondary mt-3">Checking administrator access…</p>
      </main>
    );
  if (state === 'login')
    return (
      <main className="container py-5">
        <div className="empty-state">
          <h2>Sign in required</h2>
          <p>
            You need to sign in with an administrator account to open this page.
          </p>
          <Link className="btn btn-primary" to="/login">
            Go to login
          </Link>
        </div>
      </main>
    );
  if (state === 'denied')
    return (
      <main className="container py-5">
        <div className="empty-state">
          <h2>Access restricted</h2>
          <p>This area is available to administrators only.</p>
          <Link className="btn btn-outline-primary" to="/">
            Back to store
          </Link>
        </div>
      </main>
    );
  return <Admin />;
}
function Admin() {
  const [tab, setTab] = useState('products'),
    [products, setProducts] = useState([]),
    [categories, setCategories] = useState([]),
    [orders, setOrders] = useState([]),
    [alert, show, clear] = useMessage(),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(''),
    [form, setForm] = useState({
      name: '',
      description: '',
      price: '',
      quantity: 0,
      categoryId: '',
      isActive: true,
      imageUrl: ''
    });
  async function load(silent = false) {
    if (!silent) clear();
    setBusy(true);
    const r = await Promise.allSettled([
      apiGet(API_PATHS.products).then(unwrapArray),
      apiGet(API_PATHS.categories).then(unwrapArray),
      apiGet(API_PATHS.orders).then(unwrapArray)
    ]);
    setProducts(r[0].status === 'fulfilled' ? r[0].value : []);
    setCategories(r[1].status === 'fulfilled' ? r[1].value : []);
    setOrders(r[2].status === 'fulfilled' ? r[2].value : []);
    const errs = r
      .filter(x => x.status === 'rejected')
      .map(x => x.reason?.message || 'API error');
    if (errs.length)
      show(`Some data could not be loaded: ${errs.join('; ')}`, 'warning');
    setBusy(false);
  }
  useEffect(() => {
    load();
    const refresh = () => load(true);
    window.addEventListener('shop-refresh-data', refresh);
    return () => window.removeEventListener('shop-refresh-data', refresh);
  }, []);
  function openProduct(p = null) {
    setEditing(p);
    setForm({
      name: p?.name || '',
      description: p?.description || '',
      price: p?.price ?? '',
      quantity: p?.quantity ?? 0,
      categoryId: p?.categoryId ?? '',
      isActive: p?.isActive ?? true,
      imageUrl: p?.imageUrl || ''
    });
    setError('');
    setModal(true);
  }
  async function chooseImage(file) {
    if (!file) return;
    try {
      const imageUrl = await fileToCompactDataUrl(file);
      setForm(current => ({ ...current, imageUrl }));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }
  async function save(e) {
    e.preventDefault();
    setError('');
    const data = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      quantity: Number(form.quantity),
      isActive: form.isActive,
      categoryId: Number(form.categoryId),
      imageUrl: form.imageUrl || null
    };
    try {
      setBusy(true);
      if (editing)
        await apiPatch(
          `${API_PATHS.products}/${encodeURIComponent(editing.productId)}`,
          {
            id: Number(editing.productId),
            ...data,
            categoryId: String(data.categoryId)
          }
        );
      else await apiPost(API_PATHS.products, data);
      setModal(false);
      show(editing ? 'Product updated.' : 'Product created.', 'success');
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
        `${API_PATHS.products}/${encodeURIComponent(p.productId)}`
      );
      show('Product deleted.', 'success');
      await load(true);
    } catch (e) {
      show(`Could not delete product: ${e.message}`, 'danger');
    }
  }
  async function detail(o) {
    try {
      const d = await apiGet(
        `${API_PATHS.orders}/${encodeURIComponent(o.orderId)}`
      );
      window.alert(JSON.stringify(d, null, 2));
    } catch (e) {
      show(e.message, 'danger');
    }
  }
  const visibleProducts = products.filter(p =>
    `${p.name || ''} ${p.description || ''} ${p.productId || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const tabs = [
    { id: 'products', label: 'Products', icon: '▦' },
    { id: 'categories', label: 'Categories', icon: '◈' },
    { id: 'orders', label: 'Orders', icon: '↗' },
    { id: 'users', label: 'Users', icon: '♙' }
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
            <span className={busy ? 'spin' : ''}>↻</span>{' '}
            {busy ? 'Refreshing…' : 'Refresh data'}
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
                {products.filter(p => p.isActive !== false).length}
              </strong>
              <small>Visible in store</small>
            </div>
          </div>
        </div>
        <div className="admin-workspace">
          <aside className="admin-sidebar">
            <div className="sidebar-caption">WORKSPACE</div>
            {tabs.map(t => (
              <button
                key={t.id}
                className={`admin-side-link ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span>{t.icon}</span>
                {t.label}
                {t.id === 'orders' && <small>{orders.length}</small>}
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
            {tab === 'products' && (
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
                      onChange={e => setSearch(e.target.value)}
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
                        visibleProducts.map(p => (
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
                                    {safeText(p.name, 'Untitled product')}
                                  </strong>
                                  <small>ID: {p.productId}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              {categories.find(
                                c =>
                                  String(c.categoryId) === String(p.categoryId)
                              )?.name ||
                                p.categoryId ||
                                '—'}
                            </td>
                            <td className="fw-semibold">{money(p.price)}</td>
                            <td>{p.quantity}</td>
                            <td>
                              <span
                                className={`status-chip ${
                                  p.isActive === false ? 'inactive' : 'active'
                                }`}
                              >
                                <span />{' '}
                                {p.isActive === false ? 'Inactive' : 'Active'}
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
            {tab === 'categories' && (
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
                      {categories.map(c => (
                        <tr key={c.categoryId}>
                          <td>{c.categoryId}</td>
                          <td className="fw-semibold">{c.name}</td>
                          <td>{safeText(c.description)}</td>
                          <td>
                            <span
                              className={`status-chip ${
                                c.isActive === false ? 'inactive' : 'active'
                              }`}
                            >
                              <span />
                              {c.isActive === false ? 'Inactive' : 'Active'}
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
            {tab === 'orders' && (
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
                        orders.map(o => (
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
            {tab === 'users' && (
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
                      {editing ? 'Edit product' : 'Add a new product'}
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
                          onChange={e =>
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
                          onChange={e =>
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
                            onChange={e =>
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
                            onChange={e =>
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
                          onChange={e =>
                            setForm({ ...form, categoryId: e.target.value })
                          }
                        >
                          <option value="">Choose a category</option>
                          {categories.map(c => (
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
                          onChange={e =>
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
                          onChange={e => chooseImage(e.target.files?.[0])}
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
                          {form.imageUrl ? 'Change image' : 'Browse files'}
                        </span>
                      </label>
                      {form.imageUrl && (
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-danger px-0"
                          onClick={() => setForm({ ...form, imageUrl: '' })}
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
                      'Save product'
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
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Store />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage register />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/order-details" element={<OrderDetails />} />
        <Route path="/admin" element={<AdminGate />} />
        <Route path="*" element={<Store />} />
      </Routes>
    </BrowserRouter>
  );
}
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
