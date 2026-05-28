import { apiRequest } from "@/lib/api/client";

async function adminGet<T>(path: string) {
  return apiRequest<T>(path);
}

async function adminUpdate<T>(path: string, payload: Record<string, unknown>) {
  return apiRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type AdminApplicationUpdateStatus = "APPROVED" | "REJECTED" | "NEEDS_INFO";

export async function updateAdminApplicationStatus(
  id: string,
  status: AdminApplicationUpdateStatus,
  adminNote?: string,
) {
  return apiRequest<{ application: Record<string, unknown> }>(`/api/admin/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...(typeof adminNote === "string" ? { adminNote } : {}),
    }),
  });
}

export async function getAdminApplicationById(id: string) {
  return apiRequest<{ application: Record<string, unknown> }>(`/api/admin/applications/${id}`);
}

export const getAdminDashboard = () => adminGet<Record<string, unknown>>("/api/admin/dashboard");
export const listApplications = () => adminGet<Record<string, unknown>>("/api/admin/applications");
export const updateApplicationStatus = (payload: Record<string, unknown>) => adminUpdate("/api/admin/applications", payload);
export const listCompanions = () => adminGet<Record<string, unknown>>("/api/admin/companions");
export const updateCompanion = (payload: Record<string, unknown>) => adminUpdate("/api/admin/companions", payload);
export const listUsers = () => adminGet<Record<string, unknown>>("/api/admin/users");
export const updateUser = (payload: Record<string, unknown>) => adminUpdate("/api/admin/users", payload);

export type AdminWalletCreditResponse = {
  user: {
    id: string;
    name?: string | null;
    phoneNumber: string;
  };
  creditedAmount: number;
  updatedBalance: number;
  transaction: {
    id: string;
    transactionCode: string;
    walletAccountId: string;
    type: "ADMIN_CREDIT";
    amount: number;
    status: "SUCCESS";
    gateway?: string | null;
    referenceId?: string | null;
    reason?: string | null;
    createdAt: string;
  };
};

export async function creditUserWallet(
  userId: string,
  payload: { amount: number; reason?: string },
) {
  return apiRequest<AdminWalletCreditResponse>(`/api/admin/users/${userId}/wallet/credit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const listSessions = () => adminGet<Record<string, unknown>>("/api/admin/sessions");
export const updateSession = (payload: Record<string, unknown>) => adminUpdate("/api/admin/sessions", payload);
export const listBookings = () => adminGet<Record<string, unknown>>("/api/admin/bookings");
export const updateBooking = (payload: Record<string, unknown>) => adminUpdate("/api/admin/bookings", payload);
export const listWalletTransactions = () => adminGet<Record<string, unknown>>("/api/admin/wallet/transactions");
export type AdminWalletSummaryTransaction = {
  id: string;
  transactionId: string;
  userPhone: string;
  userName?: string | null;
  type: "RECHARGE" | "BOOKING" | "GIFT" | "REFUND" | "ADMIN_CREDIT";
  amount: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
  gateway?: string | null;
  createdAt: string;
  paidAmount: number;
  walletCredit: number;
};

export type AdminWalletSummaryResponse = {
  totalRecharged: number;
  totalSpent: number;
  totalRefunds: number;
  totalTransactions: number;
  averageRecharge: number;
  transactions: AdminWalletSummaryTransaction[];
};

export async function getAdminWalletSummary(filters?: {
  search?: string;
  type?: "ALL" | "RECHARGE" | "BOOKING" | "GIFT" | "REFUND" | "ADMIN_CREDIT";
  status?: "ALL" | "SUCCESS" | "PENDING" | "FAILED";
}) {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.set("search", filters.search.trim());
  if (filters?.type && filters.type !== "ALL") params.set("type", filters.type);
  if (filters?.status && filters.status !== "ALL") params.set("status", filters.status);
  const query = params.toString();
  return adminGet<AdminWalletSummaryResponse>(query ? `/api/admin/wallet/summary?${query}` : "/api/admin/wallet/summary");
}

export const listPayouts = () => adminGet<Record<string, unknown>>("/api/admin/payouts");
export const updatePayout = (payload: Record<string, unknown>) => adminUpdate("/api/admin/payouts", payload);
export const listVerifications = () => adminGet<Record<string, unknown>>("/api/admin/verification");
export const updateVerification = (payload: Record<string, unknown>) => adminUpdate("/api/admin/verification", payload);
export const listReviews = () => adminGet<Record<string, unknown>>("/api/admin/reviews");
export const updateReview = (payload: Record<string, unknown>) => adminUpdate("/api/admin/reviews", payload);
export const listSupportTickets = () => adminGet<Record<string, unknown>>("/api/admin/support");
export const updateTicket = (payload: Record<string, unknown>) => adminUpdate("/api/admin/support", payload);
export const listMedia = () => adminGet<Record<string, unknown>>("/api/admin/media");
export const updateMedia = (payload: Record<string, unknown>) => adminUpdate("/api/admin/media", payload);
export const listClientDiaries = () => adminGet<Record<string, unknown>>("/api/admin/client-diaries");
export const updateClientDiary = (payload: Record<string, unknown>) => adminUpdate("/api/admin/client-diaries", payload);
export async function getAdminSetting(key: string) {
  return adminGet<{ setting: { key: string; value: Record<string, unknown> } | null }>(`/api/admin/settings/${key}`);
}

export async function updateAdminSetting(key: string, value: Record<string, unknown>) {
  return apiRequest<{ setting: { key: string; value: Record<string, unknown> } }>(`/api/admin/settings/${key}`, {
    method: "PUT",
    body: JSON.stringify(value),
  });
}
