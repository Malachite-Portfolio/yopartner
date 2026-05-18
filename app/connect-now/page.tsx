"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listCompanions } from "@/lib/api/companions";
import { ConnectAppHeader } from "@/components/ConnectAppHeader";
import { ConnectCompanionCard } from "@/components/ConnectCompanionCard";
import { ConnectFilters } from "@/components/ConnectFilters";
import { ConnectTabs, type ConnectServiceTab } from "@/components/ConnectTabs";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { connectCompanions } from "@/lib/data";
import { demoHosts, isClientDemoEnabled } from "@/lib/clientDemoData";

export default function ConnectNowPage() {
  const [selectedTab, setSelectedTab] = useState<ConnectServiceTab>("Chat");
  const [searchTerm, setSearchTerm] = useState("");
  const [availability, setAvailability] = useState<"all" | "online">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [companions, setCompanions] = useState(() => (IS_PRODUCTION_READY_MODE ? [] : connectCompanions));
  const [isLoadingCompanions, setIsLoadingCompanions] = useState(IS_PRODUCTION_READY_MODE);
  const [apiError, setApiError] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!IS_PRODUCTION_READY_MODE) return;
    void (async () => {
      const response = await listCompanions();
      if (response.error) {
        if (isClientDemoEnabled()) {
          setCompanions(demoHosts);
          setApiError("");
          setIsPreviewMode(true);
          setIsLoadingCompanions(false);
          return;
        }
        setApiError("Verified companions are currently unavailable. Please try again later.");
        setCompanions([]);
        setIsLoadingCompanions(false);
        return;
      }
      if (response.data.length === 0 && isClientDemoEnabled()) {
        setCompanions(demoHosts);
        setApiError("");
        setIsPreviewMode(true);
        setIsLoadingCompanions(false);
        return;
      }
      setCompanions(response.data as typeof connectCompanions);
      setIsPreviewMode(false);
      setApiError("");
      setIsLoadingCompanions(false);
    })();
  }, []);

  const filteredCompanions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return companions.filter((companion) => {
      if (availability === "online" && !companion.online) return false;
      if (selectedTab === "Video Call" && typeof companion.videoPrice !== "number") return false;

      if (selectedCategory) {
        const selected = selectedCategory.toLowerCase();
        const inServices = companion.servicesOffered.some((service) => service.toLowerCase().includes(selected));
        const inLanguages = companion.languages.some((language) => language.toLowerCase().includes(selected));
        const inProfile = `${companion.category} ${companion.tagline}`.toLowerCase().includes(selected);
        if (!inServices && !inLanguages && !inProfile) return false;
      }

      if (!term) return true;
      const haystack = `${companion.name} ${companion.tagline} ${companion.category} ${companion.languages.join(" ")}`.toLowerCase();
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
    <main className="min-h-screen bg-[#fffdf8]">
      <ConnectAppHeader />

      <div className="border-b border-[#dceae5] bg-[#f7fbf8]">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase text-[#0f766e]">Find Support</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
            Who would you like to talk to today?
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Choose a verified companion based on mood, language, and comfort. Real conversations. No judgment.
          </p>
        </div>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1500px]">
        <aside className="hidden w-[260px] shrink-0 border-r border-[#dceae5] bg-[#fffdf8] lg:block">
          <ConnectFilters
            selectedAvailability={availability}
            selectedCategory={selectedCategory}
            onAvailabilityChange={setAvailability}
            onCategoryChange={(value) => setSelectedCategory((current) => (current === value ? null : value))}
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
            <div className="mb-4 space-y-3 lg:hidden">
              <button
                type="button"
                onClick={() => setFiltersOpen((current) => !current)}
                className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-[#dceae5] bg-white px-4 text-[15px] font-semibold text-slate-900"
              >
                Filters
                <span className="text-xs text-slate-500">{filtersOpen ? "Hide" : "Show"}</span>
              </button>
              {filtersOpen ? (
                  <ConnectFilters
                    mobile
                    selectedAvailability={availability}
                    selectedCategory={selectedCategory}
                    onAvailabilityChange={setAvailability}
                    onCategoryChange={(value) => setSelectedCategory((current) => (current === value ? null : value))}
                    onClearAll={handleClearAll}
                  />
              ) : null}
            </div>

            <div className="mb-4 rounded-3xl border border-orange-200 bg-[#fff7ed] px-4 py-3 text-sm text-slate-700 sm:px-5 sm:py-4">
              <p className="font-semibold text-slate-950">Home Visit is safety-gated</p>
              <p className="mt-1">
                Verified in-person support is available only after manual safety approval. Platform rules apply.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Strictly platonic | Platform-protected payments | No outside contact sharing
              </p>
              <Link href="/home-visit" className="mt-2 inline-flex text-sm font-semibold text-[#0f766e]">
                Learn about safe Home Visit
              </Link>
            </div>

            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCompanions.map((companion) => (
                <ConnectCompanionCard key={companion.id} companion={companion} />
              ))}
            </div>

            {isPreviewMode ? (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#dceae5] bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                <span>Demo mode enabled</span>
                <span className="text-slate-400">local preview</span>
              </p>
            ) : null}

            {apiError ? (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-8 text-center text-sm text-amber-700">
                {apiError}
              </div>
            ) : null}

            {filteredCompanions.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-[#dceae5] bg-white px-4 py-10 text-center text-sm text-slate-600">
                {isLoadingCompanions
                  ? "Finding verified companions..."
                  : IS_PRODUCTION_READY_MODE
                    ? "No verified companions are available right now. Please check back soon."
                    : "No companions matched your current mood, language, or listener style."}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
