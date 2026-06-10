"use client";

import { useEffect } from "react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PARTNER_FIREBASE_TOKEN_KEY, subscribeFirebaseAuthState } from "@/lib/auth/firebasePhoneAuth";
import { resolvePartnerLandingRoute } from "@/lib/partnerApproval";
import { isPartnerLoggedIn } from "@/lib/partnerAuth";

type PartnerGuardProps = {
  children: React.ReactNode;
  requireOnboarding?: boolean;
};

export function PartnerGuard({ children, requireOnboarding = true }: PartnerGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const hasPartnerToken = () =>
      typeof window !== "undefined" &&
      Boolean(window.localStorage.getItem(PARTNER_FIREBASE_TOKEN_KEY)?.trim());

    const sync = async () => {
      const hasPartnerSession = isPartnerLoggedIn() || hasPartnerToken();
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
      const canAccessProfileWhilePending =
        pathname === "/partner/profile" &&
        (landing.route === "/partner/application-status" || landing.route === "/partner/onboarding");

      if (landing.route !== "/partner/dashboard" && !canAccessProfileWhilePending) {
        setHasAccess(false);
        setChecking(false);
        router.replace(landing.route);
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
  }, [pathname, requireOnboarding, router]);

  useEffect(() => {
    if (checking) return;
    const hasPartnerSession =
      isPartnerLoggedIn() ||
      (typeof window !== "undefined" && Boolean(window.localStorage.getItem(PARTNER_FIREBASE_TOKEN_KEY)?.trim()));
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
