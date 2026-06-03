"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Clock3, IndianRupee, MapPin, Plus, ShieldCheck, Star, X } from "lucide-react";
import { getWallet } from "@/lib/api/wallet";
import { getDemoBookings, setDemoBookings } from "@/lib/bookings";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import type { HomeVisitCompanion } from "@/lib/data";
import { HOME_VISIT_RATE_PER_HOUR } from "@/lib/platformPricing";
import { formatINR, getWalletBalance, subscribeWalletUpdates } from "@/lib/wallet";
import { VerifiedPartnerBadge } from "@/components/VerifiedPartnerBadge";

type HomeVisitBookingFlowProps = {
  companion: HomeVisitCompanion;
};

const interestOptions = [
  "Calm conversation",
  "Daily check-in",
  "Elderly support",
  "Walk support",
  "Meal company",
  "Errand support",
  "Reading time",
  "Family visit support",
  "Creative activity",
  "Other",
];

const slotGroups = [
  {
    label: "Morning",
    tone: "border-amber-200 bg-amber-50 text-orange-600",
    slots: [
      { value: "09:00", label: "9:00 AM - 10:00 AM" },
      { value: "10:00", label: "10:00 AM - 11:00 AM" },
      { value: "11:00", label: "11:00 AM - 12:00 PM" },
    ],
  },
  {
    label: "Afternoon",
    tone: "border-orange-200 bg-orange-50 text-orange-600",
    slots: [
      { value: "12:00", label: "12:00 PM - 1:00 PM" },
      { value: "13:00", label: "1:00 PM - 2:00 PM" },
      { value: "14:00", label: "2:00 PM - 3:00 PM" },
      { value: "15:00", label: "3:00 PM - 4:00 PM" },
    ],
  },
  {
    label: "Evening",
    tone: "border-indigo-200 bg-indigo-50 text-indigo-600",
    slots: [
      { value: "16:00", label: "4:00 PM - 5:00 PM" },
      { value: "17:00", label: "5:00 PM - 6:00 PM" },
      { value: "18:00", label: "6:00 PM - 7:00 PM" },
      { value: "19:00", label: "7:00 PM - 8:00 PM" },
    ],
  },
];

function getDateOptions() {
  const formatter = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    const value = date.toISOString().slice(0, 10);
    return {
      value,
      day: formatter.formatToParts(date).find((part) => part.type === "weekday")?.value ?? "",
      date: String(date.getDate()),
      month: formatter.formatToParts(date).find((part) => part.type === "month")?.value ?? "",
      label: index === 0 ? "Today" : formatter.format(date),
    };
  });
}

function isPastSlot(dateValue: string, slot: string) {
  const [hours, minutes] = slot.split(":").map(Number);
  const candidate = new Date(`${dateValue}T00:00:00`);
  candidate.setHours(hours, minutes, 0, 0);
  return candidate.getTime() <= Date.now();
}

function createPendingBookingId() {
  return `HV-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function hasBookingParam() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("booking") === "1";
}

export function HomeVisitBookingFlow({ companion }: HomeVisitBookingFlowProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(() => hasBookingParam());
  const [openedFromUrl, setOpenedFromUrl] = useState(() => hasBookingParam());
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedInterest, setSelectedInterest] = useState("");
  const [customInterest, setCustomInterest] = useState("");
  const [showAllInterests, setShowAllInterests] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  const dateOptions = useMemo(() => getDateOptions(), []);
  const visibleInterests = showAllInterests ? interestOptions : interestOptions.slice(0, 6);
  const requiredAmount = HOME_VISIT_RATE_PER_HOUR;
  const shortfall = Math.max(requiredAmount - walletBalance, 0);
  const hasSufficientBalance = walletBalance >= requiredAmount;
  const hasDateAndSlot = Boolean(selectedDate && selectedSlot);
  const canProceed = hasDateAndSlot && hasSufficientBalance;
  const effectiveInterest = selectedInterest === "Other" ? customInterest.trim() : selectedInterest;

  useEffect(() => {
    if (!isOpen) return;
    if (IS_PRODUCTION_READY_MODE) {
      void (async () => {
        const response = await getWallet();
        setWalletBalance(response.data?.balance ?? 0);
      })();
      return () => undefined;
    }
    const sync = () => setWalletBalance(getWalletBalance());
    sync();
    return subscribeWalletUpdates(sync);
  }, [isOpen]);

  const closeModal = () => {
    setIsOpen(false);
    if (openedFromUrl) {
      router.replace(pathname, { scroll: false });
      setOpenedFromUrl(false);
    }
  };

  const handleProceed = () => {
    if (!canProceed) return;

    if (IS_PRODUCTION_READY_MODE) {
      setSuccessMessage("Home Visit requests are currently handled by support. Please contact support to continue.");
      return;
    }

    const pendingBooking = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      bookingId: createPendingBookingId(),
      companionName: companion.name,
      companionId: companion.id,
      serviceType: "visit" as const,
      price: requiredAmount,
      routeSource: "home-visit" as const,
      status: "Pending" as const,
      createdAt: new Date(`${selectedDate}T${selectedSlot}:00`).toISOString(),
    };

    setDemoBookings([pendingBooking, ...getDemoBookings()]);
    setSuccessMessage("Home Visit request submitted for manual verification.");
    window.setTimeout(() => {
      closeModal();
      router.push("/bookings");
    }, 900);
  };

  const proceedLabel = !hasDateAndSlot
    ? "Select date and time"
    : !hasSufficientBalance
      ? "Add balance to continue"
      : "Proceed to Verification";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0f766e] px-5 text-sm font-semibold text-white transition hover:bg-[#115e59] sm:w-auto"
      >
        <ShieldCheck size={16} />
        Request safe visit
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[80] bg-slate-950/55 sm:flex sm:items-center sm:justify-center sm:p-4">
          <section className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[94vh] sm:max-w-6xl sm:rounded-[28px]">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#dceae5] bg-white px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-2xl font-semibold leading-tight text-slate-950">Book a Session</h2>
                <p className="mt-1 text-sm text-slate-600">Select your preferred date and time</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
                aria-label="Close booking modal"
              >
                <X size={18} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="space-y-6">
                <article className="rounded-2xl border border-blue-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={companion.image} alt={companion.name} className="h-20 w-20 shrink-0 rounded-full object-cover" />
                      <div className="min-w-0">
                        <h3 className="flex min-w-0 items-center gap-1.5 text-lg font-semibold text-slate-950">
                          <span className="min-w-0 truncate">{companion.name}</span>
                          {companion.verified ? <VerifiedPartnerBadge /> : null}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">{companion.tagline}</p>
                        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star key={index} size={14} fill="currentColor" />
                            ))}
                          </span>
                          <span className="font-semibold text-slate-900">{companion.rating.toFixed(1)}</span>
                          <span>-</span>
                          <span>{companion.experience}</span>
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-600">
                          <MapPin size={13} />
                          {companion.city}
                        </p>
                      </div>
                  </div>
                  <div className="mt-4 border-t border-blue-200 pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Hourly Price</p>
                        <p className="mt-1 text-xs text-slate-500">60 minutes - home visit</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{formatINR(requiredAmount)}</p>
                    </div>
                  </div>
                </article>

                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <CalendarDays size={18} className="text-blue-600" />
                    <h3 className="font-semibold text-slate-950">Select Date</h3>
                  </div>
                  <div className="-mx-4 flex overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
                      <div className="flex min-w-max gap-2">
                        {dateOptions.map((date) => {
                          const active = selectedDate === date.value;
                          return (
                            <button
                              key={date.value}
                              type="button"
                              onClick={() => {
                                setSelectedDate(date.value);
                                setSelectedSlot("");
                              }}
                              className={`min-h-[104px] min-w-[164px] rounded-2xl border px-3 text-center text-sm font-semibold shadow-sm ${
                                active
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-[#dceae5] bg-slate-50 text-slate-600"
                              }`}
                            >
                              <span className="block text-sm">{date.day || date.label}</span>
                              <span className="mt-2 block text-2xl font-bold">{date.date}</span>
                              <span className="mt-1 block text-sm">{date.month}</span>
                            </button>
                          );
                        })}
                      </div>
                  </div>
                </section>

                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Clock3 size={18} className="text-blue-600" />
                    <h3 className="font-semibold text-slate-950">Select Time Slot</h3>
                  </div>
                    {!selectedDate ? (
                      <p className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        Choose a date to see available time slots.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {slotGroups.map((group) => (
                          <div key={group.label} className={`rounded-2xl border p-4 ${group.tone}`}>
                            <p className="font-semibold">{group.label}</p>
                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {group.slots.map((slot) => {
                                const disabled = isPastSlot(selectedDate, slot.value);
                                const active = selectedSlot === slot.value;
                                return (
                                  <button
                                    key={slot.value}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => setSelectedSlot(slot.value)}
                                    className={`min-h-[68px] rounded-xl border bg-white px-3 text-center text-sm font-semibold ${
                                      active
                                        ? "border-slate-900 bg-slate-900 text-white"
                                        : "border-[#dceae5] text-slate-800"
                                    } disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300`}
                                  >
                                    <span className="block">{slot.label}</span>
                                    {disabled ? <span className="mt-1 block text-xs">Passed</span> : null}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </section>

                <section>
                  <h3 className="font-semibold text-slate-950">What would you like to do? <span className="font-normal">(Optional)</span></h3>
                  <p className="mt-2 text-sm text-slate-500">Select from provider&apos;s services or add your own interest</p>
                  <div className="mt-4 rounded-2xl border border-[#dceae5] bg-white p-3">
                    <div className="flex max-h-none flex-wrap gap-2 overflow-visible">
                      {visibleInterests.map((interest) => {
                        const active = selectedInterest === interest;
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => setSelectedInterest(active ? "" : interest)}
                            className={`min-h-10 rounded-full border px-3 text-sm font-semibold ${
                              active
                                ? "border-[#0f766e] bg-[#eef8f5] text-[#0f766e]"
                                : "border-[#dceae5] bg-white text-slate-700"
                            }`}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                    {interestOptions.length > 6 ? (
                      <button
                        type="button"
                        onClick={() => setShowAllInterests((current) => !current)}
                        className="mt-3 text-sm font-semibold text-[#0f766e]"
                      >
                        {showAllInterests ? "Show less" : "Show more"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSelectedInterest("Other")}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
                    >
                      <Plus size={16} />
                      Add your own interest
                    </button>
                    {selectedInterest === "Other" ? (
                      <input
                        value={customInterest}
                        onChange={(event) => setCustomInterest(event.target.value)}
                        placeholder="Add your interest"
                        className="mt-3 h-11 w-full rounded-2xl border border-[#dceae5] px-3 text-sm outline-none focus:border-[#0f766e]"
                      />
                    ) : null}
                    {effectiveInterest ? (
                      <p className="mt-2 text-xs text-slate-500">Selected: {effectiveInterest}</p>
                    ) : null}
                </section>

                <section className={`rounded-2xl border p-4 ${hasSufficientBalance ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <IndianRupee size={18} className={hasSufficientBalance ? "text-emerald-700" : "text-rose-700"} />
                      <h3 className="font-semibold text-slate-950">Wallet Balance</h3>
                    </div>
                    <Link href="/wallet" className="text-sm font-semibold text-blue-600">
                      Add Money
                    </Link>
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-slate-950">{formatINR(walletBalance)} <span className="text-base font-normal text-slate-600">available</span></p>
                    {hasSufficientBalance ? (
                      <div className="mt-3 text-sm text-emerald-700">
                        <p className="font-semibold">Ready to book</p>
                        <p className="mt-1">{formatINR(requiredAmount)} will be deducted after confirmation.</p>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-rose-700">
                        <p className="font-semibold">Insufficient balance</p>
                        <p className="mt-1">Add {formatINR(shortfall)} to continue.</p>
                      </div>
                    )}
                </section>

                  {successMessage ? (
                    <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                      {successMessage}
                    </p>
                  ) : null}
              </div>
            </div>

            <footer className="sticky bottom-0 z-10 flex items-center gap-3 border-t border-[#dceae5] bg-white px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={closeModal}
                className="min-h-11 flex-1 rounded-full border border-[#dceae5] bg-white px-4 text-sm font-semibold text-slate-700 sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canProceed}
                onClick={handleProceed}
                className="min-h-11 flex-[1.4] rounded-full bg-[#0f766e] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400 sm:flex-1"
              >
                {proceedLabel}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
