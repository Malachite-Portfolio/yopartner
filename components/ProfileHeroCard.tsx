import { Star } from "lucide-react";
import type { ConnectCompanion } from "@/lib/data";

type ProfileHeroCardProps = {
  companion: ConnectCompanion;
};

const facts: Array<{ label: string; getValue: (companion: ConnectCompanion) => string | number | undefined | null }> = [
  { label: "Age", getValue: (companion) => (companion.age > 0 ? `${companion.age} Years` : "") },
  { label: "Gender", getValue: (companion) => companion.gender },
  { label: "Religion", getValue: (companion) => companion.religion },
  { label: "Born City", getValue: (companion) => companion.bornCity || companion.city },
  { label: "Nationality", getValue: (companion) => companion.nationality },
  { label: "College", getValue: (companion) => companion.college || companion.qualification },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function displayValue(value: string | number | undefined | null) {
  const text = String(value ?? "").trim();
  return text && text !== "0" ? text : "Not specified";
}

export function ProfileHeroCard({ companion }: ProfileHeroCardProps) {
  return (
    <section className="rounded-[22px] border border-[#e6e2eb] bg-white p-5 shadow-[0_10px_35px_rgba(43,31,63,0.07)] sm:p-7">
      <div className="grid gap-6 md:grid-cols-[210px_minmax(0,1fr)_120px] md:items-start">
        <div className="flex justify-center md:justify-start">
          {companion.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={companion.image}
              alt={companion.name}
              className="h-[176px] w-[176px] rounded-full border-4 border-white object-cover shadow-[0_16px_30px_rgba(33,25,50,0.18)]"
            />
          ) : (
            <span className="flex h-[176px] w-[176px] items-center justify-center rounded-full border-4 border-white bg-[#e6f7f2] text-4xl font-semibold text-[#0f766e] shadow-[0_16px_30px_rgba(33,25,50,0.14)]">
              {getInitials(companion.name)}
            </span>
          )}
        </div>

        <div className="min-w-0 text-center md:text-left">
          <h1 className="text-[32px] font-semibold leading-tight text-[#201a2f] sm:text-[36px]">{companion.name}</h1>
          {companion.tagline ? <p className="mt-1 text-xl font-semibold text-[#a45413]">{companion.tagline}</p> : null}
          <p className="mt-1 text-base text-[#7a6760]">{companion.category}</p>

          <div className="mt-5 grid gap-x-8 gap-y-4 border-t border-[#ece7ef] pt-4 sm:grid-cols-3">
            {facts.map((fact) => (
              <div key={fact.label}>
                <p className="text-sm font-semibold text-[#8490a4]">{fact.label}</p>
                <p className="mt-1 whitespace-pre-line text-[17px] leading-snug text-[#332d42]">
                  {displayValue(fact.getValue(companion))}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-fit rounded-xl border border-[#e7d7ff] bg-[#f5efff] px-5 py-3 text-center md:mx-0">
          <div className="flex items-center justify-center gap-1 text-[#ad5b08]">
            <Star size={20} fill="currentColor" strokeWidth={0} />
            <span className="text-xl font-semibold">{companion.rating.toFixed(1)}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-[#8a7e9b]">{companion.reviewsCount} reviews</p>
        </div>
      </div>
    </section>
  );
}
