"use client";

import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentFirebaseUser, subscribeFirebaseAuthState } from "@/lib/auth/firebasePhoneAuth";
import { isPartnerLoggedIn, isPartnerOnboardingComplete } from "@/lib/partnerAuth";

type PartnerGuardProps = {
  children: React.ReactNode;
  requireOnboarding?: boolean;
};

export function PartnerGuard({ children, requireOnboarding = true }: PartnerGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const sync = () => {
      const hasFirebaseUser = Boolean(getCurrentFirebaseUser());
      const hasPartnerSession = isPartnerLoggedIn() || hasFirebaseUser;
      setLoggedIn(hasPartnerSession);
      setOnboardingComplete(isPartnerOnboardingComplete());
      setChecking(false);
    };

    sync();
    const unsubscribe = subscribeFirebaseAuthState(() => {
      sync();
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (checking) return;
    if (!loggedIn) {
      router.replace("/partner/login");
      return;
    }
    if (requireOnboarding && !onboardingComplete) {
      router.replace("/partner/onboarding");
    }
  }, [checking, loggedIn, onboardingComplete, requireOnboarding, router]);

  if (checking || !loggedIn || (requireOnboarding && !onboardingComplete)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Checking partner access...</p>
      </div>
    );
  }

  return <>{children}</>;
}
