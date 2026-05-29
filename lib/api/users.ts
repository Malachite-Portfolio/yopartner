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
};

type UserProfileResponse = {
  user?: Partial<UserProfileRecord> | null;
  profileComplete?: boolean;
};

export type UpdateUserProfileInput = {
  name: string;
  email?: string;
  age: number;
  gender?: string;
  profileImageUrl?: string;
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
  };
}

export function isUserProfileComplete(profile: UserProfileRecord | null, explicit?: boolean) {
  if (typeof explicit === "boolean") return explicit;
  if (!profile) return false;
  return Boolean(profile.name && typeof profile.age === "number" && profile.age >= 18);
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
