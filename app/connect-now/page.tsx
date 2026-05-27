"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ConnectCompanionCard } from "@/components/ConnectCompanionCard";
import { ConnectFilters } from "@/components/ConnectFilters";
import { ConnectTabs, type ConnectServiceTab } from "@/components/ConnectTabs";
import { listCompanions } from "@/lib/api/companions";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { connectCompanions } from "@/lib/data";

function safeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hasHomeVisitService(companion: { servicesOffered?: unknown; visitPrice?: unknown; homeVisitPrice?: unknown }) {
  const services = safeStringArray(companion.servicesOffered);
  const visitPrice = safeNumber(companion.homeVisitPrice) ?? safeNumber(companion.visitPrice);
  return (
    services.some((service) => ["home visit", "home_visit"].includes(service.trim().toLowerCase())) ||
    (typeof visitPrice === "number" && visitPrice > 0)
  );
}

export default function ConnectNowPage() {
  const [selectedTab, setSelectedTab] = useState<ConnectServiceTab>("Chat");
  const [searchTerm, setSearchTerm] = useState("");
  const [availability, setAvailability] = useState<"all" | "online">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [companions, setCompanions] = useState(() => (IS_PRODUCTION_READY_MODE ? [] : connectCompanions));
  const [isLoadingCompanions, setIsLoadingCompanions] = useState(IS_PRODUCTION_READY_MODE);
  const [apiError, setApiError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!IS_PRODUCTION_READY_MODE) return;
    let cancelled = false;

    const fetchCompanions = async () => {
      const response = await listCompanions();
      if (cancelled) return;

      if (response.error) {
        setApiError("Verified listeners are currently unavailable. Please try again shortly.");
        setCompanions([]);
        setIsLoadingCompanions(false);
        return;
      }

      setCompanions(response.data as unknown as typeof connectCompanions);
      setApiError("");
      setIsLoadingCompanions(false);
    };

    void fetchCompanions();
    const timer = window.setInterval(() => {
      void fetchCompanions();
    }, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const filteredCompanions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return companions.filter((companion) => {
      const services = safeStringArray(companion.servicesOffered);
      const languages = safeStringArray(companion.languages);
      const category = safeText(companion.category);
      const tagline = safeText(companion.tagline);
      const name = safeText(companion.name, "Verified Companion");
      const videoPrice = safeNumber(companion.videoPrice);

      if (availability === "online" && !Boolean(companion.online)) return false;
      if (selectedTab === "Video Call" && typeof videoPrice !== "number") return false;
      if ((selectedTab as string) === "Home Visit" && !hasHomeVisitService(companion)) return false;

      if (selectedCategory) {
        const selected = selectedCategory.toLowerCase();
        const inServices = services.some((service) => service.toLowerCase().includes(selected));
        const inLanguages = languages.some((language) => language.toLowerCase().includes(selected));
        const inProfile = `${category} ${tagline}`.toLowerCase().includes(selected);
        const inHomeVisit = selected === "home visit" && hasHomeVisitService(companion);

        if (!inServices && !inLanguages && !inProfile && !inHomeVisit) return false;
        if (selected === "home visit" && !inHomeVisit) return false;
      }

      if (!term) return true;

      const haystack = `${name} ${tagline} ${category} ${languages.join(" ")} ${services.join(" ")}`.toLowerCase();
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
    <main className="min-h-screen bg-[#eceff3]">
      <div className="mx-auto flex w-full max-w-[1560px] gap-0">
        <aside className="hidden w-[336px] shrink-0 border-r border-[#b9c6cd] lg:block">
          <div className="sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
            <ConnectFilters
              selectedAvailability={availability}
              selectedCategory={selectedCategory}
              onAvailabilityChange={setAvailability}
              onCategoryChange={(value) => setSelectedCategory((current) => (current === value ? null : value))}
              onClearAll={handleClearAll}
            />
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <ConnectTabs
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
          />

          <div className="px-4 pb-8 sm:px-6 lg:px-8">
            <div className="mb-4 lg:hidden">
              <button
                type="button"
                onClick={() => setFiltersOpen((current) => !current)}
                className="flex h-11 w-full items-center justify-between rounded-2xl border border-[#bac6cc] bg-[#eef2f5] px-4 text-sm font-semibold text-[#1b2a36]"
              >
                Filters
                <span className="text-xs text-[#5c6874]">{filtersOpen ? "Hide" : "Show"}</span>
              </button>
              {filtersOpen ? (
                <div className="mt-3">
                  <ConnectFilters
                    mobile
                    selectedAvailability={availability}
                    selectedCategory={selectedCategory}
                    onAvailabilityChange={setAvailability}
                    onCategoryChange={(value) => setSelectedCategory((current) => (current === value ? null : value))}
                    onClearAll={handleClearAll}
                  />
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCompanions.map((companion) => (
                <ConnectCompanionCard key={companion.id} companion={companion} />
              ))}
            </div>

            {apiError ? (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-8 text-center text-sm text-amber-700">
                {apiError}
              </div>
            ) : null}

            {filteredCompanions.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-[#c9d3da] bg-[#f5f7fa] px-4 py-10 text-center text-sm text-[#4f5f6d]">
                {isLoadingCompanions
                  ? "Finding verified listeners..."
                  : IS_PRODUCTION_READY_MODE
                    ? "No listeners are available right now. Please check back soon."
                    : "No listeners matched your current filters."}
              </div>
            ) : null}

            <div className="mt-7 rounded-[20px] border border-[#e4c294] bg-[#f6eee2] p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#946106] shadow-sm">
                  <ShieldCheck size={24} />
                </span>
                <div>
                  <h3 className="text-2xl font-semibold text-[#8a5300] md:text-[28px]">Safety first, always</h3>
                  <p className="mt-1.5 max-w-4xl text-[14px] leading-relaxed text-[#2b3744] md:text-[15px]">
                    We prioritize your mental well-being and security. Every conversation is private, and our listeners go through
                    a strict vetting process to ensure you get the best support possible.
                  </p>
                  <Link href="/trust-safety" className="mt-1.5 inline-flex text-[14px] font-semibold text-[#5b2dd6] md:text-[15px]">
                    Learn more about our safety protocols.
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
