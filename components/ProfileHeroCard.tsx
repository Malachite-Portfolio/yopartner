import { BadgeCheck, Star } from "lucide-react";
import type { ConnectCompanion } from "@/lib/data";

type ProfileHeroCardProps = {
  companion: ConnectCompanion;
};

const factRows: Array<{ label: string; key: keyof ConnectCompanion }> = [
  { label: "Age", key: "age" },
  { label: "Gender", key: "gender" },
  { label: "Religion", key: "religion" },
  { label: "Born City", key: "bornCity" },
  { label: "Nationality", key: "nationality" },
  { label: "College", key: "college" },
  { label: "Qualification", key: "qualification" },
  { label: "Languages Known", key: "languages" },
  { label: "Communication Style", key: "communicationStyle" },
  { label: "Hobbies", key: "hobbies" },
];

export function ProfileHeroCard({ companion }: ProfileHeroCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-52 bg-gradient-to-r from-[#0f172a] via-[#211637] to-[#3b1e52] p-6 text-white md:h-56 md:p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">YoPartner Profile</p>
        <h1 className="mt-2 max-w-[560px] text-3xl font-semibold leading-[1.08] md:text-[42px]">
          Conversations without judgment.
        </h1>
        <div className="pointer-events-none absolute right-6 top-6 h-24 w-24 rounded-full border border-white/20 md:h-28 md:w-28" />
        <div className="pointer-events-none absolute bottom-4 right-20 h-16 w-16 rounded-full border border-cyan-300/30 md:h-20 md:w-20" />
      </div>

      <div className="relative px-5 pb-5 pt-0 md:px-6 md:pb-6">
        <div className="-mt-14 flex flex-wrap gap-4 md:-mt-[60px]">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={companion.image}
              alt={companion.name}
              className="h-[116px] w-[116px] rounded-full border-4 border-white object-cover shadow-sm md:h-[124px] md:w-[124px]"
            />
            {companion.online && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
                Online
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 sm:min-w-[260px] md:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 md:text-[28px]">{companion.name}</h2>
                <p className="break-words text-base text-slate-600 md:text-[17px]">{companion.tagline}</p>
                <p className="mt-1 text-xs font-medium text-slate-500 md:text-sm">{companion.category}</p>
              </div>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <BadgeCheck size={13} />
                  Verified
                </span>
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs">
                  <div className="flex items-center gap-1 text-[#F5BF1B]">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} size={13} fill="currentColor" />
                    ))}
                  </div>
                  <p className="mt-1 font-semibold text-slate-900">{companion.rating.toFixed(1)} / 5</p>
                  <p className="text-[11px] text-slate-500">{companion.reviewsCount} reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          {factRows.map((row, index) => {
            const value = companion[row.key];
            const formatted = Array.isArray(value) ? value.join(", ") : String(value);

            return (
              <div
                key={row.label}
                className={`grid gap-1.5 px-3.5 py-2.5 text-[13px] sm:grid-cols-[190px_1fr] ${
                  index !== factRows.length - 1 ? "border-b border-slate-200" : ""
                }`}
              >
                <p className="font-semibold text-slate-600">{row.label}</p>
                <p className="break-words text-slate-900">{formatted}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
