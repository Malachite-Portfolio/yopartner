import { ADMIN_LOGIN_KEY } from "@/lib/adminData";
import { apiRequest } from "@/lib/api/client";
import { clearClientDemoAdminSession, isClientDemoAdminSessionActive, isClientDemoEnabled } from "@/lib/clientDemoData";

export const ADMIN_FIREBASE_UID_KEY = "yopartner_admin_firebase_uid";
export const ADMIN_FIREBASE_PHONE_KEY = "yopartner_admin_phone";
export const ADMIN_FIREBASE_TOKEN_KEY = "yopartner_admin_firebase_id_token";

type AdminRoleCheckResult = {
  role: string | null;
  status?: number;
  message?: string;
};

export type AdminAccessState = {
  allowed: boolean;
  isDemo: boolean;
  needsLogin: boolean;
  forbidden: boolean;
  message?: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function extractRoleFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const user = (root.user ?? {}) as Record<string, unknown>;
  const me = (root.me ?? {}) as Record<string, unknown>;
  const data = (root.data ?? {}) as Record<string, unknown>;
  const candidates = [root.role, user.role, me.role, data.role];

  for (const value of candidates) {
    const role = String(value ?? "").trim().toUpperCase();
    if (role) return role;
  }
  return null;
}

export function getStoredAdminToken() {
  if (!canUseStorage()) return null;
  const token = window.localStorage.getItem(ADMIN_FIREBASE_TOKEN_KEY);
  if (!token || token.trim().length === 0) return null;
  return token.trim();
}

export function setAdminAuthSession(params: { idToken: string; uid: string; phone: string }) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ADMIN_LOGIN_KEY, "true");
  window.localStorage.setItem(ADMIN_FIREBASE_TOKEN_KEY, params.idToken);
  window.localStorage.setItem(ADMIN_FIREBASE_UID_KEY, params.uid);
  window.localStorage.setItem(ADMIN_FIREBASE_PHONE_KEY, params.phone);
}

export function clearAdminAuthSession() {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ADMIN_LOGIN_KEY, "false");
  window.localStorage.removeItem(ADMIN_FIREBASE_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_FIREBASE_UID_KEY);
  window.localStorage.removeItem(ADMIN_FIREBASE_PHONE_KEY);
  clearClientDemoAdminSession();
}

export async function verifyAdminRole(): Promise<AdminRoleCheckResult> {
  const token = getStoredAdminToken();
  if (!token) {
    return { role: null, status: 401, message: "Admin login required." };
  }

  const meResponse = await apiRequest<Record<string, unknown>>("/api/auth/me");
  if (meResponse.data) {
    const role = extractRoleFromPayload(meResponse.data);
    if (role) return { role };
  }
  if (meResponse.error && meResponse.error.status && meResponse.error.status !== 404) {
    return { role: null, status: meResponse.error.status, message: meResponse.error.message };
  }

  const usersResponse = await apiRequest<Record<string, unknown>>("/api/users");
  if (usersResponse.data) {
    const role = extractRoleFromPayload(usersResponse.data);
    if (role) return { role };
  }
  if (usersResponse.error && usersResponse.error.status && usersResponse.error.status !== 404) {
    return { role: null, status: usersResponse.error.status, message: usersResponse.error.message };
  }

  const adminDashboardResponse = await apiRequest<Record<string, unknown>>("/api/admin/dashboard");
  if (adminDashboardResponse.data) {
    return { role: "ADMIN" };
  }
  return {
    role: null,
    status: adminDashboardResponse.error?.status,
    message: adminDashboardResponse.error?.message ?? "Unable to verify admin role.",
  };
}

export async function resolveAdminAccess(): Promise<AdminAccessState> {
  if (isClientDemoEnabled() && isClientDemoAdminSessionActive()) {
    return {
      allowed: true,
      isDemo: true,
      needsLogin: false,
      forbidden: false,
    };
  }

  const token = getStoredAdminToken();
  if (!token) {
    return {
      allowed: false,
      isDemo: false,
      needsLogin: true,
      forbidden: false,
      message: "Admin login required.",
    };
  }

  const roleCheck = await verifyAdminRole();
  if (roleCheck.role === "ADMIN") {
    if (canUseStorage()) {
      window.localStorage.setItem(ADMIN_LOGIN_KEY, "true");
    }
    return {
      allowed: true,
      isDemo: false,
      needsLogin: false,
      forbidden: false,
    };
  }

  if (roleCheck.status === 401) {
    return {
      allowed: false,
      isDemo: false,
      needsLogin: true,
      forbidden: false,
      message: "Please login as an admin to continue.",
    };
  }

  if (roleCheck.status === 403) {
    return {
      allowed: false,
      isDemo: false,
      needsLogin: false,
      forbidden: true,
      message: "You do not have permission to access the admin panel.",
    };
  }

  return {
    allowed: false,
    isDemo: false,
    needsLogin: false,
    forbidden: true,
    message: roleCheck.message ?? "You do not have permission to access the admin panel.",
  };
}
