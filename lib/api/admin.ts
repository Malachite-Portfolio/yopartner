import { apiRequest } from "@/lib/api/client";

const ADMIN_NOT_CONNECTED = "Admin API is not connected.";

async function adminGet<T>(path: string) {
  const result = await apiRequest<T>(path);
  if (result.error) return { data: null, error: { ...result.error, message: ADMIN_NOT_CONNECTED } };
  return result;
}

async function adminUpdate<T>(path: string, payload: Record<string, unknown>) {
  const result = await apiRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.error) return { data: null, error: { ...result.error, message: ADMIN_NOT_CONNECTED } };
  return result;
}

export const getAdminDashboard = () => adminGet<Record<string, unknown>>("/api/admin/dashboard");
export const listApplications = () => adminGet<Record<string, unknown>>("/api/admin/applications");
export const updateApplicationStatus = (payload: Record<string, unknown>) => adminUpdate("/api/admin/applications", payload);
export const listCompanions = () => adminGet<Record<string, unknown>>("/api/admin/companions");
export const updateCompanion = (payload: Record<string, unknown>) => adminUpdate("/api/admin/companions", payload);
export const listUsers = () => adminGet<Record<string, unknown>>("/api/admin/users");
export const updateUser = (payload: Record<string, unknown>) => adminUpdate("/api/admin/users", payload);
export const listSessions = () => adminGet<Record<string, unknown>>("/api/admin/sessions");
export const updateSession = (payload: Record<string, unknown>) => adminUpdate("/api/admin/sessions", payload);
export const listBookings = () => adminGet<Record<string, unknown>>("/api/admin/bookings");
export const updateBooking = (payload: Record<string, unknown>) => adminUpdate("/api/admin/bookings", payload);
export const listWalletTransactions = () => adminGet<Record<string, unknown>>("/api/admin/wallet");
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
export const getSettings = () => adminGet<Record<string, unknown>>("/api/admin/settings");
export const updateSettings = (payload: Record<string, unknown>) => adminUpdate("/api/admin/settings", payload);
