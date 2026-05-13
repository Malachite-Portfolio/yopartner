"use client";

import { useState } from "react";
import { PartnerSidebar } from "@/components/partner/PartnerSidebar";
import { PartnerTopbar } from "@/components/partner/PartnerTopbar";
import { IS_DEMO_MODE } from "@/lib/config/runtime";

export function PartnerShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="hidden lg:block">
        <PartnerSidebar />
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-900/35 lg:hidden">
          <div className="h-full w-[272px] bg-white">
            <PartnerSidebar onNavigate={() => setSidebarOpen(false)} onClose={() => setSidebarOpen(false)} />
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 -z-10"
            aria-label="Dismiss partner sidebar overlay"
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <PartnerTopbar onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          {IS_DEMO_MODE ? (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              Test Version - demo data only
            </p>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
