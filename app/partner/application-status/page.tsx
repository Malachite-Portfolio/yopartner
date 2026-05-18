"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isClientDemoEnabled, isClientDemoPartnerSessionActive } from "@/lib/clientDemoData";
import { getCurrentFirebaseUser } from "@/lib/auth/firebasePhoneAuth";
import {
  getPartnerProfile,
  isPartnerLoggedIn,
} from "@/lib/partnerAuth";
import {
  fetchPartnerApprovalState,
  getLocalPartnerApprovalState,
  getPartnerApprovalLabel,
  isPartnerApproved,
  isPartnerUnderReview,
  type PartnerApprovalState,
} from "@/lib/partnerApproval";
import { defaultPartnerProfile, type PartnerProfile } from "@/lib/partnerData";

function statusPill(label: string, tone: "amber" | "blue" | "green") {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
      {label}
    </span>
  );
}

export default function PartnerApplicationStatusPage() {
  const router = useRouter();
  const demoEnabled = isClientDemoEnabled();
  const isDemoSession = demoEnabled && isClientDemoPartnerSessionActive();
  const [approvalState, setApprovalState] = useState<PartnerApprovalState>(() => getLocalPartnerApprovalState());
  const profile = getPartnerProfile<PartnerProfile>(defaultPartnerProfile);

  useEffect(() => {
    const hasSession = isPartnerLoggedIn() || Boolean(getCurrentFirebaseUser());
    if (!hasSession) {
      router.replace("/partner/login");
      return;
    }
    void (async () => {
      const state = await fetchPartnerApprovalState();
      setApprovalState(state);
      if (!isPartnerApproved(state) && !isPartnerUnderReview(state)) {
        router.replace("/partner/onboarding");
      }
    })();
  }, [router]);

  const isApproved = isPartnerApproved(approvalState);
  const isUnderReview = isPartnerUnderReview(approvalState);
  const labels = getPartnerApprovalLabel(approvalState);

  return (
    <section className="min-h-screen bg-[#fffdf8] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-[#dceae5] bg-white p-6 shadow-sm sm:p-7">
        <h1 className="text-2xl font-semibold text-slate-900">Your profile is being reviewed by our safety team</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your profile is being reviewed by our safety team. You&apos;ll be able to start accepting requests after KYC verification and admin approval.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {statusPill(labels.kyc, isApproved ? "green" : "amber")}
          {statusPill(labels.review, isApproved ? "green" : "blue")}
        </div>

        <div className="mt-5 rounded-3xl border border-[#dceae5] bg-[#f7fbf8] p-4">
          <p className="text-sm font-semibold text-slate-900">Safety review checklist</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            <li>Profile details submitted</li>
            <li>Safety checklist accepted</li>
            <li>
              Verification documents {profile.selfieFileName || profile.aadhaarFileName || profile.panFileName ? "uploaded / pending review" : "pending upload"}
            </li>
            <li>{isApproved ? "KYC verified" : "KYC pending"}</li>
            <li>{isApproved ? "Admin approval completed" : "Admin approval required"}</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/partner/dashboard" className="rounded-full bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white">
            Go to overview
          </Link>
          <Link href="/partner/onboarding?edit=true" className="rounded-full border border-[#dceae5] px-4 py-2 text-sm font-semibold text-slate-700">
            Edit Profile
          </Link>
        </div>

        {!isApproved && isUnderReview ? (
          <p className="mt-4 text-xs text-slate-500">
            Your profile is still under review. Admin approval is required before you can accept requests.
          </p>
        ) : null}

        {demoEnabled && isDemoSession ? (
          <p className="mt-4 text-xs text-slate-500">Demo mode can still show an active dashboard preview.</p>
        ) : null}
      </div>
    </section>
  );
}
