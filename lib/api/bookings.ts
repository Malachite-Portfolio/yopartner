import { apiRequest } from "@/lib/api/client";

export type BookingPayload = {
  companionId: string;
  serviceType: "chat" | "audio" | "video";
};

export type BookingItem = {
  id: string;
  bookingId: string;
  companionName: string;
  serviceType: "chat" | "audio" | "video";
  amount: number;
  status: string;
  createdAt: string;
};

export async function createBooking(payload: BookingPayload) {
  const result = await apiRequest<{ booking: BookingItem }>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.error) {
    return { data: null, error: { ...result.error, message: "We couldn't create this booking right now. Please retry." } };
  }
  return result;
}

export async function getMyBookings() {
  const result = await apiRequest<{ bookings: BookingItem[] }>("/api/bookings");
  if (result.error) {
    return { data: [], error: { ...result.error, message: "We couldn't load bookings right now. Please retry." } };
  }
  return { data: result.data?.bookings ?? [], error: null };
}

export async function cancelBooking(id: string) {
  const result = await apiRequest<{ success: boolean }>(`/api/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "cancel" }),
  });
  if (result.error) {
    return { data: null, error: { ...result.error, message: "We couldn't update this booking right now. Please retry." } };
  }
  return result;
}

export async function getBooking(id: string) {
  const result = await apiRequest<{ booking: BookingItem }>(`/api/bookings/${id}`);
  if (result.error) {
    return { data: null, error: { ...result.error, message: "We couldn't load this booking right now. Please retry." } };
  }
  return result;
}
