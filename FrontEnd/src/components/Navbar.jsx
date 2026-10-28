import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { API_PATHS, apiGet } from '../api';
import { readTokenRoles, rolesFromUser, isAdminUser, notifyAuthChanged } from '../utils/auth';

export default function Navbar() {
  const [email, setEmail] = useState(localStorage.getItem("shop.email") || "");
  const [isAdmin, setIsAdmin] = useState(isAdminUser());
  const [count, setCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    let alive = true;
    async function sync() {
      const token = localStorage.getItem("shop.accessToken");
      if (!token) {
        setEmail("");
        setIsAdmin(false);
        setCount(0);
        localStorage.removeItem("shop.role");
        return;
      }
      setEmail(localStorage.getItem("shop.email") || "Signed in");
      setIsAdmin(isAdminUser());
      try {
        const user = await apiGet("/identity/user");
        if (user?.id) localStorage.setItem("shop.userId", user.id);
        const userRoles = rolesFromUser(user);
        if (userRoles.length) localStorage.setItem("shop.role", userRoles[0]);
        const roles = [...readTokenRoles(), ...userRoles];
        if (alive) {
          setEmail(
            user?.email || localStorage.getItem("shop.email") || "Signed in",
          );
          setIsAdmin(roles.some((r) => r.toLowerCase() === "admin"));
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
              0,
            ),
          );
      } catch {
        if (alive) setCount(0);
      }
    }
    sync();
    const onAuth = () => sync();
    const onStorage = () => sync();
    window.addEventListener("shop-auth-changed", onAuth);
    window.addEventListener("storage", onStorage);
    return () => {
      alive = false;
      window.removeEventListener("shop-auth-changed", onAuth);
      window.removeEventListener("storage", onStorage);
    };
  }, [location.pathname]);
  function logout() {
    [
      "shop.accessToken",
      "shop.refreshToken",
      "shop.email",
      "shop.userId",
      "shop.role",
    ].forEach((k) => localStorage.removeItem(k));
    setEmail("");
    setIsAdmin(false);
    setCount(0);
    notifyAuthChanged();
    navigate("/");
  }
  function refreshPage() {
    setRefreshing(true);
    window.dispatchEvent(new Event("shop-refresh-data"));
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
              <span className={refreshing ? "spin" : ""}>↻</span>
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
