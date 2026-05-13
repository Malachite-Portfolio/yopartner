"use client";

import { useEffect } from "react";
import { getCurrentFirebaseUser, subscribeFirebaseAuthState } from "@/lib/auth/firebasePhoneAuth";
import { useRouter } from "next/navigation";
import { isPartnerLoggedIn, isPartnerOnboardingComplete } from "@/lib/partnerAuth";

export default function PartnerEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const sync = () => {
      const isLoggedIn = isPartnerLoggedIn() || Boolean(getCurrentFirebaseUser());
      if (!isLoggedIn) {
        router.replace("/partner/login");
        return;
      }
      if (!isPartnerOnboardingComplete()) {
        router.replace("/partner/onboarding");
        return;
      }
      router.replace("/partner/dashboard");
    };

    sync();
    const unsubscribe = subscribeFirebaseAuthState(() => {
      sync();
    });

    return unsubscribe;
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm font-medium text-slate-600">Opening YoPartner Companion...</p>
    </div>
  );
}
