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
  durationSeconds?: number;
  reward?: {
    appliedRewardId: string;
    appliedRewardType:
      | "FREE_CALL_MINUTES"
      | "FREE_CHAT_MINUTES"
      | "VIDEO_DISCOUNT_PERCENT"
      | "TALK_TIME_CREDIT"
      | string;
    freeSeconds: number | null;
    shouldAutoEndAtFreeLimit: boolean;
    walletCannotContinue?: boolean;
  } | null;
  billingLimit?: {
    maxAllowedSeconds: number | null;
    warningAtSeconds: number | null;
    autoEndAt: string | null;
    billingLimitSeconds?: number | null;
    remainingSeconds?: number | null;
    shouldAutoEnd?: boolean;
  } | null;
  user?: {
    id: string;
    name?: string | null;
    fullName?: string | null;
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
    giftKey: string;
    giftName: string;
    giftEmoji: string;
    amount: number;
    quantity?: number;
    unitAmount?: number;
  } | null;
  createdAt: string;
  isMine?: boolean;
  senderUser?: {
    id: string;
    phoneNumber?: string;
    name?: string | null;
    fullName?: string | null;
  };
};

export type GiftKey = string;
export type GiftQuantity = 1 | 10 | 50 | 100;

export function getSessionRewardLimitSeconds(
  session: SessionRecord | null | undefined,
  rewardType: string,
) {
  const reward = session?.reward;
  if (reward?.appliedRewardType !== rewardType) return null;
  if (reward.shouldAutoEndAtFreeLimit === false) return null;

  const candidates = [
    reward.freeSeconds,
    session?.billingLimit?.maxAllowedSeconds,
    session?.billingLimit?.billingLimitSeconds,
  ];
  const limitSeconds = candidates.find((value) => typeof value === "number" && Number.isFinite(value) && value > 0);
  return typeof limitSeconds === "number" ? limitSeconds : null;
}

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

export async function sendSessionMessage(sessionId: string, body: string, clientMessageId?: string) {
  const messageClientId = clientMessageId ?? (
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const result = await apiRequest<{
    message: SessionMessageRecord;
    walletBalance?: number;
    chargeAmount?: number;
  }>(`/api/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: {
      "Idempotency-Key": messageClientId,
    },
    body: JSON.stringify({ body, clientMessageId: messageClientId }),
  });
  if (result.error) return { data: null, error: result.error };
  return {
    data: result.data?.message ?? null,
    error: null,
    walletBalance: result.data?.walletBalance,
    chargeAmount: result.data?.chargeAmount,
  };
}

export async function sendSessionGift(sessionId: string, giftKey: GiftKey, quantity: GiftQuantity = 1) {
  const result = await apiRequest<{
    walletBalance: number;
    gift: {
      giftKey: GiftKey;
      giftName: string;
      giftEmoji: string;
      amount: number;
      quantity: GiftQuantity;
      unitAmount: number;
    };
    message: SessionMessageRecord;
  }>(`/api/sessions/${sessionId}/gifts`, {
    method: "POST",
    body: JSON.stringify({ giftKey, quantity }),
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

export async function getSessionZegoToken(sessionId: string) {
  const result = await apiRequest<{
    appId: number;
    roomId: string;
    callID: string;
    userId: string;
    userName: string;
    token: string;
    expiresAt: number;
  }>("/api/calls/zego-token", {
    method: "POST",
    body: JSON.stringify({ callSessionId: sessionId }),
  });
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
