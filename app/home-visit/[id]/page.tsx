import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, ShieldCheck } from "lucide-react";
import { ConnectAppHeader } from "@/components/ConnectAppHeader";
import {
  getClientDemoHomeVisitCompanions,
  isClientDemoEnabled,
} from "@/lib/clientDemoData";
import { homeVisitCompanions } from "@/lib/data";

const homeVisitSafetyMessage =
  "Home Visit is available only for verified companions. Please contact support to enable this service.";

type HomeVisitProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function HomeVisitProfilePage({ params }: HomeVisitProfilePageProps) {
  const { id } = await params;
  const source = [
    ...homeVisitCompanions,
    ...(isClientDemoEnabled() ? getClientDemoHomeVisitCompanions() : []),
  ];
  const companion = source.find((item) => item.id === id);

  if (!companion) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb]">
      <ConnectAppHeader />
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={companion.image}
              alt={companion.name}
              className="h-24 w-24 rounded-full border border-white object-cover shadow-sm"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-slate-900">{companion.name}</h1>
                {companion.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    <BadgeCheck size={14} />
                    Verified for in-person support
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-600">{companion.tagline}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-600">
                <MapPin size={14} />
                {companion.city}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{companion.category}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Home Visit Price</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">₹{companion.price}/session</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800">
              <ShieldCheck size={15} />
              Strictly platonic safety policy
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              {homeVisitSafetyMessage}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {companion.connectProfileId ? (
              <Link
                href={`/connect-now/${companion.connectProfileId}`}
                className="inline-flex h-11 items-center rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white"
              >
                View Companion Profile
              </Link>
            ) : null}
            <Link
              href="/support"
              className="inline-flex h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700"
            >
              Contact Support
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
