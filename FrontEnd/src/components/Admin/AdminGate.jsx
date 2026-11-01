import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentUser } from "../../services/authService";
import { readTokenRoles, rolesFromUser } from "../../utils/auth";
import Admin from "./Admin";

export default function AdminGate() {
  const [state, setState] = useState("checking");
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    async function verify() {
      if (!localStorage.getItem("shop.accessToken")) {
        if (alive) setState("login");
        return;
      }
      try {
        const user = await getCurrentUser();
        const roles = [...readTokenRoles(), ...rolesFromUser(user)];
        if (alive)
          setState(
            roles.some((r) => r.toLowerCase() === "admin")
              ? "allowed"
              : "denied",
          );
      } catch {
        const roles = readTokenRoles();
        if (alive)
          setState(
            roles.some((r) => r.toLowerCase() === "admin")
              ? "allowed"
              : "denied",
          );
      }
    }
    verify();
    return () => {
      alive = false;
    };
  }, [location.key]);

  if (state === "checking")
    return (
      <main className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted mt-4">Checking administrator access…</p>
      </main>
    );

  if (state === "login")
    return (
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center justify-center text-center p-16 bg-surface border border-dashed border-app rounded-2xl">
          <h2 className="text-xl font-extrabold mb-2">Sign in required</h2>
          <p className="text-muted mb-5">
            You need to sign in with an administrator account to open this page.
          </p>
          <Link
            to="/login"
            className="px-4 py-2 bg-brand-700 text-white rounded-lg font-bold hover:bg-brand-900"
          >
            Go to login
          </Link>
        </div>
      </main>
    );

  if (state === "denied")
    return (
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center justify-center text-center p-16 bg-surface border border-dashed border-app rounded-2xl">
          <h2 className="text-xl font-extrabold mb-2">Access restricted</h2>
          <p className="text-muted mb-5">
            This area is available to administrators only.
          </p>
          <Link
            to="/"
            className="px-4 py-2 border border-brand-700 text-brand-700 rounded-lg hover:bg-brand-100"
          >
            Back to store
          </Link>
        </div>
      </main>
    );

  return <Admin />;
}
