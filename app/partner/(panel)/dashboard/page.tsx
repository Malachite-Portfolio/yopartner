"use client";

import { Clock3 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPartnerOnlineStatus,
  getPartnerProfile,
  setPartnerOnlineStatus,
} from "@/lib/partnerAuth";
import { defaultPartnerProfile, getPartnerSessions, type PartnerProfile } from "@/lib/partnerData";

type IncomingRequest = {
  id: string;
  userMaskedPhone: string;
  type: "Chat" | "Audio" | "Video" | "Visit";
  price: number;
  time: string;
};

const initialRequests: IncomingRequest[] = [
  { id: "r1", userMaskedPhone: "+91******9363", type: "Chat", price: 250, time: "Now" },
  { id: "r2", userMaskedPhone: "+91******7788", type: "Audio", price: 450, time: "2 min ago" },
  { id: "r3", userMaskedPhone: "+91******2231", type: "Video", price: 600, time: "5 min ago" },
  { id: "r4", userMaskedPhone: "+91******8841", type: "Visit", price: 1800, time: "10 min ago" },
];

const activityItems = [
  "New chat request received",
  "Audio call completed",
  "Wallet earning credited",
  "Profile reviewed",
];

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    value,
  );
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const profile = getPartnerProfile<PartnerProfile>(defaultPartnerProfile);
  const [online, setOnline] = useState(getPartnerOnlineStatus);
  const [requests, setRequests] = useState<IncomingRequest[]>(initialRequests);
  const sessions = getPartnerSessions() as Array<{
    id: string;
    userMaskedPhone: string;
    type: string;
    duration: string;
    status: string;
  }>;

  const handleAccept = (request: IncomingRequest) => {
    if (request.type === "Chat") {
      router.push("/partner/chats/demo-user-1");
      return;
    }
    if (request.type === "Audio") {
      router.push("/partner/calls/audio/demo-user-1");
      return;
    }
    if (request.type === "Video") {
      router.push("/partner/calls/video/demo-user-1");
      return;
    }
    router.push("/partner/bookings");
  };

  const toggleOnline = () => {
    const next = !online;
    setOnline(next);
    setPartnerOnlineStatus(next);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Welcome back, {profile.fullName || "YoPartner Companion"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Status:
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
              }`}
            >
              {online ? "Online" : "Offline"}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={toggleOnline}
          className="rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white"
        >
          {online ? "Go Offline" : "Go Online"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Today's Chats", "8"],
          ["Audio Calls", "3"],
          ["Video Calls", "2"],
          ["Pending Bookings", "4"],
          ["Earnings Today", "INR 1,250"],
          ["Rating", "4.9"],
        ].map((item) => (
          <article key={item[0]} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{item[0]}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{item[1]}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Incoming Requests</h3>
          <div className="mt-3 space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-slate-500">No pending requests.</p>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{request.userMaskedPhone}</p>
                      <p className="text-xs text-slate-500">
                        {request.type} - {formatINR(request.price)} - {request.time}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleAccept(request)}
                        className="rounded-lg bg-[#1d4ed8] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequests((current) => current.filter((item) => item.id !== request.id))}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Active Sessions</h3>
          <div className="mt-3 space-y-2">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{session.userMaskedPhone}</p>
                  <p className="text-xs text-slate-500">
                    {session.type} - {session.duration} - {session.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (session.type.toLowerCase() === "audio") router.push("/partner/calls/audio/demo-user-1");
                    else if (session.type.toLowerCase() === "video") router.push("/partner/calls/video/demo-user-1");
                    else router.push("/partner/chats/demo-user-1");
                  }}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
        <ul className="mt-3 space-y-2">
          {activityItems.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
              <Clock3 size={14} className="text-[#0ea5a6]" />
              {item}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
