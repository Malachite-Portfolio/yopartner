"use client";

import { useMemo, useState } from "react";
import { ConnectAppHeader } from "@/components/ConnectAppHeader";
import { HomeVisitCompanionCard } from "@/components/HomeVisitCompanionCard";
import { HomeVisitFilters } from "@/components/HomeVisitFilters";
import {
  getClientDemoHomeVisitCompanions,
  isClientDemoEnabled,
} from "@/lib/clientDemoData";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { homeVisitCompanions } from "@/lib/data";

const homeVisitSafetyMessage =
  "Home Visit is available only for verified companions. Please contact support to enable this service.";

export default function HomeVisitPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const demoHomeVisitCompanions = useMemo(
    () => (isClientDemoEnabled() ? getClientDemoHomeVisitCompanions() : []),
    [],
  );

  const companions = useMemo(() => {
    const source = IS_PRODUCTION_READY_MODE
      ? demoHomeVisitCompanions
      : [...homeVisitCompanions, ...demoHomeVisitCompanions];
    const byId = new Map(source.map((item) => [item.id, item]));
    return [...byId.values()];
  }, [demoHomeVisitCompanions]);

  const filteredCompanions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return companions.filter((companion) => {
      if (selectedCategory && !companion.services.includes(selectedCategory)) return false;
      if (!term) return true;
      const haystack =
        `${companion.name} ${companion.tagline} ${companion.city} ${companion.category}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [companions, searchTerm, selectedCategory]);

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <ConnectAppHeader />

      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1900px]">
        <aside className="hidden w-[330px] shrink-0 border-r border-slate-200 bg-white lg:block">
          <HomeVisitFilters
            selectedCategory={selectedCategory}
            onCategoryChange={(value) =>
              setSelectedCategory((current) => (current === value ? null : value))
            }
            onClearAll={() => {
              setSelectedCategory(null);
              setSearchTerm("");
            }}
          />
        </aside>

        <section className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Home Visit</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Verified in-person companionship</h1>
            <p className="mt-2 text-sm text-slate-600">
              Verified in-person companionship for everyday support. Available only after verification and platform approval.
            </p>
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {homeVisitSafetyMessage}
            </p>

            <label className="mt-4 block">
              <span className="sr-only">Search Home Visit companions</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, city, or category"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
              />
            </label>
          </div>

          <div className="mb-4 mt-4 lg:hidden">
            <details className="rounded-xl border border-slate-200 bg-white" open>
              <summary className="cursor-pointer px-4 py-3 text-[15px] font-semibold text-slate-900">
                Filters
              </summary>
              <div className="border-t border-slate-200 p-3">
                <HomeVisitFilters
                  mobile
                  selectedCategory={selectedCategory}
                  onCategoryChange={(value) =>
                    setSelectedCategory((current) => (current === value ? null : value))
                  }
                  onClearAll={() => {
                    setSelectedCategory(null);
                    setSearchTerm("");
                  }}
                />
              </div>
            </details>
          </div>

          {filteredCompanions.length > 0 ? (
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
              {filteredCompanions.map((companion) => (
                <HomeVisitCompanionCard key={companion.id} companion={companion} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600">
              {homeVisitSafetyMessage}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
