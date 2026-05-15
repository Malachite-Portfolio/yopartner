"use client";

import Link from "next/link";
import { isClientDemoEnabled, isClientDemoPartnerSessionActive } from "@/lib/clientDemoData";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { getPartnerApprovalLabel, getLocalPartnerApprovalState, isPartnerApproved } from "@/lib/partnerApproval";
import { getPartnerProfile } from "@/lib/partnerAuth";
import { defaultPartnerProfile, type PartnerProfile } from "@/lib/partnerData";

export default function PartnerProfilePage() {
  const demoEnabled = isClientDemoEnabled();
  const isDemoSession = isClientDemoPartnerSessionActive();

  if (IS_PRODUCTION_READY_MODE && !isDemoSession) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-xl font-semibold text-amber-800">Partner profile is unavailable</h2>
        <p className="mt-2 text-sm text-amber-700">Partner profile service is not connected yet.</p>
      </section>
    );
  }

  const profile = getPartnerProfile<PartnerProfile>(defaultPartnerProfile);
  const approvalState = getLocalPartnerApprovalState();
  const isApproved = isPartnerApproved(approvalState);
  const labels = getPartnerApprovalLabel(approvalState);

  const rows = [
    ["Name", profile.fullName],
    ["Age", profile.age],
    ["Gender", profile.gender],
    ["Religion", profile.religion],
    ["Born City", profile.bornCity],
    ["Nationality", profile.nationality],
    ["School", profile.school],
    ["College", profile.college],
    ["Qualification", profile.qualification],
    ["Languages Known", profile.languagesKnown.join(", ")],
    ["Communication Style", profile.communicationStyle.join(", ")],
    ["Hobbies", profile.hobbies.join(", ")],
    ["Profile Tagline", profile.profileTagline],
    ["About Yourself", profile.aboutYourself],
    ["Services Offered", profile.servicesOffered.join(", ")],
    [
      "Pricing",
      `Chat ${profile.chatPricePerMinute || "0"}/min • Audio ${profile.audioPricePerMinute || "0"}/min • Video ${profile.videoPricePerMinute || "0"}/min`,
    ],
    ["Categories", profile.categories.join(", ")],
  ] as const;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
        {demoEnabled && isDemoSession ? (
          <p className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            Client Demo • Preview Mode
          </p>
        ) : null}
        <Link
          href="/partner/onboarding?edit=true"
          className="rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white"
        >
          Edit Profile
        </Link>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-500">Review Status</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                isApproved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {labels.kyc}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                isApproved ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
              }`}
            >
              {labels.review}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className={label === "About Yourself" ? "sm:col-span-2" : ""}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
              <p className="mt-0.5 text-sm text-slate-800">{value || "-"}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
