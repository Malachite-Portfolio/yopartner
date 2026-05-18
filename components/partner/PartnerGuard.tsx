"use client";

import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentFirebaseUser, subscribeFirebaseAuthState } from "@/lib/auth/firebasePhoneAuth";
import { resolvePartnerLandingRoute } from "@/lib/partnerApproval";
import { isPartnerLoggedIn } from "@/lib/partnerAuth";

type PartnerGuardProps = {
  children: React.ReactNode;
  requireOnboarding?: boolean;
};

export function PartnerGuard({ children, requireOnboarding = true }: PartnerGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const sync = async () => {
      const hasFirebaseUser = Boolean(getCurrentFirebaseUser());
      const hasPartnerSession = isPartnerLoggedIn() || hasFirebaseUser;
      if (!hasPartnerSession) {
        setHasAccess(false);
        setChecking(false);
        return;
      }

      if (!requireOnboarding) {
        setHasAccess(true);
        setChecking(false);
        return;
      }

      const landing = await resolvePartnerLandingRoute();
      if (landing.route === "/partner/onboarding") {
        setHasAccess(false);
        setChecking(false);
        router.replace("/partner/onboarding");
        return;
      }

      setHasAccess(true);
      setChecking(false);
    };

    void sync();
    const unsubscribe = subscribeFirebaseAuthState(() => {
      void sync();
    });

    return unsubscribe;
  }, [requireOnboarding, router]);

  useEffect(() => {
    if (checking) return;
    const hasFirebaseUser = Boolean(getCurrentFirebaseUser());
    const hasPartnerSession = isPartnerLoggedIn() || hasFirebaseUser;
    if (!hasPartnerSession) {
      router.replace("/partner/login");
    }
  }, [checking, router]);

  if (checking || !hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Checking partner access...</p>
      </div>
    );
  }

  return <>{children}</>;
}
