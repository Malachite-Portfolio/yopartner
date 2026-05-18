import { apiRequest } from "@/lib/api/client";
import { ADMIN_LOGIN_KEY } from "@/lib/adminData";

export const ADMIN_AUTH_TOKEN_KEY = "yopartner_admin_auth_token";
export const ADMIN_LOGIN_ID_KEY = "yopartner_admin_login_id";
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
  needsLogin: boolean;
  forbidden: boolean;
  message?: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredAdminToken() {
  if (!canUseStorage()) return null;
  const token = window.localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
  if (!token || token.trim().length === 0) return null;
  return token.trim();
}

export function setAdminAuthSession(params: { token: string; loginId?: string }) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ADMIN_LOGIN_KEY, "true");
  window.localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, params.token);
  if (params.loginId) {
    window.localStorage.setItem(ADMIN_LOGIN_ID_KEY, params.loginId);
  }
}

export function clearAdminAuthSession() {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ADMIN_LOGIN_KEY, "false");
  window.localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_LOGIN_ID_KEY);
  window.localStorage.removeItem(ADMIN_FIREBASE_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_FIREBASE_UID_KEY);
  window.localStorage.removeItem(ADMIN_FIREBASE_PHONE_KEY);
}

export async function verifyAdminRole(): Promise<AdminRoleCheckResult> {
  const token = getStoredAdminToken();
  if (!token) {
    return { role: null, status: 401, message: "Admin login required." };
  }

  const meResponse = await apiRequest<Record<string, unknown>>("/api/admin/auth/me");
  if (meResponse.data) {
    const admin = (meResponse.data as Record<string, unknown>).admin as Record<string, unknown> | undefined;
    const role = String(admin?.role ?? "").toUpperCase();
    if (role === "ADMIN") {
      return { role: "ADMIN" };
    }
  }

  if (meResponse.error && meResponse.error.status && meResponse.error.status !== 404) {
    return { role: null, status: meResponse.error.status, message: meResponse.error.message };
  }

  const dashboardResponse = await apiRequest<Record<string, unknown>>("/api/admin/dashboard");
  if (dashboardResponse.data) {
    return { role: "ADMIN" };
  }

  return {
    role: null,
    status: dashboardResponse.error?.status,
    message: dashboardResponse.error?.message ?? "Unable to verify admin role.",
  };
}

export async function resolveAdminAccess(): Promise<AdminAccessState> {
  const token = getStoredAdminToken();
  if (!token) {
    return {
      allowed: false,
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
      needsLogin: false,
      forbidden: false,
    };
  }

  if (roleCheck.status === 401) {
    clearAdminAuthSession();
    return {
      allowed: false,
      needsLogin: true,
      forbidden: false,
      message: "Please login as an admin to continue.",
    };
  }

  if (roleCheck.status === 403) {
    return {
      allowed: false,
      needsLogin: false,
      forbidden: true,
      message: "You do not have permission to access the admin panel.",
    };
  }

  return {
    allowed: false,
    needsLogin: false,
    forbidden: true,
    message: roleCheck.message ?? "You do not have permission to access the admin panel.",
  };
}
