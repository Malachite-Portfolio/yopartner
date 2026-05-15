"use client";

import { useEffect } from "react";
import { getCurrentFirebaseUser, subscribeFirebaseAuthState } from "@/lib/auth/firebasePhoneAuth";
import { useRouter } from "next/navigation";
import { fetchPartnerApprovalState, isPartnerApproved, isPartnerUnderReview } from "@/lib/partnerApproval";
import {
  isPartnerLoggedIn,
  isPartnerOnboardingComplete,
} from "@/lib/partnerAuth";

export default function PartnerEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const sync = async () => {
      const isLoggedIn = isPartnerLoggedIn() || Boolean(getCurrentFirebaseUser());
      if (!isLoggedIn) {
        router.replace("/partner/login");
        return;
      }
      if (!isPartnerOnboardingComplete()) {
        router.replace("/partner/onboarding");
        return;
      }
      const approvalState = await fetchPartnerApprovalState();
      if (isPartnerApproved(approvalState)) {
        router.replace("/partner/dashboard");
        return;
      }
      if (isPartnerUnderReview(approvalState)) {
        router.replace("/partner/application-status");
        return;
      }
      router.replace("/partner/onboarding");
    };

    void sync();
    const unsubscribe = subscribeFirebaseAuthState(() => {
      void sync();
    });

    return unsubscribe;
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm font-medium text-slate-600">Opening YoPartner Companion...</p>
    </div>
  );
}
