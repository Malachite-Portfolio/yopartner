"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { BadgeCheck, CheckCircle2, HeartHandshake, MessageCircle, PhoneCall, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/api/bookings";
import { createSession } from "@/lib/api/sessions";
import { USER_FIREBASE_TOKEN_KEY } from "@/lib/auth/firebasePhoneAuth";
import { getWallet } from "@/lib/api/wallet";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import type { ConnectCompanion } from "@/lib/data";
import { formatINR, getWalletBalance, subscribeWalletUpdates } from "@/lib/wallet";

type ProfileBookingPanelProps = {
  companion: ConnectCompanion;
  initialType?: SessionType;
};

type SessionType = "chat" | "audio" | "video" | "visit";

type SessionOption = {
  type: SessionType;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  unit: "/min" | "/session";
  price: number;
  badge: "CHAT" | "AUDIO" | "VIDEO" | "HOME VISIT";
};

function SessionCard({
  option,
  selected,
  onSelect,
}: {
  option: SessionOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border p-3 text-left transition sm:p-3.5 ${
        selected
          ? "border-[#0f766e] bg-[#eef8f5] text-slate-900 shadow-sm"
          : "border-[#dceae5] bg-white text-slate-700 hover:border-[#0f766e]/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${
            selected ? "bg-white text-[#0f766e]" : "bg-slate-100 text-slate-600"
          }`}
        >
          <Icon size={15} />
        </span>
        {selected ? <CheckCircle2 size={16} className="text-emerald-500" /> : null}
      </div>
      <p className="mt-2 text-sm font-semibold">{option.label}</p>
      <p className={`mt-0.5 text-sm ${selected ? "text-slate-600" : "text-slate-500"}`}>
        {formatINR(option.price)}{option.unit}
      </p>
    </button>
  );
}

export function ProfileBookingPanel({
  companion,
  initialType,
}: ProfileBookingPanelProps) {
  const router = useRouter();
  const options = useMemo<SessionOption[]>(
    () => {
      const base: SessionOption[] = [
      { type: "chat", label: "Start chat", icon: MessageCircle, unit: "/min", price: companion.chatPrice, badge: "CHAT" },
      { type: "audio", label: "Audio call", icon: PhoneCall, unit: "/min", price: companion.voicePrice, badge: "AUDIO" },
      { type: "video", label: "Video call", icon: Video, unit: "/min", price: companion.videoPrice ?? 20, badge: "VIDEO" },
      ];
      if (companion.visitPrice > 0) {
        base.push({
          type: "visit",
          label: "Safe visit",
          icon: HeartHandshake,
          unit: "/session",
          price: companion.visitPrice,
          badge: "HOME VISIT",
        });
      }
      return base;
    },
    [companion.chatPrice, companion.voicePrice, companion.videoPrice, companion.visitPrice],
  );

  const [selectedType, setSelectedType] = useState<SessionType>(initialType ?? "chat");
  const [walletBalance, setWalletBalance] = useState(0);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (IS_PRODUCTION_READY_MODE) {
      void (async () => {
        const walletResponse = await getWallet();
        if (walletResponse.data) {
          setWalletBalance(walletResponse.data.balance);
        }
      })();
      return () => undefined;
    }
    const sync = () => setWalletBalance(getWalletBalance());
    sync();
    return subscribeWalletUpdates(sync);
  }, []);

  const selectedOption = options.find((option) => option.type === selectedType) ?? options[0];
  const multiplier = 5;
  const requiredAmount = selectedOption.price * multiplier;
  const shortfall = Math.max(requiredAmount - walletBalance, 0);
  const hasSufficientBalance = walletBalance >= requiredAmount;

  const handlePrimaryAction = () => {
    if (selectedType === "visit") {
      router.push(`/home-visit/${companion.id}?booking=1`);
      return;
    }
    if (!hasSufficientBalance) return;

    if (IS_PRODUCTION_READY_MODE) {
      void (async () => {
        const response = await createBooking({
          companionId: companion.id,
          serviceType: selectedType,
        });
        if (response.error) {
          setActionMessage("Booking is temporarily unavailable. Please try again.");
          return;
        }

        if (selectedType === "chat") {
          const token =
            typeof window !== "undefined"
              ? window.localStorage.getItem(USER_FIREBASE_TOKEN_KEY)?.trim() || ""
              : "";
          if (!token) {
            router.push(`/login?returnUrl=${encodeURIComponent(`/chat/${companion.id}`)}`);
            return;
          }
          const sessionResponse = await createSession({
            companionId: companion.id,
            serviceType: "chat",
            bookingId: response.data?.booking.id,
          });
          if (sessionResponse.error?.status === 401) {
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(USER_FIREBASE_TOKEN_KEY);
            }
            router.push(`/login?returnUrl=${encodeURIComponent(`/chat/${companion.id}`)}`);
            return;
          }
          const sessionId = sessionResponse.data?.id;
          if (sessionId) {
            router.push(`/chat/${sessionId}?companionId=${encodeURIComponent(companion.id)}`);
            return;
          }
          router.push(`/chat/${companion.id}`);
          return;
        }
        if (selectedType === "audio") {
          router.push(`/call/audio/${companion.id}`);
          return;
        }
        router.push(`/call/video/${companion.id}`);
      })();
      return;
    }

    if (selectedType === "chat") {
      router.push(`/chat/${companion.id}`);
      return;
    }

    if (selectedType === "audio") {
      router.push(`/call/audio/${companion.id}`);
      return;
    }

    if (selectedType === "video") {
      router.push(`/call/video/${companion.id}`);
      return;
    }
  };

  const primaryActionLabel =
    selectedType === "chat"
      ? "Start chat"
      : selectedType === "audio"
        ? "Audio call"
        : selectedType === "video"
          ? "Video call"
          : "Request safe visit";

  return (
    <div className="space-y-3.5 lg:sticky lg:top-4">
      <section className="rounded-3xl border border-[#dceae5] bg-white p-5 text-slate-900 shadow-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Book safely</p>
        <h3 className="mt-1 text-xl font-semibold">Book your conversation</h3>

        <p className="mt-3 text-sm font-semibold text-slate-700">Choose conversation type</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {options.map((option) => (
            <SessionCard
              key={option.type}
              option={option}
              selected={option.type === selectedType}
              onSelect={() => {
                if (option.type === "visit") {
                  router.push(`/home-visit/${companion.id}?booking=1`);
                  return;
                }
                setSelectedType(option.type);
              }}
            />
          ))}
        </div>

        <div className="mt-3.5 rounded-xl bg-white p-4 text-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Conversation price</p>
              <p className="mt-1 text-[34px] font-semibold leading-none text-[#0f766e] sm:text-[38px]">
                {formatINR(selectedOption.price)}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">{selectedOption.unit}</p>
            </div>
            <span className="inline-flex rounded-full border border-[#dceae5] bg-[#eef8f5] px-2.5 py-1 text-[11px] font-semibold text-[#0f766e]">
              {selectedOption.badge}
            </span>
          </div>
        </div>

        <div className="mt-3.5 rounded-3xl border border-[#dceae5] bg-[#f7fbf8] p-4 text-sm text-slate-900">
              <p className="font-semibold">Available balance</p>
          <p className="mt-1 text-[36px] font-semibold leading-none">{formatINR(walletBalance)}</p>
          <p className="mt-0.5 text-sm text-slate-600">available</p>

          {hasSufficientBalance ? (
            <>
              <p className="mt-2 font-semibold text-emerald-600">Sufficient Balance</p>
              <p className="mt-1 text-[13px] text-emerald-600">You can proceed with this session.</p>
            </>
          ) : (
            <>
              <p className="mt-2 font-semibold text-red-600">Insufficient Balance</p>
              <p className="mt-1 text-[13px] text-red-500">
                Required: {formatINR(requiredAmount)} ({multiplier}x service price)
              </p>
              <p className="text-[13px] text-red-500">Shortfall: {formatINR(shortfall)}</p>
              <Link
                href="/wallet"
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#0f766e] px-3 text-sm font-semibold text-white"
              >
                Go to balance
              </Link>
            </>
          )}
        </div>

        {actionMessage ? <p className="mt-3 text-xs font-medium text-amber-700">{actionMessage}</p> : null}

        {hasSufficientBalance ? (
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="mt-3.5 h-12 w-full rounded-full bg-[#0f766e] text-sm font-semibold text-white disabled:opacity-70"
          >
            {primaryActionLabel}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="mt-3.5 h-12 w-full rounded-full bg-slate-400 text-sm font-semibold text-white/95 disabled:cursor-not-allowed disabled:opacity-85"
          >
            Insufficient Balance
          </button>
        )}
      </section>

      <section className="rounded-3xl border border-[#dceae5] bg-white p-3.5 shadow-sm">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Languages</h4>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {companion.languages.map((language) => (
            <span key={language} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {language}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#dceae5] bg-white p-3.5 shadow-sm">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Service Areas</h4>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {companion.serviceAreas.map((area) => (
            <span key={area} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {area}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#dceae5] bg-white p-3.5 shadow-sm">
        <h4 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <BadgeCheck size={13} className="text-emerald-600" />
          Trust &amp; Safety
        </h4>
        <p className="mt-2 text-sm font-semibold text-slate-900">YoPartner Verified</p>
        <p className="text-xs text-slate-500">Member since November 2025</p>
        <p className="mt-1 text-xs text-slate-500">Strictly platonic • No outside payments</p>
      </section>
    </div>
  );
}
