import { apiRequest } from "@/lib/api/client";

export type SessionServiceType = "chat" | "audio" | "video";
export type SessionStatus =
  | "PENDING"
  | "LIVE"
  | "COMPLETED"
  | "FAILED"
  | "FLAGGED";

export type SessionRecord = {
  id: string;
  sessionCode?: string;
  channelName?: string;
  companionId: string;
  userId?: string;
  serviceType?: "CHAT" | "AUDIO" | "VIDEO";
  status?: SessionStatus;
  createdAt?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  amount?: number;
  user?: Record<string, unknown> | null;
  companion?: Record<string, unknown> | null;
};

export async function createSession(payload: {
  companionId: string;
  serviceType: SessionServiceType;
  bookingId?: string;
}) {
  const result = await apiRequest<{ session: SessionRecord }>("/api/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.error) return { data: null, error: result.error };
  return { data: result.data?.session ?? null, error: null };
}

export async function getMySessions() {
  const result = await apiRequest<{ sessions: SessionRecord[] }>("/api/sessions");
  if (result.error) return { data: [], error: result.error };
  return { data: result.data?.sessions ?? [], error: null };
}

export async function getSessionById(sessionId: string) {
  const result = await apiRequest<{ session: SessionRecord }>(`/api/sessions/${sessionId}`);
  if (result.error) return { data: null, error: result.error };
  return { data: result.data?.session ?? null, error: null };
}

export async function cancelSession(sessionId: string) {
  const result = await apiRequest<{ session: SessionRecord; message?: string }>(`/api/sessions/${sessionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (result.error) return { data: null, error: result.error };
  return { data: result.data?.session ?? null, error: null };
}
