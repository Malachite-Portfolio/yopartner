"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminSetting, updateAdminSetting } from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";

type SettingsState = {
  platformName: string;
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  defaultChatPrice: string;
  defaultAudioPrice: string;
  defaultVideoPrice: string;
  gst: string;
  minimumRecharge: string;
  maximumRecharge: string;
  minimumBalanceRule: string;
  paymentGatewayRazorpayEnabled: boolean;
  requireIdVerification: boolean;
  platonicOnlyPolicy: boolean;
  blockOffPlatformPaymentSharing: boolean;
};

const emptySettings: SettingsState = {
  platformName: "",
  companyName: "",
  supportEmail: "",
  supportPhone: "",
  defaultChatPrice: "",
  defaultAudioPrice: "",
  defaultVideoPrice: "",
  gst: "",
  minimumRecharge: "",
  maximumRecharge: "",
  minimumBalanceRule: "",
  paymentGatewayRazorpayEnabled: true,
  requireIdVerification: false,
  platonicOnlyPolicy: false,
  blockOffPlatformPaymentSharing: false,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsState>(emptySettings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    const [generalRes, pricingRes, walletRes, safetyRes] = await Promise.all([
      getAdminSetting("general"),
      getAdminSetting("pricing"),
      getAdminSetting("wallet"),
      getAdminSetting("safety"),
    ]);

    const responses = [generalRes, pricingRes, walletRes, safetyRes];
    if (responses.some((response) => response.error?.status === 401)) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    const general = asRecord(generalRes.data?.setting?.value);
    const pricing = asRecord(pricingRes.data?.setting?.value);
    const wallet = asRecord(walletRes.data?.setting?.value);
    const safety = asRecord(safetyRes.data?.setting?.value);

    setSettings({
      platformName: asString(general.platformName),
      companyName: asString(general.companyName),
      supportEmail: asString(general.supportEmail),
      supportPhone: asString(general.supportPhone),
      defaultChatPrice: asString(pricing.defaultChatPrice),
      defaultAudioPrice: asString(pricing.defaultAudioPrice),
      defaultVideoPrice: asString(pricing.defaultVideoPrice),
      gst: asString(pricing.gst),
      minimumRecharge: asString(wallet.minimumRecharge),
      maximumRecharge: asString(wallet.maximumRecharge),
      minimumBalanceRule: asString(wallet.minimumBalanceRule),
      paymentGatewayRazorpayEnabled: wallet.paymentGatewayRazorpayEnabled !== false,
      requireIdVerification: Boolean(safety.requireIdVerification),
      platonicOnlyPolicy: Boolean(safety.platonicOnlyPolicy),
      blockOffPlatformPaymentSharing: Boolean(safety.blockOffPlatformPaymentSharing),
    });
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSettings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSettings]);

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setMessage("");
    setError("");
    if (!settings.platformName.trim() || !settings.companyName.trim()) {
      setError("Platform Name and Company Name are required.");
      return;
    }

    const [generalSave, pricingSave, walletSave, safetySave] = await Promise.all([
      updateAdminSetting("general", {
        platformName: settings.platformName.trim(),
        companyName: settings.companyName.trim(),
        supportEmail: settings.supportEmail.trim(),
        supportPhone: settings.supportPhone.trim(),
      }),
      updateAdminSetting("pricing", {
        defaultChatPrice: settings.defaultChatPrice.trim(),
        defaultAudioPrice: settings.defaultAudioPrice.trim(),
        defaultVideoPrice: settings.defaultVideoPrice.trim(),
        gst: settings.gst.trim(),
      }),
      updateAdminSetting("wallet", {
        minimumRecharge: settings.minimumRecharge.trim(),
        maximumRecharge: settings.maximumRecharge.trim(),
        minimumBalanceRule: settings.minimumBalanceRule.trim(),
        paymentGatewayRazorpayEnabled: settings.paymentGatewayRazorpayEnabled,
      }),
      updateAdminSetting("safety", {
        requireIdVerification: settings.requireIdVerification,
        platonicOnlyPolicy: settings.platonicOnlyPolicy,
        blockOffPlatformPaymentSharing: settings.blockOffPlatformPaymentSharing,
      }),
    ]);

    const responses = [generalSave, pricingSave, walletSave, safetySave];
    if (responses.some((response) => response.error?.status === 401)) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }
    const failed = responses.find((response) => response.error);
    if (failed) {
      setError(failed.error?.message || "Unable to save settings.");
      return;
    }

    setMessage("Admin settings saved.");
  };

  const toggleClass = "flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm";

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
        <article className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Loading settings...
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Settings</h2>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">General Settings</h3>
          <div className="mt-3 space-y-3">
            <input value={settings.platformName} onChange={(e) => update("platformName", e.target.value)} placeholder="Platform Name" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            <input value={settings.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Company Name" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            <input value={settings.supportEmail} onChange={(e) => update("supportEmail", e.target.value)} placeholder="Support Email" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            <input value={settings.supportPhone} onChange={(e) => update("supportPhone", e.target.value)} placeholder="Support Phone" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Pricing Settings</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input value={settings.defaultChatPrice} onChange={(e) => update("defaultChatPrice", e.target.value)} placeholder="Default Chat Price" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            <input value={settings.defaultAudioPrice} onChange={(e) => update("defaultAudioPrice", e.target.value)} placeholder="Default Audio Price" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            <input value={settings.defaultVideoPrice} onChange={(e) => update("defaultVideoPrice", e.target.value)} placeholder="Default Video Price" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            <input value={settings.gst} onChange={(e) => update("gst", e.target.value)} placeholder="GST" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Wallet Settings</h3>
          <div className="mt-3 space-y-3">
            <input value={settings.minimumRecharge} onChange={(e) => update("minimumRecharge", e.target.value)} placeholder="Minimum Recharge" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            <input value={settings.maximumRecharge} onChange={(e) => update("maximumRecharge", e.target.value)} placeholder="Maximum Recharge" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            <input value={settings.minimumBalanceRule} onChange={(e) => update("minimumBalanceRule", e.target.value)} placeholder="Minimum Balance Rule" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            <button type="button" onClick={() => update("paymentGatewayRazorpayEnabled", !settings.paymentGatewayRazorpayEnabled)} className={toggleClass}>Razorpay Enabled <span>{settings.paymentGatewayRazorpayEnabled ? "On" : "Off"}</span></button>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Safety Settings</h3>
          <div className="mt-3 space-y-3">
            <button type="button" onClick={() => update("requireIdVerification", !settings.requireIdVerification)} className={toggleClass}>Require KYC <span>{settings.requireIdVerification ? "On" : "Off"}</span></button>
            <button type="button" onClick={() => update("platonicOnlyPolicy", !settings.platonicOnlyPolicy)} className={toggleClass}>Platonic-only policy <span>{settings.platonicOnlyPolicy ? "On" : "Off"}</span></button>
            <button type="button" onClick={() => update("blockOffPlatformPaymentSharing", !settings.blockOffPlatformPaymentSharing)} className={toggleClass}>Block off-platform payment sharing <span>{settings.blockOffPlatformPaymentSharing ? "On" : "Off"}</span></button>
          </div>
        </article>
      </div>

      <button type="button" onClick={() => { void save(); }} className="rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] px-5 py-2.5 text-sm font-semibold text-white">
        Save Settings
      </button>
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
    </section>
  );
}
