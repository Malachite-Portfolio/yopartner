import { apiRequest } from "@/lib/api/client";

export type ReviewRecord = {
  id: string;
  sessionId: string | null;
  companionId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export async function submitSessionReview(payload: {
  sessionId: string;
  companionId: string;
  rating: number;
  feedback: string;
}) {
  const result = await apiRequest<{ review: ReviewRecord }>("/api/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.error) return { data: null, error: result.error };
  return { data: result.data?.review ?? null, error: null };
}
