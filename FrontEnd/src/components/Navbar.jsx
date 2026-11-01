import { getCurrentUser } from "../services/authService";
import { getCart } from "../services/cartService";
import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  readTokenRoles,
  rolesFromUser,
  isAdminUser,
  notifyAuthChanged,
} from "../utils/auth";

export default function Navbar() {
  const [email, setEmail] = useState(localStorage.getItem("shop.email") || "");
  const [isAdmin, setIsAdmin] = useState(isAdminUser());
  const [count, setCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(
    document.documentElement.classList.contains("dark"),
  );
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
        const user = await getCurrentUser();
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
        const cart = await getCart();
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
  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  const linkClass = ({ isActive }) =>
    `block lg:inline-block px-3 py-2 rounded-lg text-sm transition ${
      isActive
        ? "bg-white/10 text-white"
        : "text-brand-200 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <nav className="bg-brand-900 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between min-h-[72px]">
        <Link
          className="flex items-center gap-2 text-xl font-extrabold font-display"
          to="/"
        >
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-100 text-brand-700 font-extrabold">
            S
          </span>
          <span>
            Shop<span className="text-sky-400">.</span>
          </span>
        </Link>

        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          className="lg:hidden p-2 rounded-lg border border-white/20"
        >
          <span className="block w-5 h-0.5 bg-white mb-1" />
          <span className="block w-5 h-0.5 bg-white mb-1" />
          <span className="block w-5 h-0.5 bg-white" />
        </button>

        <div
          className={`${open ? "block" : "hidden"} lg:flex lg:items-center lg:flex-1 lg:justify-between`}
        >
          <ul className="flex flex-col lg:flex-row lg:items-center gap-1 lg:ml-6 mt-4 lg:mt-0">
            <li>
              <NavLink
                end
                className={linkClass}
                to="/"
                onClick={() => setOpen(false)}
              >
                Store
              </NavLink>
            </li>
            <li>
              <NavLink
                className={linkClass}
                to="/cart"
                onClick={() => setOpen(false)}
              >
                Cart{" "}
                <span className="inline-grid place-items-center min-w-5 h-5 ml-1 px-1 bg-brand-500 rounded-full text-white text-[0.7rem]">
                  {count}
                </span>
              </NavLink>
            </li>
            {email && (
              <li>
                <NavLink
                  className={linkClass}
                  to="/orders"
                  onClick={() => setOpen(false)}
                >
                  My Orders
                </NavLink>
              </li>
            )}
            {isAdmin && (
              <li>
                <NavLink
                  className={linkClass}
                  to="/admin"
                  onClick={() => setOpen(false)}
                >
                  Admin panel
                </NavLink>
              </li>
            )}
          </ul>

          <div className="flex flex-wrap items-center gap-2 mt-4 lg:mt-0">
            <button
              onClick={toggleDark}
              title="Toggle theme"
              className="w-9 h-9 border border-white/20 text-white rounded-lg leading-none"
            >
              {dark ? "☀" : "☾"}
            </button>
            <button
              onClick={refreshPage}
              title="Refresh current data"
              className="w-9 h-9 border border-white/20 text-white rounded-lg text-xl leading-none"
            >
              <span className={refreshing ? "inline-block animate-spin" : ""}>
                ↻
              </span>
            </button>
            {email ? (
              <>
                <span className="max-w-[210px] truncate text-brand-200 text-sm">
                  {email}
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-sm border border-white/40 text-white rounded-lg hover:bg-white/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm border border-white/40 text-white rounded-lg hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm bg-sky-400 text-brand-900 font-bold rounded-lg hover:bg-sky-500"
                >
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
