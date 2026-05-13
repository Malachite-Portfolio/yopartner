"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ConnectAppHeader } from "@/components/ConnectAppHeader";
import { HomeVisitCompanionCard } from "@/components/HomeVisitCompanionCard";
import { homeVisitCategoryGroups, HomeVisitFilters } from "@/components/HomeVisitFilters";
import { homeVisitCompanions } from "@/lib/data";

const allHomeVisitCategoryItems = homeVisitCategoryGroups.flatMap((group) => group.items);

export default function HomeVisitPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCompanions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return homeVisitCompanions.filter((companion) => {
      if (selectedCategory) {
        const inServices = companion.services.some((service) =>
          service.toLowerCase().includes(selectedCategory.toLowerCase()),
        );
        if (!inServices) return false;
      }

      if (!term) return true;
      const haystack = `${companion.name} ${companion.tagline} ${companion.city}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [searchTerm, selectedCategory]);

  const clearAll = () => {
    setSearchTerm("");
    setSelectedCategory(null);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <ConnectAppHeader />

      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1900px]">
        <aside className="hidden w-[330px] shrink-0 border-r border-slate-200 bg-white lg:block">
          <HomeVisitFilters
            selectedCategory={selectedCategory}
            onCategoryChange={(value) => setSelectedCategory((current) => (current === value ? null : value))}
            onClearAll={clearAll}
          />
        </aside>

        <section className="min-w-0 flex-1">
          <div className="flex min-h-[78px] flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:py-0">
            <h1 className="text-[28px] font-semibold text-slate-900">Home Visit Companions</h1>
            <label className="relative block w-full lg:w-[312px]">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search"
                className="h-12 w-full rounded-[10px] border border-[#dfe5ec] bg-white pl-10 pr-3 text-[15px] outline-none transition focus:border-[#2563EB]"
              />
            </label>
          </div>

          <div className="p-4 sm:p-5 lg:p-6">
            <div className="mb-4 lg:hidden">
              <details className="rounded-xl border border-slate-200 bg-white" open>
                <summary className="cursor-pointer px-4 py-3 text-[15px] font-semibold text-slate-900">
                  Filters
                </summary>
                <div className="border-t border-slate-200">
                  <HomeVisitFilters
                    mobile
                    selectedCategory={selectedCategory}
                    onCategoryChange={(value) => setSelectedCategory((current) => (current === value ? null : value))}
                    onClearAll={clearAll}
                  />
                </div>
              </details>
            </div>

            {selectedCategory && !allHomeVisitCategoryItems.includes(selectedCategory) ? (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Selected category not found. Please clear filters.
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
              {filteredCompanions.map((companion) => (
                <HomeVisitCompanionCard key={companion.id} companion={companion} />
              ))}
            </div>

            {filteredCompanions.length === 0 ? (
              <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
                No home visit companions matched your search or filters.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
