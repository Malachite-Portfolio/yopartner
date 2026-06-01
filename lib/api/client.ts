import {
  PARTNER_FIREBASE_PHONE_KEY,
  PARTNER_FIREBASE_TOKEN_KEY,
  PARTNER_FIREBASE_UID_KEY,
  getCurrentFirebaseUser,
  subscribeFirebaseAuthState,
} from "@/lib/auth/firebasePhoneAuth";
import { PARTNER_LOGGED_IN_KEY, PARTNER_PHONE_KEY } from "@/lib/partnerAuth";
import { clearUserAuthSession, getUserAuthState, saveUserAuthSession } from "@/lib/auth/userAuth";

export type ApiClientError = {
  code?: string;
  message: string;
  status?: number;
  details?: unknown;
};

export type ApiResult<T> = {
  data: T | null;
  error: ApiClientError | null;
};

type AuthScope = "user" | "partner" | "admin";
type ApiUrlResolution = { url: string; configError?: null } | { url: null; configError: ApiClientError };

const ADMIN_AUTH_TOKEN_KEY = "yopartner_admin_auth_token";
const ADMIN_LOGIN_KEY = "yopartner_admin_login";
const ADMIN_LOGIN_ID_KEY = "yopartner_admin_login_id";
const ADMIN_FIREBASE_UID_KEY = "yopartner_admin_firebase_uid";
const ADMIN_FIREBASE_PHONE_KEY = "yopartner_admin_phone";
const ADMIN_FIREBASE_TOKEN_KEY = "yopartner_admin_firebase_id_token";

const PARTNER_SESSION_EXPIRED_MESSAGE =
  "Your login session could not be verified. Please login again as a partner.";
const PARTNER_SESSION_EXPIRED_REASON = "session-expired";

const PARTNER_AUTH_STORAGE_KEYS = [
  PARTNER_LOGGED_IN_KEY,
  PARTNER_PHONE_KEY,
  PARTNER_FIREBASE_UID_KEY,
  PARTNER_FIREBASE_PHONE_KEY,
  PARTNER_FIREBASE_TOKEN_KEY,
];
const ADMIN_AUTH_STORAGE_KEYS = [
  ADMIN_AUTH_TOKEN_KEY,
  ADMIN_LOGIN_ID_KEY,
  ADMIN_FIREBASE_UID_KEY,
  ADMIN_FIREBASE_PHONE_KEY,
  ADMIN_FIREBASE_TOKEN_KEY,
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function resolveConfiguredApiBaseUrl() {
  const publicBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (publicBaseUrl) return publicBaseUrl;

  if (typeof window === "undefined") {
    return process.env.API_BASE_URL?.trim() || process.env.BACKEND_API_BASE_URL?.trim() || "";
  }

  return "";
}

function isBackendManagedApiPath(path: string) {
  return (
    path.startsWith("/api/companions") ||
    path.startsWith("/api/sessions") ||
    path.startsWith("/api/bookings") ||
    path.startsWith("/api/wallet") ||
    path.startsWith("/api/payments") ||
    path.startsWith("/api/reviews") ||
    path.startsWith("/api/users") ||
    path.startsWith("/api/partner") ||
    path.startsWith("/api/admin")
  );
}

function resolveServerOrigin() {
  if (typeof window !== "undefined") return null;

  const configuredHost =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (!configuredHost) return null;

  if (/^https?:\/\//i.test(configuredHost)) {
    return configuredHost.replace(/\/+$/, "");
  }

  return `https://${configuredHost.replace(/\/+$/, "")}`;
}

function resolveApiUrl(input: string): ApiUrlResolution {
  if (!input.startsWith("/")) return { url: input };
  const baseUrl = resolveConfiguredApiBaseUrl();
  if (baseUrl) {
    return { url: `${baseUrl.replace(/\/+$/, "")}${input}` };
  }

  if (isBackendManagedApiPath(input)) {
    const isDevelopment = process.env.NODE_ENV !== "production";
    const detail = isDevelopment
      ? " NEXT_PUBLIC_API_BASE_URL is missing."
      : "";
    return {
      url: null,
      configError: {
        status: 503,
        message: `Service is temporarily unavailable.${detail}`,
      },
    };
  }

  const origin = resolveServerOrigin();
  if (origin) return { url: `${origin}${input}` };

  return { url: input };
}

function normalizeToken(raw: string | null | undefined) {
  if (!raw) return null;
  const token = raw.trim();
  return token.length > 0 ? token : null;
}

function resolveScope(path = ""): AuthScope {
  if (path.startsWith("/api/partner")) return "partner";
  if (path.startsWith("/api/admin")) return "admin";
  return "user";
}

function getScopeTokenKey(scope: AuthScope) {
  if (scope === "partner") return PARTNER_FIREBASE_TOKEN_KEY;
  if (scope === "admin") return ADMIN_AUTH_TOKEN_KEY;
  return "";
}

function getStoredTokenForScope(scope: AuthScope) {
  if (scope === "user") return getUserAuthState().token;
  if (!canUseStorage()) return null;
  return normalizeToken(window.localStorage.getItem(getScopeTokenKey(scope)));
}

function setStoredTokenForScope(scope: AuthScope, token: string) {
  if (scope === "user") {
    saveUserAuthSession({ token });
    return;
  }
  if (!canUseStorage()) return;
  window.localStorage.setItem(getScopeTokenKey(scope), token);
}

function clearScopeAuth(scope: AuthScope) {
  if (scope === "user") {
    clearUserAuthSession();
    return;
  }
  if (!canUseStorage()) return;
  const keys =
    scope === "partner" ? PARTNER_AUTH_STORAGE_KEYS : ADMIN_AUTH_STORAGE_KEYS;
  keys.forEach((key) => window.localStorage.removeItem(key));
  if (scope === "admin") {
    window.localStorage.setItem(ADMIN_LOGIN_KEY, "false");
  }
}

function redirectToPartnerLogin() {
  if (typeof window === "undefined") return;
  const query = new URLSearchParams({
    reason: PARTNER_SESSION_EXPIRED_REASON,
    message: PARTNER_SESSION_EXPIRED_MESSAGE,
  }).toString();
  const target = `/partner/login?${query}`;
  if (window.location.pathname === "/partner/login") {
    if (window.location.search !== `?${query}`) {
      window.history.replaceState(null, "", target);
    }
    return;
  }
  window.location.assign(target);
}

function handleUnauthorized(scope: AuthScope, status: number) {
  if (status !== 401) return;
  clearScopeAuth(scope);
  if (scope === "partner") {
    redirectToPartnerLogin();
  }
}

async function waitForFirebaseUser(timeoutMs = 1500) {
  const existingUser = getCurrentFirebaseUser();
  if (existingUser) return existingUser;
  if (typeof window === "undefined") return null;

  return new Promise<ReturnType<typeof getCurrentFirebaseUser>>((resolve) => {
    let settled = false;
    const finish = (value: ReturnType<typeof getCurrentFirebaseUser>) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      unsubscribe();
      resolve(value);
    };

    const unsubscribe = subscribeFirebaseAuthState((user) => {
      finish(user);
    });

    const timer = window.setTimeout(() => {
      finish(getCurrentFirebaseUser());
    }, timeoutMs);
  });
}

async function tryRefreshFirebaseScopeToken(scope: AuthScope, forceRefresh: boolean) {
  if (scope !== "user" && scope !== "partner") return null;
  const user = (await waitForFirebaseUser()) ?? getCurrentFirebaseUser();
  if (!user) return null;

  try {
    const refreshedToken = await user.getIdToken(forceRefresh);
    const normalized = normalizeToken(refreshedToken);
    if (!normalized) return null;
    if (scope === "user") {
      saveUserAuthSession({
        token: normalized,
        uid: user.uid,
        phone: user.phoneNumber ?? undefined,
      });
    } else {
      setStoredTokenForScope(scope, normalized);
    }
    return normalized;
  } catch {
    return null;
  }
}

async function getRequestToken(scope: AuthScope) {
  const existingToken = getStoredTokenForScope(scope);
  if (existingToken) return existingToken;
  return tryRefreshFirebaseScopeToken(scope, false);
}

async function fetchJson<T>(input: string, init: RequestInit | undefined, token: string | null) {
  const resolved = resolveApiUrl(input);
  if (!resolved.url) {
    return {
      response: null,
      payload: resolved.configError as { message?: string; error?: string; status?: number } & T,
    };
  }

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(resolved.url, {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
    status?: number;
  } & T;
  return { response, payload };
}

function toApiError(status: number, payload: { message?: string; error?: string }): ApiClientError {
  return {
    code: payload.error,
    status,
    details: payload,
    message:
      payload.message ||
      payload.error ||
      (status === 501
        ? "Network request failed. Please check your connection or backend URL."
        : "Request failed."),
  };
}

export function isApiBaseUrlConfigured() {
  const baseUrl = resolveConfiguredApiBaseUrl();
  return Boolean(baseUrl);
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const scope = resolveScope(input);
    const token = await getRequestToken(scope);
    const first = await fetchJson<T>(input, init, token);
    if (!first.response) {
      return {
        data: null,
        error: {
          status: first.payload.status,
          message: first.payload.message || "Service is temporarily unavailable.",
        },
      };
    }

    if (first.response.ok) {
      return {
        data: first.payload as T,
        error: null,
      };
    }

    if (first.response.status === 401 && (scope === "user" || scope === "partner")) {
      const refreshedToken = await tryRefreshFirebaseScopeToken(scope, true);
      if (refreshedToken) {
        const retry = await fetchJson<T>(input, init, refreshedToken);
        if (!retry.response) {
          return {
            data: null,
            error: {
              status: retry.payload.status,
              message: retry.payload.message || "Service is temporarily unavailable.",
            },
          };
        }
        if (retry.response.ok) {
          return {
            data: retry.payload as T,
            error: null,
          };
        }
        handleUnauthorized(scope, retry.response.status);
        return {
          data: null,
          error: toApiError(retry.response.status, retry.payload),
        };
      }
      handleUnauthorized(scope, 401);
      return {
        data: null,
        error: toApiError(401, first.payload),
      };
    }

    handleUnauthorized(scope, first.response.status);
    return {
      data: null,
      error: toApiError(first.response.status, first.payload),
    };
  } catch {
    return {
      data: null,
      error: {
        message: "Network request failed. Please check your connection or backend URL.",
      },
    };
  }
}

export function notConnectedError(message: string): ApiResult<never> {
  return {
    data: null,
    error: {
      status: 501,
      message,
    },
  };
}

export function getStoredAuthToken(path = "") {
  const scope = resolveScope(path);
  return getStoredTokenForScope(scope);
}
