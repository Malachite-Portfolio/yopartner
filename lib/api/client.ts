export type ApiClientError = {
  message: string;
  status?: number;
};

export type ApiResult<T> = {
  data: T | null;
  error: ApiClientError | null;
};

const PARTNER_SESSION_EXPIRED_MESSAGE =
  "Your login session could not be verified. Please login again as a partner.";
const PARTNER_SESSION_EXPIRED_REASON = "session-expired";
const PARTNER_AUTH_STORAGE_KEYS = [
  "yopartner_partner_logged_in",
  "yopartner_partner_phone",
  "yopartner_partner_firebase_uid",
  "yopartner_partner_firebase_phone",
  "yopartner_partner_firebase_id_token",
];

function resolveApiUrl(input: string) {
  if (!input.startsWith("/")) return input;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl) return input;
  return `${baseUrl.replace(/\/+$/, "")}${input}`;
}

export function isApiBaseUrlConfigured() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return Boolean(baseUrl);
}

function clearPartnerAuthKeys() {
  if (typeof window === "undefined") return;
  PARTNER_AUTH_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
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

function handlePartnerUnauthorized(path: string, status: number) {
  if (status !== 401 || !path.startsWith("/api/partner")) return;
  clearPartnerAuthKeys();
  redirectToPartnerLogin();
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const token = getStoredAuthToken(input);
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const response = await fetch(resolveApiUrl(input), {
      ...init,
      headers,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string } & T;

    if (!response.ok) {
      handlePartnerUnauthorized(input, response.status);
      return {
        data: null,
        error: {
          status: response.status,
          message:
            payload.message ||
            payload.error ||
            (response.status === 501
              ? "Network request failed. Please check your connection or backend URL."
              : "Request failed."),
        },
      };
    }

    return {
      data: payload as T,
      error: null,
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
  if (typeof window === "undefined") return null;
  const isAdminRoute = path.startsWith("/api/admin");
  const isPartnerRoute = path.startsWith("/api/partner");
  const keys = isAdminRoute
    ? [
        "yopartner_admin_auth_token",
      ]
    : isPartnerRoute
      ? [
          "yopartner_partner_firebase_id_token",
        ]
    : [
        "yopartner_firebase_id_token",
        "yopartner_partner_firebase_id_token",
      ];
  for (const key of keys) {
    const token = window.localStorage.getItem(key);
    if (token && token.trim().length > 0) return token.trim();
  }
  return null;
}
