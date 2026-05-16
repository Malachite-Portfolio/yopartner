"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { resolveAdminAccess, type AdminAccessState } from "@/lib/adminAuth";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessState, setAccessState] = useState<AdminAccessState | null>(null);

  useEffect(() => {
    let active = true;
    const syncAccess = async () => {
      const access = await resolveAdminAccess();
      if (!active) return;
      setAccessState(access);
      if (access.needsLogin) {
        router.replace("/admin/login");
      }
    };

    void syncAccess();
    return () => {
      active = false;
    };
  }, [router]);

  if (!accessState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Loading admin panel...</p>
      </div>
    );
  }

  if (accessState.needsLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Redirecting to admin login...</p>
      </div>
    );
  }

  if (!accessState.allowed && accessState.forbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">You do not have permission to access the admin panel.</p>
          <p className="mt-2 text-sm text-slate-600">
            {accessState.message ?? "Please login with an authorized admin account."}
          </p>
          <button
            type="button"
            onClick={() => router.replace("/admin/login")}
            className="mt-4 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  if (!accessState.allowed) {
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
          {accessState.isDemo ? (
            <p className="mb-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
              Client Demo | Preview Mode
            </p>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
