import { apiRequest } from "@/lib/api/client";

export type UserProfileRecord = {
  id: string;
  firebaseUid: string;
  phoneNumber: string;
  name: string | null;
  email: string | null;
  age: number | null;
  gender: string | null;
  profileImageUrl: string | null;
  onboardingCompletedAt: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  verificationStatus?: string | null;
};

type UserProfileResponse = {
  user?: Partial<UserProfileRecord> | null;
  profileComplete?: boolean;
};

export type UserProfileSummaryStats = {
  activeConversations: number;
  totalSessions: number;
  completedSessions: number;
  memberSince: string | null;
  lastLogin: string | null;
};

type UserProfileSummaryResponse = UserProfileResponse & {
  stats?: Partial<UserProfileSummaryStats> | null;
};

export type WelcomeChatBonusResponse = {
  available: boolean;
  freeMinutes: number;
  rewardId?: string | null;
  expiresAt?: string | null;
};

export type UpdateUserProfileInput = {
  name: string;
  email: string;
  age: number;
  gender?: string;
  profileImageUrl: string;
};

function toText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function toCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return Math.floor(value);
  return 0;
}

function normalizeUserProfile(input: Partial<UserProfileRecord> | null | undefined): UserProfileRecord | null {
  if (!input) return null;
  const id = toText(input.id);
  const firebaseUid = toText(input.firebaseUid);
  const phoneNumber = toText(input.phoneNumber);
  if (!id || !firebaseUid || !phoneNumber) return null;

  return {
    id,
    firebaseUid,
    phoneNumber,
    name: toText(input.name),
    email: toText(input.email),
    age: toNumber(input.age),
    gender: toText(input.gender),
    profileImageUrl: toText(input.profileImageUrl),
    onboardingCompletedAt: toText(input.onboardingCompletedAt),
    createdAt: toText(input.createdAt),
    updatedAt: toText(input.updatedAt),
    verificationStatus: toText(input.verificationStatus),
  };
}

export function isUserProfileComplete(profile: UserProfileRecord | null, explicit?: boolean) {
  if (typeof explicit === "boolean") return explicit;
  if (!profile) return false;
  const hasName = Boolean(profile.name && profile.name.trim().length >= 2);
  const hasEmail = Boolean(profile.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email));
  const hasAge = typeof profile.age === "number" && profile.age >= 18;
  const hasProfileImage = Boolean(profile.profileImageUrl && profile.profileImageUrl.startsWith("https://"));
  return hasName && hasEmail && hasAge && hasProfileImage;
}

export async function getCurrentUserProfile() {
  const result = await apiRequest<UserProfileResponse>("/api/users/me");
  if (result.error) return { data: null, error: result.error };
  const profile = normalizeUserProfile(result.data?.user);
  return {
    data: {
      user: profile,
      profileComplete: isUserProfileComplete(profile, result.data?.profileComplete),
    },
    error: null,
  };
}

export async function updateCurrentUserProfile(payload: UpdateUserProfileInput) {
  const result = await apiRequest<UserProfileResponse>("/api/users/me/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (result.error) return { data: null, error: result.error };
  const profile = normalizeUserProfile(result.data?.user);
  return {
    data: {
      user: profile,
      profileComplete: isUserProfileComplete(profile, result.data?.profileComplete),
    },
    error: null,
  };
}

export async function getCurrentUserProfileSummary() {
  const result = await apiRequest<UserProfileSummaryResponse>("/api/users/me/profile-summary");
  if (result.error) return { data: null, error: result.error };
  const profile = normalizeUserProfile(result.data?.user);
  return {
    data: {
      user: profile,
      profileComplete: isUserProfileComplete(profile, result.data?.profileComplete),
      stats: {
        activeConversations: toCount(result.data?.stats?.activeConversations),
        totalSessions: toCount(result.data?.stats?.totalSessions),
        completedSessions: toCount(result.data?.stats?.completedSessions),
        memberSince: toText(result.data?.stats?.memberSince) ?? profile?.createdAt ?? null,
        lastLogin: toText(result.data?.stats?.lastLogin),
      } satisfies UserProfileSummaryStats,
    },
    error: null,
  };
}

export async function getWelcomeChatBonus() {
  const result = await apiRequest<WelcomeChatBonusResponse>("/api/users/me/rewards/welcome-chat");
  if (result.error) return { data: null, error: result.error };
  return {
    data: {
      available: Boolean(result.data?.available),
      freeMinutes: toCount(result.data?.freeMinutes),
      rewardId: toText(result.data?.rewardId),
      expiresAt: toText(result.data?.expiresAt),
    } satisfies WelcomeChatBonusResponse,
    error: null,
  };
}
