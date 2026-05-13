import { IS_DEMO_MODE } from "@/lib/config/runtime";

export type ApiClientError = {
  message: string;
  status?: number;
};

export type ApiResult<T> = {
  data: T | null;
  error: ApiClientError | null;
};

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
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
        message: IS_DEMO_MODE
          ? "Network request failed."
          : "Backend service is not connected yet.",
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
