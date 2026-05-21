import type { SessionStatus } from "@/lib/api/sessions";

const ACTIVE_SESSION_STATUSES: SessionStatus[] = ["PENDING", "ACCEPTED", "LIVE"];
const TERMINAL_SESSION_STATUSES: SessionStatus[] = ["ENDED", "DECLINED", "CANCELLED", "EXPIRED", "COMPLETED", "FAILED", "FLAGGED"];

export function isActiveSessionStatus(status?: SessionStatus) {
  return Boolean(status && ACTIVE_SESSION_STATUSES.includes(status));
}

export function isTerminalSessionStatus(status?: SessionStatus) {
  return Boolean(status && TERMINAL_SESSION_STATUSES.includes(status));
}
