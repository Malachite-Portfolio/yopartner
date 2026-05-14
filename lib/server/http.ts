import { NextResponse } from "next/server";

export function notImplementedResponse(message = "Backend service is not connected yet.") {
  return NextResponse.json(
    {
      error: "NOT_IMPLEMENTED",
      message,
    },
    { status: 501 },
  );
}

export function badRequest(message: string) {
  return NextResponse.json({ error: "BAD_REQUEST", message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: "UNAUTHORIZED", message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: "FORBIDDEN", message }, { status: 403 });
}

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function createCode(prefix: string) {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${now}-${rand}`;
}
