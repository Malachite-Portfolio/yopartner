"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutPartnerAuthSession } from "@/lib/auth/logout";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import {
  getPartnerOnlineStatus,
  setPartnerOnlineStatus,
  subscribePartnerOnlineStatus,
} from "@/lib/partnerAuth";
import { defaultPartnerSettings, getPartnerSettings, savePartnerSettings, type PartnerSettings } from "@/lib/partnerData";

type ToggleRowProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
    >
      {label}
      <span className={value ? "text-emerald-600 font-semibold" : "text-slate-500"}>
        {value ? "On" : "Off"}
      </span>
    </button>
  );
}

export default function PartnerSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<PartnerSettings>(() => ({
    ...defaultPartnerSettings,
    ...getPartnerSettings(),
    onlineAvailability: getPartnerOnlineStatus(),
  }));

  const updateSettings = (next: PartnerSettings) => {
    setSettings(next);
    savePartnerSettings(next);
    setPartnerOnlineStatus(next.onlineAvailability);
  };

  useEffect(() => {
    return subscribePartnerOnlineStatus((value) => {
      setSettings((current) => ({ ...current, onlineAvailability: value }));
    });
  }, []);

  const handleLogout = async () => {
    await logoutPartnerAuthSession();
    router.replace("/partner/login");
  };

  if (IS_PRODUCTION_READY_MODE) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-xl font-semibold text-amber-800">Partner settings are unavailable</h2>
        <p className="mt-2 text-sm text-amber-700">We couldn&apos;t load settings right now. Please retry.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Settings</h2>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Availability</h3>
        <div className="mt-3">
          <ToggleRow
            label="Online availability toggle"
            value={settings.onlineAvailability}
            onChange={(value) => updateSettings({ ...settings, onlineAvailability: value })}
          />
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Notifications</h3>
        <div className="mt-3 space-y-2">
          <ToggleRow
            label="Chat requests"
            value={settings.notifyChatRequests}
            onChange={(value) => updateSettings({ ...settings, notifyChatRequests: value })}
          />
          <ToggleRow
            label="Call requests"
            value={settings.notifyCallRequests}
            onChange={(value) => updateSettings({ ...settings, notifyCallRequests: value })}
          />
          <ToggleRow
            label="Booking updates"
            value={settings.notifyBookingUpdates}
            onChange={(value) => updateSettings({ ...settings, notifyBookingUpdates: value })}
          />
          <ToggleRow
            label="Payout updates"
            value={settings.notifyPayoutUpdates}
            onChange={(value) => updateSettings({ ...settings, notifyPayoutUpdates: value })}
          />
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Privacy</h3>
        <div className="mt-3 space-y-2">
          <ToggleRow
            label="Hide phone number"
            value={settings.hidePhoneNumber}
            onChange={(value) => updateSettings({ ...settings, hidePhoneNumber: value })}
          />
          <ToggleRow
            label="Show only first name"
            value={settings.showOnlyFirstName}
            onChange={(value) => updateSettings({ ...settings, showOnlyFirstName: value })}
          />
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Safety</h3>
        <div className="mt-3">
          <ToggleRow
            label="Platonic-only policy acknowledgement"
            value={settings.acknowledgePlatonicPolicy}
            onChange={(value) => updateSettings({ ...settings, acknowledgePlatonicPolicy: value })}
          />
        </div>
      </article>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600"
      >
        Logout
      </button>
    </section>
  );
}
