import { login, register as registerUser } from "../services/authService";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMessage } from "../hooks/useMessage";
import Alert from "./Alert";
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
      const result = register
        ? await registerUser(email, password)
        : await login(email, password);
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
    <main className="min-h-[calc(100vh-72px)] grid grid-cols-1 lg:grid-cols-2 bg-surface">
      <div className="bg-brand-700 text-white p-8 lg:p-20 flex flex-col justify-between min-h-[650px] relative overflow-hidden">
        <div className="flex items-center gap-2.5 text-xl font-extrabold">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-100 text-brand-700 font-extrabold">
            S
          </span>
          <span>
            Shop<span className="text-sky-400">.</span>
          </span>
        </div>
        <div>
          <span className="block text-[0.69rem] tracking-[0.17em] font-extrabold text-sky-400 mb-3">
            YOUR NEXT FAVORITE
          </span>
          <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight max-w-[520px] font-display">
            {register
              ? "Make room for something great."
              : "Good to see you again."}
          </h1>
          <p className="text-brand-100 leading-relaxed max-w-[420px] mt-4">
            {register
              ? "Create an account and keep your shopping in one place."
              : "Sign in to continue to your orders and saved shopping experience."}
          </p>
        </div>
        <div className="text-xs text-brand-200">
          Simple shopping. Thoughtfully done.
        </div>
      </div>

      <div className="grid place-items-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          <Link
            to="/"
            className="inline-block text-muted text-sm mb-12 no-underline hover:text-brand-700"
          >
            ← Back to store
          </Link>
          <span className="block text-[0.69rem] tracking-[0.17em] font-extrabold text-brand-700 mb-3">
            {register ? "GET STARTED" : "WELCOME BACK"}
          </span>
          <h2 className="text-3xl font-extrabold mb-2">
            {register ? "Create your account" : "Sign in"}
          </h2>
          <p className="text-muted mb-6">
            {register
              ? "It only takes a moment."
              : "Enter your details to access your account."}
          </p>
          <Alert message={alert?.message} type={alert?.type} onClose={clear} />
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full border border-app rounded-lg px-3 py-3 bg-surface text-app focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={register ? 6 : undefined}
                className="w-full border border-app rounded-lg px-3 py-3 bg-surface text-app focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Enter your password"
                autoComplete={register ? "new-password" : "current-password"}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-brand-700 text-white font-bold rounded-lg py-3 hover:bg-brand-900 disabled:opacity-60 transition"
            >
              {busy ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Please wait…
                </>
              ) : register ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </button>
          </form>
          <p className="text-sm text-center mt-6">
            {register ? "Already have an account?" : "New to Shop?"}{" "}
            <Link
              to={register ? "/login" : "/register"}
              className="font-bold text-brand-700 hover:text-brand-900"
            >
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
