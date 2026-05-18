import { apiRequest } from "@/lib/api/client";

export type SessionServiceType = "chat" | "audio" | "video";

type SessionRecord = {
  id: string;
  sessionCode?: string;
  companionId: string;
  serviceType?: string;
  status?: string;
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

