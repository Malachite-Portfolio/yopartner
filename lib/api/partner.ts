import { apiRequest } from "@/lib/api/client";

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

export async function submitPartnerApplication(payload: Record<string, unknown>) {
  return apiRequest<{ success: boolean; message?: string }>("/api/partner/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPartnerProfile() {
  const result = await apiRequest<{ profile: Record<string, unknown> }>("/api/partner/profile");
  if (result.error) return { data: null, error: result.error };
  return { data: result.data?.profile ?? null, error: null };
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
