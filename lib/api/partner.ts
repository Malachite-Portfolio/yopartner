import { apiRequest } from "@/lib/api/client";
import { PARTNER_FIREBASE_TOKEN_KEY } from "@/lib/auth/firebasePhoneAuth";

export type PartnerRequestType = "CHAT" | "AUDIO" | "VIDEO";

export type PartnerIncomingRequest = {
  id: string;
  memberLabel: string;
  memberName?: string;
  memberPhoneMasked?: string;
  type: PartnerRequestType;
  expectedRate: number;
  createdAt: string;
};

export type PartnerActiveSession = {
  id: string;
  memberLabel: string;
  memberName?: string;
  memberPhoneMasked?: string;
  type: PartnerRequestType;
  expectedRate: number;
  startedAt: string | null;
  status: string;
};

export type PartnerDashboardPayload = {
  approvalState?: Record<string, unknown>;
  approved?: boolean;
  message?: string;
  stats?: Record<string, unknown>;
  pendingRequests?: PartnerIncomingRequest[];
  activeSessions?: PartnerActiveSession[];
  companion?: Record<string, unknown> | null;
  availability?: {
    isOnline?: boolean;
    isBusy?: boolean;
    effectiveStatus?: "ONLINE" | "BUSY" | "OFFLINE";
  } | null;
};

export type PartnerAvailabilityPayload = {
  isOnline: boolean;
  companion?: Record<string, unknown> | null;
};

export type PartnerPresencePayload = {
  isOnline?: boolean;
  rawIsOnline?: boolean;
  presenceFresh?: boolean;
  effectiveStatus?: "ONLINE" | "BUSY" | "OFFLINE";
  updatedAt?: string;
};

export type PartnerProfileMediaItem = {
  imageUrl: string;
  storagePath: string;
};

export type PartnerProfileMediaPayload = {
  profileImageUrl: string | null;
  profileImageStoragePath: string | null;
  resolvedProfileImageUrl?: string | null;
  galleryImages: PartnerProfileMediaItem[];
};

export type PartnerProfilePayload = {
  companion?: Record<string, unknown> | null;
  profile?: Record<string, unknown> | null;
  application?: Record<string, unknown> | null;
};

export async function submitPartnerApplication(payload: Record<string, unknown>) {
  return apiRequest<{ success: boolean; message?: string }>("/api/partner/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPartnerProfile() {
  const result = await apiRequest<PartnerProfilePayload>(
    "/api/partner/profile",
  );
  if (result.error) return { data: null, error: result.error };
  return { data: result.data ?? null, error: null };
}

export async function updatePartnerProfile(payload: Record<string, unknown>) {
  const result = await apiRequest<{ success: boolean }>("/api/partner/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (result.error) return { data: null, error: result.error };
  return result;
}

export async function getPartnerDashboard() {
  const result = await apiRequest<PartnerDashboardPayload>("/api/partner/dashboard");
  if (result.error) return { data: null, error: result.error };
  return result;
}

export async function getPartnerApplications() {
  const result = await apiRequest<Record<string, unknown>>("/api/partner/applications");
  if (result.error) return { data: null, error: result.error };
  return result;
}

export async function getPartnerChats() {
  const result = await apiRequest<{ chats: Record<string, unknown>[] }>("/api/partner/chats");
  if (result.error) return { data: [], error: result.error };
  return { data: result.data?.chats ?? [], error: null };
}

export async function getPartnerBookings() {
  const result = await apiRequest<{ bookings: Record<string, unknown>[] }>("/api/partner/bookings");
  if (result.error) return { data: [], error: result.error };
  return { data: result.data?.bookings ?? [], error: null };
}

export async function getPartnerEarnings() {
  const result = await apiRequest<{ earnings: Record<string, unknown>[] }>("/api/partner/earnings");
  if (result.error) return { data: [], error: result.error };
  return { data: result.data?.earnings ?? [], error: null };
}

export async function getPartnerRequests() {
  const result = await apiRequest<{ pendingRequests: PartnerIncomingRequest[] }>("/api/partner/requests");
  if (result.error) return { data: [], error: result.error };
  return { data: result.data?.pendingRequests ?? [], error: null };
}

export async function acceptPartnerRequest(requestId: string) {
  return apiRequest<Record<string, unknown>>(`/api/partner/requests/${requestId}/accept`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function declinePartnerRequest(requestId: string) {
  return apiRequest<Record<string, unknown>>(`/api/partner/requests/${requestId}/decline`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function updatePartnerSettings(payload: Record<string, unknown>) {
  const result = await apiRequest<{ success: boolean }>("/api/partner/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (result.error) return { data: null, error: result.error };
  return result;
}

export async function updatePartnerAvailability(isOnline: boolean) {
  const result = await apiRequest<PartnerAvailabilityPayload>("/api/partner/availability", {
    method: "PATCH",
    body: JSON.stringify({ isOnline }),
  });
  if (result.error) return { data: null, error: result.error };
  return result;
}

export async function markPartnerPresenceOnline() {
  const result = await apiRequest<PartnerPresencePayload>("/api/partner/presence/online", {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (result.error) return { data: null, error: result.error };
  return result;
}

export async function heartbeatPartnerPresence() {
  const result = await apiRequest<PartnerPresencePayload>("/api/partner/presence/heartbeat", {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (result.error) return { data: null, error: result.error };
  return result;
}

export async function markPartnerPresenceOffline() {
  const result = await apiRequest<PartnerPresencePayload>("/api/partner/presence/offline", {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (result.error) return { data: null, error: result.error };
  return result;
}

function resolveApiUrl(input: string) {
  if (!input.startsWith("/")) return input;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl) return input;
  return `${baseUrl.replace(/\/+$/, "")}${input}`;
}

export function sendPartnerOfflineBeacon() {
  if (typeof window === "undefined") return;
  const token = window.localStorage.getItem(PARTNER_FIREBASE_TOKEN_KEY)?.trim();
  if (!token) return;

  const payload = JSON.stringify({ token });
  const beaconUrl = resolveApiUrl("/api/partner/presence/offline-beacon");
  const blob = new Blob([payload], { type: "application/json" });

  let beaconSent = false;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      beaconSent = navigator.sendBeacon(beaconUrl, blob);
    }
  } catch {
    beaconSent = false;
  }

  if (!beaconSent) {
    void fetch(beaconUrl, {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => undefined);
  }
}

function normalizePartnerProfileMedia(data: PartnerProfileMediaPayload | null | undefined): PartnerProfileMediaPayload {
  return {
    profileImageUrl: data?.profileImageUrl ?? null,
    profileImageStoragePath: data?.profileImageStoragePath ?? null,
    resolvedProfileImageUrl: data?.resolvedProfileImageUrl ?? null,
    galleryImages: Array.isArray(data?.galleryImages)
      ? data!.galleryImages.filter(
          (item): item is PartnerProfileMediaItem =>
            Boolean(item && typeof item.imageUrl === "string" && typeof item.storagePath === "string"),
        )
      : [],
  };
}

export async function getPartnerProfileMedia() {
  const result = await apiRequest<PartnerProfileMediaPayload>("/api/partner/profile/media");
  if (result.error) return { data: null, error: result.error };
  return { data: normalizePartnerProfileMedia(result.data), error: null };
}

export async function updatePartnerProfileImage(payload: { imageUrl: string; storagePath: string }) {
  const result = await apiRequest<{
    profileImageUrl: string | null;
    profileImageStoragePath: string | null;
  }>("/api/partner/profile/media/profile-image", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (result.error) return { data: null, error: result.error };
  return {
    data: {
      profileImageUrl: result.data?.profileImageUrl ?? null,
      profileImageStoragePath: result.data?.profileImageStoragePath ?? null,
    },
    error: null,
  };
}

export async function addPartnerGalleryImage(payload: { imageUrl: string; storagePath: string }) {
  const result = await apiRequest<{ galleryImages: PartnerProfileMediaItem[] }>("/api/partner/profile/media/gallery", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.error) return { data: null, error: result.error };
  return {
    data: {
      galleryImages: normalizePartnerProfileMedia({
        profileImageUrl: null,
        profileImageStoragePath: null,
        galleryImages: result.data?.galleryImages ?? [],
      }).galleryImages,
    },
    error: null,
  };
}

export async function deletePartnerGalleryImage(payload: { imageUrl?: string; storagePath?: string }) {
  const result = await apiRequest<{ galleryImages: PartnerProfileMediaItem[] }>("/api/partner/profile/media/gallery", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
  if (result.error) return { data: null, error: result.error };
  return {
    data: {
      galleryImages: normalizePartnerProfileMedia({
        profileImageUrl: null,
        profileImageStoragePath: null,
        galleryImages: result.data?.galleryImages ?? [],
      }).galleryImages,
    },
    error: null,
  };
}
