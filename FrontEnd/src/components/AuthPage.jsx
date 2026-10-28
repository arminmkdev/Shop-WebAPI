import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMessage } from "../hooks/useMessage";
import Alert from "./Alert";
import { API_PATHS, apiPost } from "../api";
import {
  readTokenRoles,
  rolesFromUser,
  notifyAuthChanged,
} from "../utils/auth";

export default function AuthPage({ register = false }) {
  const [alert, show, clear] = useMessage();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    clear();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get("email")).trim(),
      password = String(form.get("password"));
    setBusy(true);
    try {
      const result = await apiPost(
        register ? API_PATHS.register : API_PATHS.login,
        { email, password },
      );
      if (register) {
        show("Account created. You can now log in.", "success");
        formElement.reset();
      } else {
        if (result?.accessToken)
          localStorage.setItem("shop.accessToken", result.accessToken);
        if (result?.refreshToken)
          localStorage.setItem("shop.refreshToken", result.refreshToken);
        localStorage.setItem("shop.email", email);
        const roles = [
          ...readTokenRoles(),
          ...rolesFromUser(result?.user || result),
        ];
        if (roles.length) localStorage.setItem("shop.role", roles[0]);
        notifyAuthChanged();
        navigate("/");
      }
    } catch (err) {
      show(err.message, "danger");
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
              ? "Make room for something great."
              : "Good to see you again."}
          </h1>
          <p>
            {register
              ? "Create an account and keep your shopping in one place."
              : "Sign in to continue to your orders and saved shopping experience."}
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
            {register ? "GET STARTED" : "WELCOME BACK"}
          </span>
          <h2>{register ? "Create your account" : "Sign in"}</h2>
          <p className="text-secondary mb-4">
            {register
              ? "It only takes a moment."
              : "Enter your details to access your account."}
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
                autoComplete={register ? "new-password" : "current-password"}
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
                "Create account"
              ) : (
                "Sign in"
              )}
            </button>
          </form>
          <p className="small text-center mt-4 mb-0">
            {register ? "Already have an account?" : "New to Shop?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
