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
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    <main className="min-h-screen bg-[#fffdf8]">
      <ConnectAppHeader />

      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1500px]">
        <aside className="hidden w-[260px] shrink-0 border-r border-[#dceae5] bg-[#fffdf8] lg:block">
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
          <div className="rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm shadow-teal-900/5 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f766e]">Home Visit</p>
            <h1 className="mt-1 text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              Verified in-person support
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Verified in-person companionship for everyday support. Available only after verification and platform approval.
            </p>
            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
              {homeVisitSafetyMessage}
            </p>

            <label className="mt-4 block">
              <span className="sr-only">Search Home Visit companions</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, city, or category"
                className="h-12 w-full rounded-2xl border border-[#dceae5] px-3 text-sm outline-none focus:border-[#0f766e]"
              />
            </label>
          </div>

          <div className="mb-4 mt-4 space-y-3 lg:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-[#dceae5] bg-white px-4 text-[15px] font-semibold text-slate-900"
            >
                Filters
              <span className="text-xs text-slate-500">{filtersOpen ? "Hide" : "Show"}</span>
            </button>
            {filtersOpen ? (
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
            ) : null}
          </div>

          {filteredCompanions.length > 0 ? (
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCompanions.map((companion) => (
                <HomeVisitCompanionCard key={companion.id} companion={companion} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#dceae5] bg-white px-4 py-10 text-center text-sm text-slate-600">
              {homeVisitSafetyMessage}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
