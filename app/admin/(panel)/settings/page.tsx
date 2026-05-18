"use client";

import { useState } from "react";
import { getAdminSettings, setAdminSettings } from "@/lib/adminStore";
import type { AdminSettings } from "@/lib/adminData";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(() => getAdminSettings());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const update = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    if (!settings.platformName.trim() || !settings.companyName.trim()) {
      setError("Platform Name and Company Name are required.");
      setMessage("");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(settings.supportEmail.trim())) {
      setError("Please enter a valid support email.");
      setMessage("");
      return;
    }
    setAdminSettings(settings);
    setError("");
    setMessage("Admin settings saved.");
  };

  const toggleClass = "flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm";

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
            <input value={settings.defaultVisitPrice} onChange={(e) => update("defaultVisitPrice", e.target.value)} placeholder="Default Visit Price" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            <input value={settings.gst} onChange={(e) => update("gst", e.target.value)} placeholder="GST" className="h-10 rounded-xl border border-slate-200 px-3 text-sm col-span-2" />
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Wallet Settings</h3>
          <div className="mt-3 space-y-3">
            <input value={settings.minimumRecharge} onChange={(e) => update("minimumRecharge", e.target.value)} placeholder="Minimum Recharge" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            <input value={settings.maximumRecharge} onChange={(e) => update("maximumRecharge", e.target.value)} placeholder="Maximum Recharge" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            <input value={settings.minimumBalanceRule} onChange={(e) => update("minimumBalanceRule", e.target.value)} placeholder="Minimum Balance Rule" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            <button type="button" onClick={() => update("paymentGatewayRazorpayEnabled", !settings.paymentGatewayRazorpayEnabled)} className={toggleClass}>Razorpay Toggle <span>{settings.paymentGatewayRazorpayEnabled ? "On" : "Off"}</span></button>
            <button type="button" onClick={() => update("paymentGatewayCashfreeEnabled", !settings.paymentGatewayCashfreeEnabled)} className={toggleClass}>Cashfree Toggle <span>{settings.paymentGatewayCashfreeEnabled ? "On" : "Off"}</span></button>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Partner Settings</h3>
          <div className="mt-3 space-y-3">
            <input value={settings.minimumAge} onChange={(e) => update("minimumAge", e.target.value)} placeholder="Minimum Age" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            <button type="button" onClick={() => update("requireIdVerification", !settings.requireIdVerification)} className={toggleClass}>Require KYC documents (Selfie, Aadhaar, PAN) <span>{settings.requireIdVerification ? "On" : "Off"}</span></button>
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Partner activation is controlled from Partner Reviews after KYC and safety checklist review.
            </p>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
          <h3 className="text-base font-semibold text-slate-900">Safety Settings</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <button type="button" onClick={() => update("platonicOnlyPolicy", !settings.platonicOnlyPolicy)} className={toggleClass}>Platonic-only policy <span>{settings.platonicOnlyPolicy ? "On" : "Off"}</span></button>
            <button type="button" onClick={() => update("blockOffPlatformPaymentSharing", !settings.blockOffPlatformPaymentSharing)} className={toggleClass}>Block off-platform payment sharing <span>{settings.blockOffPlatformPaymentSharing ? "On" : "Off"}</span></button>
            <button type="button" onClick={() => update("enableReportReviewQueue", !settings.enableReportReviewQueue)} className={toggleClass}>Enable report review queue <span>{settings.enableReportReviewQueue ? "On" : "Off"}</span></button>
            <button type="button" onClick={() => update("sessionMonitoringEnabled", !settings.sessionMonitoringEnabled)} className={toggleClass}>Session monitoring <span>{settings.sessionMonitoringEnabled ? "On" : "Off"}</span></button>
          </div>
        </article>
      </div>

      <button type="button" onClick={save} className="rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] px-5 py-2.5 text-sm font-semibold text-white">
        Save Settings
      </button>
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
    </section>
  );
}
