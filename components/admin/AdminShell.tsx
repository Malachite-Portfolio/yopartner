"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ADMIN_LOGIN_KEY } from "@/lib/adminData";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(ADMIN_LOGIN_KEY) === "true",
  );

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/admin/login");
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-900/35 lg:hidden">
          <div className="h-full w-[286px] bg-white">
            <AdminSidebar onNavigate={() => setSidebarOpen(false)} onClose={() => setSidebarOpen(false)} />
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 -z-10"
            aria-label="Dismiss sidebar overlay"
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Test Version - demo data only
          </p>
          {children}
        </main>
      </div>
    </div>
  );
}
