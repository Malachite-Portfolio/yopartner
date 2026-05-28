import { apiRequest } from "@/lib/api/client";

export type SessionServiceType = "chat" | "audio" | "video";
export type SessionStatus =
  | "PENDING"
  | "ACCEPTED"
  | "LIVE"
  | "DECLINED"
  | "CANCELLED"
  | "ENDED"
  | "EXPIRED"
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
  acceptedAt?: string | null;
  startedAt?: string | null;
  liveStartedAt?: string | null;
  userMediaReadyAt?: string | null;
  partnerMediaReadyAt?: string | null;
  endedAt?: string | null;
  endedByUserId?: string | null;
  lastHeartbeatAt?: string | null;
  amount?: number;
  user?: {
    id: string;
    name?: string | null;
    phoneMasked?: string;
    phoneNumber?: string;
    [key: string]: unknown;
  } | null;
  companion?: {
    id: string;
    name?: string | null;
    userId?: string;
    [key: string]: unknown;
  } | null;
};

export type SessionMessageRecord = {
  id: string;
  sessionId: string;
  senderId?: string;
  senderUserId: string;
  senderRole?: "USER" | "PARTNER" | "UNKNOWN";
  messageType?: "TEXT" | "GIFT";
  text?: string;
  body: string;
  gift?: {
    giftKey: "rose" | "coffee" | "star" | "heart" | "crown" | "diamond";
    giftName: string;
    giftEmoji: string;
    amount: number;
  } | null;
  createdAt: string;
  isMine?: boolean;
  senderUser?: {
    id: string;
    phoneNumber?: string;
    name?: string | null;
  };
};

export type GiftKey = "rose" | "coffee" | "star" | "heart" | "crown" | "diamond";

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

export async function sendSessionGift(sessionId: string, giftKey: GiftKey) {
  const result = await apiRequest<{
    walletBalance: number;
    gift: {
      giftKey: GiftKey;
      giftName: string;
      giftEmoji: string;
      amount: number;
    };
    message: SessionMessageRecord;
  }>(`/api/sessions/${sessionId}/gifts`, {
    method: "POST",
    body: JSON.stringify({ giftKey }),
  });
  if (result.error) return { data: null, error: result.error };
  return {
    data: result.data
      ? {
          walletBalance: result.data.walletBalance,
          gift: result.data.gift,
          message: result.data.message,
        }
      : null,
    error: null,
  };
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

export async function markSessionMediaReady(sessionId: string) {
  const result = await apiRequest<{ session: SessionRecord }>(`/api/sessions/${sessionId}/mark-live`, {
    method: "POST",
    body: JSON.stringify({ mediaReady: true }),
  });
  if (result.error) return { data: null, error: result.error };
  return { data: result.data?.session ?? null, error: null };
}
