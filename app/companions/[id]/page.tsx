import { BadgeCheck, Clock3, Languages, MapPin, ShieldCheck, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { companions } from "@/lib/data";

type CompanionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CompanionDetailPage({ params }: CompanionDetailPageProps) {
  const { id } = await params;
  const companionId = Number(id);

  if (Number.isNaN(companionId)) {
    notFound();
  }

  const companion = companions.find((item) => item.id === companionId);

  if (!companion) {
    notFound();
  }

  return (
    <>
      <PageHero
        eyebrow="Verified Profile"
        title={companion.name}
        subtitle="Trusted, strictly platonic companionship with clear boundaries and a safety-first experience."
      />

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="rounded-2xl border border-line bg-surface p-5 shadow-[0_8px_20px_rgba(24,86,115,0.12)]">
            <div className="h-64 rounded-2xl bg-gradient-to-br from-brand-secondary/70 via-brand/80 to-brand-purple/80" />
            <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              <BadgeCheck size={14} />
              Verified companion
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted">
              <p className="inline-flex items-center gap-2">
                <MapPin size={15} />
                {companion.city}
              </p>
              <p className="inline-flex items-center gap-2">
                <Star size={15} className="fill-current text-brand" />
                {companion.rating.toFixed(1)} average rating
              </p>
              <p className="inline-flex items-center gap-2">
                <Clock3 size={15} />
                {companion.availability}
              </p>
              <p className="inline-flex items-center gap-2">
                <Languages size={15} />
                {companion.languages.join(", ")}
              </p>
            </div>
          </aside>

          <div className="space-y-6">
            <article className="rounded-2xl border border-line bg-surface p-6 shadow-[0_8px_20px_rgba(24,86,115,0.12)]">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">{companion.name}</h1>
              <p className="mt-1 text-sm font-semibold text-brand">{companion.price}</p>
              <p className="mt-4 text-sm leading-7 text-muted">{companion.longBio}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {companion.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-brand/20 bg-brand-soft/65 px-2.5 py-1 text-xs font-medium text-brand"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-full bg-gradient-to-r from-brand to-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                  Book Session
                </button>
                <button className="rounded-full border border-brand/30 px-6 py-3 text-sm font-semibold text-brand transition hover:bg-brand-soft">
                  Start Chat
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-line bg-surface p-6 shadow-[0_8px_20px_rgba(24,86,115,0.12)]">
              <h2 className="text-xl font-semibold text-foreground">Available support types</h2>
              <ul className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
                {companion.supportTypes.map((supportType) => (
                  <li key={supportType} className="rounded-xl border border-line bg-background px-3 py-2">
                    {supportType}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-line bg-surface p-6 shadow-[0_8px_20px_rgba(24,86,115,0.12)]">
              <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
                <ShieldCheck size={18} className="text-brand" />
                Safety and verification highlights
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {companion.verification.map((item) => (
                  <li key={item} className="rounded-xl border border-line bg-background px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}



