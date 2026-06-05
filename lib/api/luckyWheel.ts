import { apiRequest } from "@/lib/api/client";

export type LuckyWheelApiReward = {
  id: string;
  rewardIndex: number;
  type: string;
  clientType: "free_call" | "talktime" | "free_chat" | "video_discount";
  value: number;
  remainingValue: number;
  label: string;
  resultLabel: string;
  status?: string;
  createdAt?: string | null;
  expiresAt?: string | null;
  redeemedAt?: string | null;
};

export type LuckyWheelStatusPayload = {
  canSpin: boolean;
  nextSpinAt: string | null;
  lastReward: LuckyWheelApiReward | null;
  activeRewards: LuckyWheelApiReward[];
};

export type LuckyWheelSpinPayload = LuckyWheelStatusPayload & {
  spun: boolean;
  reward: LuckyWheelApiReward;
};

export async function getLuckyWheelStatus() {
  const result = await apiRequest<LuckyWheelStatusPayload>("/api/lucky-wheel/status");
  if (result.error) return { data: null, error: result.error };
  return {
    data: {
      canSpin: Boolean(result.data?.canSpin),
      nextSpinAt: result.data?.nextSpinAt ?? null,
      lastReward: result.data?.lastReward ?? null,
      activeRewards: Array.isArray(result.data?.activeRewards) ? result.data.activeRewards : [],
    },
    error: null,
  };
}

export async function spinLuckyWheel() {
  const result = await apiRequest<LuckyWheelSpinPayload>("/api/lucky-wheel/spin", {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (result.error) return { data: null, error: result.error };
  return { data: result.data ?? null, error: null };
}
