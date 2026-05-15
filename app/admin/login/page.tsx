"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { activateClientDemoAdminSession, CLIENT_DEMO_ADMIN_PIN, isClientDemoEnabled } from "@/lib/clientDemoData";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { ADMIN_LOGIN_KEY } from "@/lib/adminData";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isClientDemoEnabled() && pin.trim() === CLIENT_DEMO_ADMIN_PIN) {
      activateClientDemoAdminSession();
      router.replace("/admin");
      return;
    }
    if (IS_PRODUCTION_READY_MODE) {
      setError("Admin authentication is not configured for production.");
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (normalizedEmail === "admin@yopartner.in" && password === "admin123") {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ADMIN_LOGIN_KEY, "true");
      }
      router.replace("/admin");
      return;
    }
    setError("Invalid demo credentials.");
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="mx-auto h-auto max-h-12 w-auto object-contain" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Admin Login</h1>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <label className="block">
            <p className="mb-1.5 text-sm font-medium text-slate-700">Email</p>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-[#2563eb]"
            />
          </label>

          <label className="block">
            <p className="mb-1.5 text-sm font-medium text-slate-700">Password</p>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-[#2563eb]"
            />
          </label>
          {isClientDemoEnabled() ? (
            <label className="block">
              <p className="mb-1.5 text-sm font-medium text-slate-700">Client Demo PIN</p>
              <input
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                placeholder="Enter 4-digit PIN"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-[#2563eb]"
              />
            </label>
          ) : null}

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-[#2563eb] text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
          >
            Login
          </button>
        </form>

        {!IS_PRODUCTION_READY_MODE ? (
          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Demo: <span className="font-semibold">admin@yopartner.in</span> /{" "}
            <span className="font-semibold">admin123</span>
          </p>
        ) : null}
        {isClientDemoEnabled() ? (
          <p className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            Client Demo • Preview Mode PIN enabled
          </p>
        ) : null}
      </div>
    </section>
  );
}
