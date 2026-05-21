"use client";

import { useEffect } from "react";
import { PARTNER_FIREBASE_TOKEN_KEY, subscribeFirebaseAuthState } from "@/lib/auth/firebasePhoneAuth";
import { useRouter } from "next/navigation";
import { resolvePartnerLandingRoute } from "@/lib/partnerApproval";
import {
  isPartnerLoggedIn,
} from "@/lib/partnerAuth";

export default function PartnerEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const hasPartnerToken = () =>
      typeof window !== "undefined" &&
      Boolean(window.localStorage.getItem(PARTNER_FIREBASE_TOKEN_KEY)?.trim());

    const sync = async () => {
      const isLoggedIn = isPartnerLoggedIn() || hasPartnerToken();
      if (!isLoggedIn) {
        router.replace("/partner/login");
        return;
      }
      const landing = await resolvePartnerLandingRoute();
      router.replace(landing.route);
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
