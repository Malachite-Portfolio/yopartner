import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, ShieldCheck, Star } from "lucide-react";
import { HomeVisitBookingFlow } from "@/components/HomeVisitBookingFlow";
import { getCompanionById } from "@/lib/api/companions";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { connectCompanions, homeVisitCompanions, type ConnectCompanion, type HomeVisitCompanion } from "@/lib/data";
import { HOME_VISIT_RATE_PER_HOUR } from "@/lib/platformPricing";
import { formatINR } from "@/lib/wallet";

type HomeVisitProfilePageProps = {
  params: Promise<{ id: string }>;
};

function toHomeVisitCompanion(companion: ConnectCompanion): HomeVisitCompanion {
  return {
    id: companion.id,
    name: companion.name,
    tagline: companion.tagline,
    image:
      companion.image ??
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    rating: companion.rating,
    experience: companion.experience,
    verified: true,
    price: HOME_VISIT_RATE_PER_HOUR,
    category: companion.category,
    services: companion.servicesOffered,
    city: companion.bornCity,
    connectProfileId: companion.id,
  };
}

function getHomeVisitSource() {
  const connectHomeVisitCompanions = connectCompanions
    .filter((companion) => companion.visitPrice > 0)
    .map(toHomeVisitCompanion);
  const byId = new Map<string, HomeVisitCompanion>();
  [...connectHomeVisitCompanions, ...homeVisitCompanions].forEach((item) => {
    byId.set(item.id, { ...item, price: HOME_VISIT_RATE_PER_HOUR });
  });
  return [...byId.values()];
}

export default async function HomeVisitProfilePage({ params }: HomeVisitProfilePageProps) {
  const { id } = await params;
  let companion = getHomeVisitSource().find((item) => item.id === id);
  if (IS_PRODUCTION_READY_MODE) {
    const response = await getCompanionById(id);
    if (response.data && (response.data.visitPrice ?? 0) > 0) {
      companion = {
        id: response.data.id,
        name: response.data.name,
        tagline: response.data.tagline,
        image: response.data.image ?? "/images/logo.png",
        rating: response.data.rating || 0,
        experience: response.data.experience || "Verified partner",
        verified: true,
        price: HOME_VISIT_RATE_PER_HOUR,
        category: response.data.category,
        services: response.data.servicesOffered,
        city: "India",
        connectProfileId: response.data.id,
      };
    } else {
      companion = undefined;
    }
  }

  if (!companion) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#fffdf8]">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-[#dceae5] bg-white p-4 shadow-sm shadow-teal-900/5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={companion.image}
              alt={companion.name}
              className="h-24 w-24 rounded-3xl border border-white object-cover shadow-sm"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">{companion.name}</h1>
                {companion.verified ? (
                  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <BadgeCheck size={14} />
                    Safety approved
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">{companion.tagline}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} />
                  {companion.city}
                </span>
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <Star size={14} fill="currentColor" />
                  <span className="font-semibold text-slate-900">{companion.rating.toFixed(1)}/5</span>
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#dceae5] bg-[#f7fbf8] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{companion.category}</p>
                </div>
                <div className="rounded-2xl border border-[#dceae5] bg-[#f7fbf8] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Home Visit price</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatINR(HOME_VISIT_RATE_PER_HOUR)} / hour</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-orange-200 bg-[#fff7ed] p-4">
            <p className="inline-flex items-center gap-1 text-sm font-semibold text-orange-800">
              <ShieldCheck size={15} />
              Home Visit safety rules
            </p>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
              <li>Strictly platonic in-person support</li>
              <li>Manual verification required before confirmation</li>
              <li>Platform payment only</li>
              <li>No outside contact or cash payment</li>
              <li>Safety support can review bookings</li>
            </ul>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <HomeVisitBookingFlow companion={companion} />
            {companion.connectProfileId ? (
              <Link
                href={`/connect-now/${companion.connectProfileId}`}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#dceae5] bg-white px-5 text-sm font-semibold text-slate-700"
              >
                View partner profile
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
