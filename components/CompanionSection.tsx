"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CompanionCard } from "@/components/CompanionCard";
import { ConnectCompanionCard } from "@/components/ConnectCompanionCard";
import { SectionHeader } from "@/components/SectionHeader";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { companions, connectCompanions, type CompanionFilter } from "@/lib/data";

const filters: ("All" | CompanionFilter)[] = ["All", "Chat", "Calls", "Activities"];

type CompanionSectionProps = {
  showHeader?: boolean;
  note?: string;
  variant?: "classic" | "compact";
};

export function CompanionSection({ showHeader = true, note, variant = "classic" }: CompanionSectionProps) {
  const isCompact = variant === "compact";
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | CompanionFilter>("All");

  const filteredConnectCompanions = useMemo(() => {
    if (IS_PRODUCTION_READY_MODE) return [];
    const term = searchTerm.trim().toLowerCase();
    return connectCompanions.filter((companion) => {
      if (activeFilter === "Calls" && !(companion.voicePrice > 0 || companion.videoPrice)) return false;
      if (activeFilter === "Activities") {
        const activitySignals = ["activity", "event", "walk", "travel", "shopping"];
        const text = `${companion.category} ${companion.servicesOffered.join(" ")}`.toLowerCase();
        if (!activitySignals.some((signal) => text.includes(signal))) return false;
      }

      if (!term) return true;
      const haystack = `${companion.name} ${companion.tagline} ${companion.category}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [activeFilter, searchTerm]);

  const filteredClassicCompanions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return companions.filter((companion) => {
      if (activeFilter !== "All" && !companion.focus.includes(activeFilter)) return false;
      if (!term) return true;
      const haystack = `${companion.name} ${companion.city} ${companion.bio}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [activeFilter, searchTerm]);

  return (
    <section id="companions" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {showHeader && <SectionHeader eyebrow="Verified Companions" title="Find the right companion for your day" />}

      <div className="yp-hover-soft mt-8 rounded-2xl border border-line bg-surface p-4 shadow-[0_6px_18px_rgba(24,86,115,0.08)] sm:p-5">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, city, or interest"
            className="w-full rounded-xl border border-line bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeFilter === filter
                  ? "bg-brand text-white"
                  : "border border-brand/25 text-brand hover:bg-brand-soft"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {note && <p className="mt-5 text-sm text-muted">{note}</p>}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {isCompact
          ? filteredConnectCompanions.map((companion) => (
              <ConnectCompanionCard key={companion.id} companion={companion} />
            ))
          : filteredClassicCompanions.map((companion) => (
              <CompanionCard key={companion.id} companion={companion} />
            ))}
      </div>

      {isCompact && filteredConnectCompanions.length === 0 ? (
        <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
          {IS_PRODUCTION_READY_MODE
            ? "Companions are currently unavailable. Please try again later."
            : "No companions matched your search."}
        </p>
      ) : null}
    </section>
  );
}
