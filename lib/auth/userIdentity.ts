"use client";

import { apiRequest } from "@/lib/api/client";
import { getUserAuthState, saveUserAuthSession, type UserAuthState } from "@/lib/auth/userAuth";

type UserProfileResponse = {
  user?: {
    phoneNumber?: unknown;
    phone?: unknown;
    name?: unknown;
    email?: unknown;
    profileImageUrl?: unknown;
  } | null;
};

export type AuthenticatedUserIdentity = {
  normalizedPhone: string | null;
  name: string | null;
  email: string | null;
  profileImageUrl: string | null;
};

export type DropdownUserIdentity = {
  normalizedPhone: string | null;
  maskedPhoneLabel: string;
  fullPhoneText: string | null;
  hasPhone: boolean;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeText(value: unknown): string | null {
  if (!isNonEmptyString(value)) return null;
  return value.trim();
}

export function normalizeUserPhone(value: unknown): string | null {
  if (!isNonEmptyString(value)) return null;
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (digits.length > 10) {
    return `+${digits}`;
  }
  return null;
}

export function toMaskedPhoneLabel(phone: string | null): string {
  if (!phone) return "User";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 3) return "User";
  const tail = digits.slice(-4);
  return `***${tail.length === 4 ? tail : digits.slice(-3)}`;
}

export function buildDropdownUserIdentity(phoneValue: unknown): DropdownUserIdentity {
  const normalizedPhone = normalizeUserPhone(phoneValue);
  if (!normalizedPhone) {
    return {
      normalizedPhone: null,
      maskedPhoneLabel: "User",
      fullPhoneText: null,
      hasPhone: false,
    };
  }

  return {
    normalizedPhone,
    maskedPhoneLabel: toMaskedPhoneLabel(normalizedPhone),
    fullPhoneText: normalizedPhone,
    hasPhone: true,
  };
}

export function getDropdownUserIdentityFromAuthState(state?: UserAuthState): DropdownUserIdentity {
  const authState = state ?? getUserAuthState();
  if (!authState.loggedIn) return buildDropdownUserIdentity(null);
  return buildDropdownUserIdentity(authState.phone);
}

export async function fetchAuthenticatedUserProfilePhone() {
  const authState = getUserAuthState();
  if (!authState.loggedIn) return null;

  const result = await apiRequest<UserProfileResponse>("/api/users/me");
  const backendPhone = normalizeUserPhone(result.data?.user?.phoneNumber ?? result.data?.user?.phone);
  if (backendPhone) {
    saveUserAuthSession({ phone: backendPhone });
  }
  return backendPhone;
}

export async function fetchAuthenticatedUserIdentity(): Promise<AuthenticatedUserIdentity | null> {
  const authState = getUserAuthState();
  if (!authState.loggedIn) return null;

  const summaryResult = await apiRequest<UserProfileResponse>("/api/users/me/profile-summary");
  const fallbackResult = summaryResult.error ? await apiRequest<UserProfileResponse>("/api/users/me") : null;
  const user = summaryResult.data?.user ?? fallbackResult?.data?.user;

  const normalizedPhone = normalizeUserPhone(user?.phoneNumber ?? user?.phone);
  if (normalizedPhone) {
    saveUserAuthSession({ phone: normalizedPhone });
  }

  return {
    normalizedPhone,
    name: normalizeText(user?.name),
    email: normalizeText(user?.email),
    profileImageUrl: normalizeText(user?.profileImageUrl),
  };
}
