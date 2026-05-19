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
  type?: "CHAT" | "AUDIO" | "VIDEO";
  agoraToken?: string | null;
  agoraUid?: string | number | null;
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

export type SessionMessageRecord = {
  id: string;
  sessionId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
  senderUser?: {
    id: string;
    phoneNumber?: string;
    name?: string | null;
  };
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

export async function endSession(sessionId: string) {
  const result = await apiRequest<{ session: SessionRecord; message?: string }>(`/api/sessions/${sessionId}/end`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (result.error) return { data: null, error: result.error };
  return { data: result.data?.session ?? null, error: null };
}

export async function getSessionMessages(sessionId: string) {
  const result = await apiRequest<{ messages: SessionMessageRecord[] }>(`/api/sessions/${sessionId}/messages`);
  if (result.error) return { data: [], error: result.error };
  return { data: result.data?.messages ?? [], error: null };
}

export async function sendSessionMessage(sessionId: string, body: string) {
  const result = await apiRequest<{ message: SessionMessageRecord }>(`/api/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  if (result.error) return { data: null, error: result.error };
  return { data: result.data?.message ?? null, error: null };
}

export async function getSessionAgoraToken(sessionId: string) {
  const result = await apiRequest<{
    appId: string;
    token: string;
    channelName: string;
    uid: number | string;
    expiresAt?: number;
  }>(`/api/sessions/${sessionId}/agora-token`);
  if (result.error) return { data: null, error: result.error };
  return { data: result.data ?? null, error: null };
}
