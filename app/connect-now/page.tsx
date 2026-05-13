"use client";

import { useEffect, useMemo, useState } from "react";
import { listCompanions } from "@/lib/api/companions";
import { ConnectAppHeader } from "@/components/ConnectAppHeader";
import { ConnectCompanionCard } from "@/components/ConnectCompanionCard";
import { connectCategoryGroups, ConnectFilters } from "@/components/ConnectFilters";
import { ConnectTabs, type ConnectServiceTab } from "@/components/ConnectTabs";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { connectCompanions } from "@/lib/data";

const allCategoryItems = connectCategoryGroups.flatMap((group) => group.items);

export default function ConnectNowPage() {
  const [selectedTab, setSelectedTab] = useState<ConnectServiceTab>("Chat");
  const [searchTerm, setSearchTerm] = useState("");
  const [availability, setAvailability] = useState<"all" | "online">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [companions, setCompanions] = useState(connectCompanions);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (!IS_PRODUCTION_READY_MODE) return;
    void (async () => {
      const response = await listCompanions();
      if (response.error) {
        setApiError("Companions are currently unavailable. Please try again later.");
        setCompanions([]);
        return;
      }
      setCompanions(response.data as typeof connectCompanions);
      setApiError("");
    })();
  }, []);

  const filteredCompanions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return companions.filter((companion) => {
      if (availability === "online" && !companion.online) return false;

      if (selectedTab === "Video Call" && typeof companion.videoPrice !== "number") return false;

      if (selectedCategory) {
        const inServices = companion.servicesOffered.some((service) =>
          service.toLowerCase().includes(selectedCategory.toLowerCase()),
        );
        if (!inServices) return false;
      }

      if (!term) return true;
      const haystack = `${companion.name} ${companion.tagline} ${companion.category}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [availability, companions, searchTerm, selectedCategory, selectedTab]);

  const handleClearAll = () => {
    setSelectedTab("Chat");
    setSearchTerm("");
    setAvailability("all");
    setSelectedCategory(null);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <ConnectAppHeader />

      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1900px]">
        <aside className="hidden w-[330px] shrink-0 border-r border-slate-200 bg-white lg:block">
          <ConnectFilters
            selectedAvailability={availability}
            selectedCategory={selectedCategory}
            onAvailabilityChange={setAvailability}
            onCategoryChange={(value) =>
              setSelectedCategory((current) => (current === value ? null : value))
            }
            onClearAll={handleClearAll}
          />
        </aside>

        <section className="min-w-0 flex-1">
          <ConnectTabs
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
          />

          <div className="p-4 sm:p-5 lg:p-6">
            <div className="mb-4 lg:hidden">
              <details className="rounded-xl border border-slate-200 bg-white" open>
                <summary className="cursor-pointer px-4 py-3 text-[15px] font-semibold text-slate-900">
                  Filters
                </summary>
                <div className="border-t border-slate-200">
                  <ConnectFilters
                    mobile
                    selectedAvailability={availability}
                    selectedCategory={selectedCategory}
                    onAvailabilityChange={setAvailability}
                    onCategoryChange={(value) =>
                      setSelectedCategory((current) => (current === value ? null : value))
                    }
                    onClearAll={handleClearAll}
                  />
                </div>
              </details>
            </div>

            {selectedCategory && !allCategoryItems.includes(selectedCategory) ? (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Selected category not found. Please clear filters.
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
              {filteredCompanions.map((companion) => (
                <ConnectCompanionCard key={companion.id} companion={companion} />
              ))}
            </div>

            {apiError ? (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-8 text-center text-sm text-amber-700">
                {apiError}
              </div>
            ) : null}

            {filteredCompanions.length === 0 ? (
              <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
                No companions matched your current search or filters.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
