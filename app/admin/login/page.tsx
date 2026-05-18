"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api/client";
import { clearAdminAuthSession, setAdminAuthSession } from "@/lib/adminAuth";
import { activateClientDemoAdminSession, CLIENT_DEMO_ADMIN_PIN, isClientDemoEnabled } from "@/lib/clientDemoData";

type AdminLoginResponse = {
  token: string;
  admin?: {
    role?: string;
    loginId?: string;
  };
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedLoginId = loginId.trim();
    if (!normalizedLoginId || !password) {
      setError("Admin ID and password are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    clearAdminAuthSession();

    const response = await apiRequest<AdminLoginResponse>("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ loginId: normalizedLoginId, password }),
    });

    if (response.error || !response.data?.token) {
      setIsSubmitting(false);
      setError(response.error?.message ?? "Unable to login. Please try again.");
      return;
    }

    setAdminAuthSession({
      token: response.data.token,
      loginId: response.data.admin?.loginId ?? normalizedLoginId,
    });

    setIsSubmitting(false);
    router.replace("/admin");
  };

  const handleDemoLogin = () => {
    if (!isClientDemoEnabled()) return;
    if (pin.trim() !== CLIENT_DEMO_ADMIN_PIN) {
      setError("Invalid demo PIN.");
      return;
    }
    setError("");
    activateClientDemoAdminSession();
    router.replace("/admin");
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#fffdf8] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#dceae5] bg-white p-6 shadow-xl shadow-teal-900/5 sm:p-7">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="mx-auto h-auto max-h-12 w-auto object-contain" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">YoPartner Admin Console</h1>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Manage partner reviews, safety checks, members, and conversations.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <label className="block">
            <p className="mb-1.5 text-sm font-medium text-slate-700">Admin ID</p>
            <input
              type="text"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              autoComplete="username"
              className="h-11 w-full rounded-2xl border border-[#dceae5] px-3 text-sm text-slate-800 outline-none transition focus:border-[#0f766e]"
              placeholder="Enter admin ID"
            />
          </label>

          <label className="block">
            <p className="mb-1.5 text-sm font-medium text-slate-700">Password</p>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="h-11 w-full rounded-2xl border border-[#dceae5] px-3 text-sm text-slate-800 outline-none transition focus:border-[#0f766e]"
              placeholder="Enter password"
            />
          </label>

          {isClientDemoEnabled() ? (
            <label className="block">
              <p className="mb-1.5 text-sm font-medium text-slate-700">Demo PIN</p>
              <input
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                placeholder="Enter 4-digit PIN"
                className="h-11 w-full rounded-2xl border border-[#dceae5] px-3 text-sm text-slate-800 outline-none transition focus:border-[#0f766e]"
              />
            </label>
          ) : null}

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-full bg-[#0f766e] text-sm font-semibold text-white transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Signing in..." : "Sign in securely"}
          </button>

          {isClientDemoEnabled() ? (
            <button
              type="button"
              onClick={handleDemoLogin}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Login with Demo PIN
            </button>
          ) : null}
        </form>
      </div>
    </section>
  );
}
