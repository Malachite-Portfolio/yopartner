"use client";

import { AlertTriangle, Headphones, Users } from "lucide-react";
import { useState } from "react";
import { IS_DEMO_MODE } from "@/lib/config/runtime";

const supportCards = [
  {
    title: "Customer Support",
    description: "Need help with sessions, account access, or app navigation? We are here to help.",
    icon: Headphones,
  },
  {
    title: "Safety & Reports",
    description: "Report uncomfortable behavior or raise a safety concern for immediate review.",
    icon: AlertTriangle,
  },
  {
    title: "Companion Applications",
    description: "Questions about onboarding, verification, or becoming a companion.",
    icon: Users,
  },
];

export default function SupportPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    if (!name || !email || !message) {
      setError("Please fill all required fields.");
      setSuccess("");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      setSuccess("");
      return;
    }
    if (message.length < 10) {
      setError("Message should be at least 10 characters.");
      setSuccess("");
      return;
    }
    setError("");
    setSuccess(
      IS_DEMO_MODE
        ? "Support request submitted in demo mode."
        : "Support request submitted successfully.",
    );
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section className="min-h-screen bg-[#f8fbfc]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-slate-900">Support</h1>
        <p className="mt-3 text-base text-slate-600">Need help? YoPartner support is here for you.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {supportCards.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563EB]">
                  <Icon size={18} />
                </span>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Contact YoPartner Support</h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
            <label className="text-sm text-slate-600">
              Name
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#2563EB]"
                placeholder="Your name"
              />
            </label>
            <label className="text-sm text-slate-600">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#2563EB]"
                placeholder="you@example.com"
              />
            </label>
            <label className="sm:col-span-2 text-sm text-slate-600">
              Message
              <textarea
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                className="mt-1 min-h-[120px] w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-[#2563EB]"
                placeholder="How can we help you?"
              />
            </label>
            {error ? <p className="sm:col-span-2 text-sm font-medium text-rose-600">{error}</p> : null}
            {success ? <p className="sm:col-span-2 text-sm font-medium text-emerald-700">{success}</p> : null}
            <button
              type="submit"
              className="sm:col-span-2 inline-flex h-11 items-center justify-center rounded-xl bg-[#2563EB] px-5 text-sm font-semibold text-white"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
