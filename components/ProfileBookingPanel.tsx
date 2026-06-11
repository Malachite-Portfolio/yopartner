"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { BarChart3, CheckCircle2, MessageSquareText, PhoneCall, RefreshCw, Video, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSession } from "@/lib/api/sessions";
import { getWelcomeChatBonus, type WelcomeChatBonusResponse } from "@/lib/api/users";
import { getWallet } from "@/lib/api/wallet";
import { requestAudioPermission, requestVideoPermission } from "@/lib/agora";
import { getUserAuthTokenWithRestore, subscribeUserAuthState } from "@/lib/auth/userAuth";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import type { ConnectCompanion } from "@/lib/data";
import {
  AUDIO_RATE_PER_MIN,
  CHAT_RATE_PER_MIN,
  HOME_VISIT_RATE_PER_HOUR,
  VIDEO_RATE_PER_MIN,
} from "@/lib/platformPricing";
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
  unit: "/ min" | "/ hour";
  price: number;
  badge: "CHAT" | "AUDIO" | "VIDEO" | "HOME VISIT";
};

const MIN_CHAT_WALLET_BALANCE = 50;
const USE_PROFILE_CLIENT_WALLET_PRECHECK = false;

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
      className={`flex min-h-[74px] items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
        selected
          ? "border-white bg-white text-[#201a2f]"
          : "border-white/10 bg-white/[0.07] text-white hover:border-white/25"
      }`}
    >
      <Icon size={22} className={selected ? "text-[#201a2f]" : "text-white"} />
      <span>
        <span className="block text-base font-semibold">{option.label}</span>
        <span className={selected ? "text-sm font-medium text-[#5f536a]" : "text-sm font-medium text-white/70"}>
          {formatINR(option.price).replace(".00", "")} {option.unit}
        </span>
      </span>
    </button>
  );
}

export function ProfileBookingPanel({ companion, initialType }: ProfileBookingPanelProps) {
  const router = useRouter();
  const options = useMemo<SessionOption[]>(() => {
    const base: SessionOption[] = [
      { type: "chat", label: "Chat", icon: MessageSquareText, unit: "/ min", price: companion.chatPrice > 0 ? CHAT_RATE_PER_MIN : 0, badge: "CHAT" },
      { type: "audio", label: "Audio", icon: PhoneCall, unit: "/ min", price: companion.voicePrice > 0 ? AUDIO_RATE_PER_MIN : 0, badge: "AUDIO" },
      { type: "video", label: "Video", icon: Video, unit: "/ min", price: (companion.videoPrice ?? 0) > 0 ? VIDEO_RATE_PER_MIN : 0, badge: "VIDEO" },
    ];
    const available = base.filter((option) => option.price > 0);

    if (companion.visitPrice > 0) {
      available.push({
        type: "visit",
        label: "Home Visit",
        icon: CheckCircle2,
        unit: "/ hour",
        price: HOME_VISIT_RATE_PER_HOUR,
        badge: "HOME VISIT",
      });
    }

    return available;
  }, [companion.chatPrice, companion.voicePrice, companion.videoPrice, companion.visitPrice]);

  const [selectedType, setSelectedType] = useState<SessionType>(initialType ?? "chat");
  const [walletBalance, setWalletBalance] = useState(0);
  const [actionMessage, setActionMessage] = useState("");
  const [showAddMoneyPrompt, setShowAddMoneyPrompt] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [welcomeChatBonus, setWelcomeChatBonus] = useState<WelcomeChatBonusResponse | null>(null);

  useEffect(() => {
    return subscribeUserAuthState((state) => {
      setLoggedIn(state.loggedIn);
      if (!state.loggedIn) setWalletBalance(0);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      return () => undefined;
    }

    if (IS_PRODUCTION_READY_MODE) {
      let cancelled = false;
      void (async () => {
        const walletResponse = await getWallet();
        if (!cancelled && walletResponse.data) {
          setWalletBalance(walletResponse.data.balance);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    const sync = () => setWalletBalance(getWalletBalance());
    sync();
    return subscribeWalletUpdates(sync);
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    let cancelled = false;
    void getWelcomeChatBonus().then((response) => {
      if (!cancelled) setWelcomeChatBonus(response.data);
    });

    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  const selectedOption = options.find((option) => option.type === selectedType) ?? options[0];
  const multiplier = selectedOption?.type === "visit" ? 1 : 5;
  const requiredAmount =
    selectedOption?.type === "chat"
      ? MIN_CHAT_WALLET_BALANCE
      : (selectedOption?.price ?? 0) * multiplier;
  const shortfall = Math.max(requiredAmount - walletBalance, 0);
  const welcomeChatApplies =
    loggedIn && selectedOption?.type === "chat" && Boolean(welcomeChatBonus?.available && welcomeChatBonus.freeMinutes > 0);
  const hasSufficientBalance = loggedIn && (walletBalance >= requiredAmount || welcomeChatApplies);
  const returnPath = `/connect-now/${companion.id}?type=${selectedOption?.type ?? "chat"}`;

  const handlePrimaryAction = () => {
    if (!selectedOption) return;
    setShowAddMoneyPrompt(false);
    if (!loggedIn) {
      router.push(`/login?returnUrl=${encodeURIComponent(returnPath)}`);
      return;
    }

    if (selectedType === "visit") {
      router.push(`/home-visit/${companion.id}?booking=1`);
      return;
    }
    if (USE_PROFILE_CLIENT_WALLET_PRECHECK && !hasSufficientBalance) {
      if (selectedType === "chat") {
        setActionMessage("Minimum INR 50 wallet balance is required to start a chat.");
        setShowAddMoneyPrompt(true);
      }
      return;
    }

    void (async () => {
      const token = await getUserAuthTokenWithRestore();
      const loginReturnPath = `/connect-now/${companion.id}?type=${selectedType}`;

      if (!token) {
        router.push(`/login?returnUrl=${encodeURIComponent(loginReturnPath)}`);
        return;
      }

      if (selectedType === "audio") {
        try {
          await requestAudioPermission();
        } catch {
          setActionMessage("Microphone permission is required for audio calls.");
          return;
        }
      }
      if (selectedType === "video") {
        try {
          await requestVideoPermission();
        } catch {
          setActionMessage("Camera and microphone permission are required for video calls.");
          return;
        }
      }

      const sessionResponse = await createSession({
        companionId: companion.id,
        serviceType: selectedType,
      });

      if (sessionResponse.error?.status === 401) {
        router.push(`/login?returnUrl=${encodeURIComponent(loginReturnPath)}`);
        return;
      }
      if (sessionResponse.error) {
        if (sessionResponse.error.code === "INSUFFICIENT_WALLET_BALANCE") {
          setActionMessage(sessionResponse.error.message || "Please add money to continue.");
          setShowAddMoneyPrompt(true);
          return;
        }
        setActionMessage(sessionResponse.error.message || "Unable to create a new session. Please try again.");
        return;
      }

      const sessionId = sessionResponse.data?.id;
      if (!sessionId) {
        setActionMessage("Unable to create a new session. Please try again.");
        return;
      }

      if (selectedType === "chat") {
        router.push(`/chat/${sessionId}?companionId=${encodeURIComponent(companion.id)}`);
        return;
      }
      if (selectedType === "audio") {
        router.push(`/call/audio/${sessionId}?companionId=${encodeURIComponent(companion.id)}`);
        return;
      }
      router.push(`/call/video/${sessionId}?companionId=${encodeURIComponent(companion.id)}`);
    })();
  };

  const primaryActionLabel =
    selectedType === "chat"
      ? "Start Chat"
      : selectedType === "audio"
        ? "Start Audio"
        : selectedType === "video"
          ? "Start Video"
          : "Request Home Visit";

  return (
    <aside className="space-y-6 lg:sticky lg:top-5">
      <section className="rounded-[22px] bg-[#1d182b] p-6 text-white shadow-[0_20px_55px_rgba(29,24,43,0.25)]">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6729f4]">
            <MessageSquareText size={25} />
          </span>
          <div>
            <h2 className="text-2xl font-semibold">Book your session</h2>
            <p className="text-sm font-medium text-white/65">Choose your interaction mode</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
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
                setActionMessage("");
              }}
            />
          ))}
        </div>

        {selectedOption ? (
          <div className="mt-6 rounded-xl bg-white p-5 text-[#201a2f]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#8490a4]">Session Price</p>
                <div className="mt-1 flex items-end gap-1">
                  <span className="text-[36px] font-semibold leading-none text-[#a45413]">
                    {formatINR(selectedOption.price).replace(".00", "")}
                  </span>
                  <span className="text-sm font-medium text-[#8490a4]">{selectedOption.unit}</span>
                </div>
              </div>
              <span className="rounded-md bg-[#f4eaff] px-3 py-1.5 text-xs font-semibold text-[#a45413]">
                {selectedOption.badge}
              </span>
            </div>
            {welcomeChatApplies ? (
              <div className="mt-4 rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-sm font-semibold text-fuchsia-800">
                First chat: {welcomeChatBonus?.freeMinutes ?? 10} minutes free
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 rounded-xl bg-white p-5 text-[#201a2f]">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Wallet size={18} className="text-[#a45413]" />
              Wallet Balance
            </h3>
            <RefreshCw size={16} className="text-[#8490a4]" />
          </div>

          {!authChecked ? (
            <p className="mt-4 text-sm text-[#7d7288]">Checking login...</p>
          ) : !loggedIn ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-800">Login Required</p>
              <p className="mt-1 text-sm text-amber-700">Please login to continue with this session.</p>
              <Link
                href={`/login?returnUrl=${encodeURIComponent(returnPath)}`}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-[#102535] text-sm font-semibold text-white"
              >
                Login to Continue
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-4 text-[32px] font-semibold leading-none">
                {formatINR(walletBalance)} <span className="text-base font-medium text-[#8490a4]">available</span>
              </p>
              {welcomeChatApplies ? (
                <div className="mt-5 rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-4 text-sm font-semibold text-fuchsia-800">
                  Your first chat includes {welcomeChatBonus?.freeMinutes ?? 10} free minutes. Audio and video use wallet balance.
                </div>
              ) : USE_PROFILE_CLIENT_WALLET_PRECHECK && !hasSufficientBalance ? (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="font-semibold text-red-700">Insufficient Balance</p>
                  {selectedType === "chat" ? (
                    <p className="mt-1 text-sm font-medium text-red-600">
                      Minimum INR 50 wallet balance is required to start a chat.
                    </p>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-red-600">
                      Required: {formatINR(requiredAmount)} ({multiplier}x service price)
                    </p>
                  )}
                  <p className="text-sm font-medium text-red-600">Shortfall: {formatINR(shortfall)}</p>
                  <Link
                    href="/wallet?addMoney=1"
                    className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-[#c8191e] text-sm font-semibold text-white"
                  >
                    Add Money
                  </Link>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                  Sufficient Balance
                </div>
              )}
            </>
          )}
        </div>

        {actionMessage ? <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">{actionMessage}</p> : null}
        {showAddMoneyPrompt ? (
          <Link
            href="/wallet?addMoney=1"
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#c8191e] text-sm font-semibold text-white"
          >
            Add Money
          </Link>
        ) : null}

        <button
          type="button"
          disabled={USE_PROFILE_CLIENT_WALLET_PRECHECK && authChecked && loggedIn && !hasSufficientBalance}
          onClick={handlePrimaryAction}
          className="mt-6 h-14 w-full rounded-xl bg-emerald-600 text-base font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {!authChecked
            ? "Checking..."
            : USE_PROFILE_CLIENT_WALLET_PRECHECK && loggedIn && !hasSufficientBalance
              ? "Insufficient Balance"
              : loggedIn
                ? primaryActionLabel
                : "Login to Continue"}
        </button>
      </section>

      <section className="rounded-[22px] border border-[#e6e2eb] bg-white p-6 shadow-[0_10px_35px_rgba(43,31,63,0.06)]">
        {companion.sessions > 0 ? (
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0e9ff] text-[#6b2ff2]">
              <BarChart3 size={24} />
            </span>
            <div>
              <p className="text-[34px] font-semibold leading-none text-[#201a2f]">{companion.sessions}</p>
              <p className="text-sm font-medium text-[#8490a4]">Sessions Completed</p>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-[#7d7288]">Completed sessions will appear here once available.</p>
        )}

        {companion.languages.length > 0 ? (
          <div className={companion.sessions > 0 ? "mt-6 border-t border-[#ece7ef] pt-5" : "mt-4"}>
            <h3 className="text-sm font-semibold text-[#44394f]">Languages</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {companion.languages.map((language) => (
                <span key={language} className="rounded-md border border-[#e6e2eb] bg-[#fbf8ff] px-2.5 py-1 text-xs font-semibold text-[#5f536a]">
                  {language}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className={companion.sessions > 0 ? "mt-6 border-t border-[#ece7ef] pt-5 text-sm text-[#7d7288]" : "mt-4 text-sm text-[#7d7288]"}>
            Languages will appear once the partner updates profile details.
          </p>
        )}
      </section>
    </aside>
  );
}
