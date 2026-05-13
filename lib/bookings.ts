"use client";

import {
  addWalletTransaction,
  getWalletBalance,
  type SessionServiceType,
} from "@/lib/wallet";

export const BOOKINGS_KEY = "yopartner_demo_bookings";
export const BOOKINGS_UPDATED_EVENT = "yopartner-bookings-updated";

export type BookingStatus = "Confirmed" | "Pending" | "Completed";

export type DemoBooking = {
  id: string;
  bookingId: string;
  companionName: string;
  companionId: string;
  serviceType: SessionServiceType;
  price: number;
  routeSource: "connect-now" | "home-visit";
  status: BookingStatus;
  createdAt: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitBookingsUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BOOKINGS_UPDATED_EVENT));
}

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toServiceType(value: unknown): SessionServiceType {
  return value === "chat" || value === "audio" || value === "video" || value === "visit"
    ? value
    : "chat";
}

function toStatus(value: unknown): BookingStatus {
  return value === "Confirmed" || value === "Pending" || value === "Completed" ? value : "Confirmed";
}

function createBookingId() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `YP-${Date.now().toString().slice(-6)}-${random}`;
}

export function getDemoBookings(): DemoBooking[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(BOOKINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      id: String(item.id ?? `${Date.now()}`),
      bookingId: String(item.bookingId ?? createBookingId()),
      companionName: String(item.companionName ?? "Unknown"),
      companionId: String(item.companionId ?? ""),
      serviceType: toServiceType(item.serviceType),
      price: safeNumber(item.price),
      routeSource: item.routeSource === "home-visit" ? "home-visit" : "connect-now",
      status: toStatus(item.status),
      createdAt: String(item.createdAt ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

export function setDemoBookings(bookings: DemoBooking[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  emitBookingsUpdate();
}

export function subscribeBookingUpdates(onUpdate: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    if (event instanceof StorageEvent && event.key && event.key !== BOOKINGS_KEY) {
      return;
    }
    onUpdate();
  };

  window.addEventListener("storage", handler);
  window.addEventListener(BOOKINGS_UPDATED_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(BOOKINGS_UPDATED_EVENT, handler);
  };
}

export function createDemoBooking(params: {
  companionName: string;
  companionId: string;
  serviceType: SessionServiceType;
  price: number;
  routeSource: "connect-now" | "home-visit";
}) {
  const price = safeNumber(params.price);
  if (!canUseStorage() || price <= 0) {
    return { success: false as const, reason: "invalid_price" as const };
  }

  const balance = getWalletBalance();
  if (balance < price) {
    return { success: false as const, reason: "insufficient_balance" as const };
  }

  const booking: DemoBooking = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    bookingId: createBookingId(),
    companionName: params.companionName,
    companionId: params.companionId,
    serviceType: params.serviceType,
    price,
    routeSource: params.routeSource,
    status: "Confirmed",
    createdAt: new Date().toISOString(),
  };

  const nextBookings = [booking, ...getDemoBookings()];
  setDemoBookings(nextBookings);

  addWalletTransaction({
    type: "booking",
    amountAdded: -price,
    paidAmount: price,
    bonus: 0,
    description: `Session booked with ${params.companionName} (${params.serviceType.toUpperCase()})`,
  });

  return { success: true as const, booking };
}
