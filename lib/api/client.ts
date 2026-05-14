export type ApiClientError = {
  message: string;
  status?: number;
};

export type ApiResult<T> = {
  data: T | null;
  error: ApiClientError | null;
};

function resolveApiUrl(input: string) {
  if (!input.startsWith("/")) return input;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl) return input;
  return `${baseUrl.replace(/\/+$/, "")}${input}`;
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const token = getStoredAuthToken();
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
      return {
        data: null,
        error: {
          status: response.status,
          message:
            payload.message ||
            payload.error ||
            (response.status === 501
              ? "Backend service is not connected yet."
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

export function getStoredAuthToken() {
  if (typeof window === "undefined") return null;
  const keys = [
    "yopartner_partner_firebase_id_token",
    "yopartner_firebase_id_token",
  ];
  for (const key of keys) {
    const token = window.localStorage.getItem(key);
    if (token && token.trim().length > 0) return token.trim();
  }
  return null;
}
