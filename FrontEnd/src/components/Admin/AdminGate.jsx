import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Admin from "./Admin";
import { apiGet } from "../../api";
import { readTokenRoles, rolesFromUser } from "../../utils/auth";

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
        const user = await apiGet("/identity/user");
        const roles = [...readTokenRoles(), ...rolesFromUser(user)];
        if (roles.some((r) => r.toLowerCase() === "admin")) {
          if (alive) setState("allowed");
        } else if (alive) setState("denied");
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
      <main className="container py-5 text-center">
        <div className="spinner-border text-primary" />
        <p className="text-secondary mt-3">Checking administrator access…</p>
      </main>
    );
  if (state === "login")
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
  if (state === "denied")
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
