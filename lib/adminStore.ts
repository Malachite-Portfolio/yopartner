import {
  adminStorageKeys,
  seedAdminApplications,
  seedAdminBookings,
  seedAdminClientDiaries,
  seedAdminCompanions,
  seedAdminMedia,
  seedAdminPayouts,
  seedAdminReviews,
  seedAdminSessions,
  seedAdminSettings,
  seedAdminSupportTickets,
  seedAdminTransactions,
  seedAdminUsers,
  seedAdminVerifications,
  type AdminApplication,
  type AdminBooking,
  type AdminCompanion,
  type AdminDiaryItem,
  type AdminMediaItem,
  type AdminPayout,
  type AdminReview,
  type AdminSession,
  type AdminSettings,
  type AdminTicket,
  type AdminTransaction,
  type AdminUser,
  type AdminVerification,
} from "@/lib/adminData";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readJSON<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return (JSON.parse(raw) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function generateId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now().toString().slice(-6)}-${random}`;
}

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN");
}

let initialized = false;

function seedIfMissing<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  if (window.localStorage.getItem(key) === null) {
    writeJSON(key, value);
  }
}

function hydrateFromExistingLocalData() {
  if (!canUseStorage()) return;

  const existingBookings = readJSON<Array<Record<string, unknown>>>("yopartner_bookings_cache", []);
  if (existingBookings.length > 0 && window.localStorage.getItem(adminStorageKeys.bookings) === null) {
    const mapped: AdminBooking[] = existingBookings.map((booking, index) => ({
      id: String(booking.id ?? `ext-booking-${index}`),
      bookingId: String(booking.bookingId ?? generateId("YP")),
      user: String(booking.user ?? booking.phone ?? "+919900000000"),
      companion: String(booking.companionName ?? "Unknown Companion"),
      serviceType:
        booking.serviceType === "audio" || booking.serviceType === "video" || booking.serviceType === "visit"
          ? booking.serviceType
          : "chat",
      amount: Number(booking.price ?? 0),
      status:
        booking.status === "Pending" || booking.status === "Completed" || booking.status === "Cancelled"
          ? booking.status
          : "Confirmed",
      createdAt: String(booking.createdAt ?? new Date().toISOString()),
      scheduledAt: String(booking.createdAt ?? new Date().toISOString()),
    }));
    writeJSON(adminStorageKeys.bookings, mapped);
  }

  const walletTx = readJSON<Array<Record<string, unknown>>>("yopartner_wallet_transactions", []);
  if (walletTx.length > 0 && window.localStorage.getItem(adminStorageKeys.walletTransactions) === null) {
    const mapped: AdminTransaction[] = walletTx.map((tx, index) => ({
      id: String(tx.id ?? `ext-tx-${index}`),
      transactionId: String(tx.id ?? generateId("TRX")),
      user: "+919900000000",
      type: tx.type === "booking" ? "Booking" : "Recharge",
      amount: Number(tx.amountAdded ?? 0),
      status: "Success",
      gateway: "Wallet",
      date: String(tx.createdAt ?? new Date().toISOString()),
      reason: String(tx.description ?? ""),
    }));
    writeJSON(adminStorageKeys.walletTransactions, mapped);
  }

  const partnerProfile = readJSON<Record<string, unknown>>("yopartner_partner_profile", {});
  const partnerName = String(partnerProfile.fullName ?? "").trim();
  if (partnerName && window.localStorage.getItem(adminStorageKeys.applications) === null) {
    const application: AdminApplication = {
      id: generateId("APPREC"),
      applicationId: generateId("APP"),
      partnerName,
      phone: "+919700009999",
      age: String(partnerProfile.age ?? ""),
      gender: String(partnerProfile.gender ?? ""),
      religion: String(partnerProfile.religion ?? ""),
      bornCity: String(partnerProfile.bornCity ?? ""),
      nationality: String(partnerProfile.nationality ?? ""),
      school: String(partnerProfile.school ?? ""),
      college: String(partnerProfile.college ?? ""),
      qualification: String(partnerProfile.qualification ?? ""),
      languagesKnown: Array.isArray(partnerProfile.languagesKnown)
        ? (partnerProfile.languagesKnown as string[])
        : [],
      communicationStyle: Array.isArray(partnerProfile.communicationStyle)
        ? (partnerProfile.communicationStyle as string[])
        : [],
      hobbies: Array.isArray(partnerProfile.hobbies) ? (partnerProfile.hobbies as string[]) : [],
      profileTagline: String(partnerProfile.profileTagline ?? ""),
      aboutYourself: String(partnerProfile.aboutYourself ?? ""),
      servicesOffered: Array.isArray(partnerProfile.servicesOffered)
        ? (partnerProfile.servicesOffered as string[])
        : [],
      chatPricePerMinute: String(partnerProfile.chatPricePerMinute ?? ""),
      audioPricePerMinute: String(partnerProfile.audioPricePerMinute ?? ""),
      videoPricePerMinute: String(partnerProfile.videoPricePerMinute ?? ""),
      visitPricePerSession: String(partnerProfile.visitPricePerSession ?? ""),
      categories: Array.isArray(partnerProfile.categories) ? (partnerProfile.categories as string[]) : [],
      safetyChecklist: {
        platonicOnly: Boolean(partnerProfile.safetyPlatonicOnly),
        respectfulRules: Boolean(partnerProfile.safetyRespectfulRules),
        noOutsidePayments: Boolean(partnerProfile.safetyNoOutsidePayments),
        reviewVerification: Boolean(partnerProfile.safetyReviewVerification),
      },
      submittedDate: new Date().toISOString(),
      status: "Under Review",
    };
    writeJSON(adminStorageKeys.applications, [application, ...seedAdminApplications]);
  }
}

export function initAdminStore() {
  if (!canUseStorage() || initialized) return;
  seedIfMissing(adminStorageKeys.companions, seedAdminCompanions);
  seedIfMissing(adminStorageKeys.users, seedAdminUsers);
  seedIfMissing(adminStorageKeys.applications, seedAdminApplications);
  seedIfMissing(adminStorageKeys.bookings, seedAdminBookings);
  seedIfMissing(adminStorageKeys.sessions, seedAdminSessions);
  seedIfMissing(adminStorageKeys.walletTransactions, seedAdminTransactions);
  seedIfMissing(adminStorageKeys.reviews, seedAdminReviews);
  seedIfMissing(adminStorageKeys.supportTickets, seedAdminSupportTickets);
  seedIfMissing(adminStorageKeys.payouts, seedAdminPayouts);
  seedIfMissing(adminStorageKeys.verifications, seedAdminVerifications);
  seedIfMissing(adminStorageKeys.media, seedAdminMedia);
  seedIfMissing(adminStorageKeys.clientDiaries, seedAdminClientDiaries);
  seedIfMissing(adminStorageKeys.settings, seedAdminSettings);
  hydrateFromExistingLocalData();
  initialized = true;
}

export function getAdminCompanions() {
  initAdminStore();
  return readJSON<AdminCompanion[]>(adminStorageKeys.companions, seedAdminCompanions);
}
export function setAdminCompanions(value: AdminCompanion[]) {
  writeJSON(adminStorageKeys.companions, value);
}

export function getAdminUsers() {
  initAdminStore();
  return readJSON<AdminUser[]>(adminStorageKeys.users, seedAdminUsers);
}
export function setAdminUsers(value: AdminUser[]) {
  writeJSON(adminStorageKeys.users, value);
}

export function getAdminApplications() {
  initAdminStore();
  return readJSON<AdminApplication[]>(adminStorageKeys.applications, seedAdminApplications);
}
export function setAdminApplications(value: AdminApplication[]) {
  writeJSON(adminStorageKeys.applications, value);
}

export function getAdminBookings() {
  initAdminStore();
  return readJSON<AdminBooking[]>(adminStorageKeys.bookings, seedAdminBookings);
}
export function setAdminBookings(value: AdminBooking[]) {
  writeJSON(adminStorageKeys.bookings, value);
}

export function getAdminSessions() {
  initAdminStore();
  return readJSON<AdminSession[]>(adminStorageKeys.sessions, seedAdminSessions);
}
export function setAdminSessions(value: AdminSession[]) {
  writeJSON(adminStorageKeys.sessions, value);
}

export function getAdminTransactions() {
  initAdminStore();
  return readJSON<AdminTransaction[]>(adminStorageKeys.walletTransactions, seedAdminTransactions);
}
export function setAdminTransactions(value: AdminTransaction[]) {
  writeJSON(adminStorageKeys.walletTransactions, value);
}

export function getAdminReviews() {
  initAdminStore();
  return readJSON<AdminReview[]>(adminStorageKeys.reviews, seedAdminReviews);
}
export function setAdminReviews(value: AdminReview[]) {
  writeJSON(adminStorageKeys.reviews, value);
}

export function getAdminSupportTickets() {
  initAdminStore();
  return readJSON<AdminTicket[]>(adminStorageKeys.supportTickets, seedAdminSupportTickets);
}
export function setAdminSupportTickets(value: AdminTicket[]) {
  writeJSON(adminStorageKeys.supportTickets, value);
}

export function getAdminPayouts() {
  initAdminStore();
  return readJSON<AdminPayout[]>(adminStorageKeys.payouts, seedAdminPayouts);
}
export function setAdminPayouts(value: AdminPayout[]) {
  writeJSON(adminStorageKeys.payouts, value);
}

export function getAdminVerifications() {
  initAdminStore();
  return readJSON<AdminVerification[]>(adminStorageKeys.verifications, seedAdminVerifications);
}
export function setAdminVerifications(value: AdminVerification[]) {
  writeJSON(adminStorageKeys.verifications, value);
}

export function getAdminMedia() {
  initAdminStore();
  return readJSON<AdminMediaItem[]>(adminStorageKeys.media, seedAdminMedia);
}
export function setAdminMedia(value: AdminMediaItem[]) {
  writeJSON(adminStorageKeys.media, value);
}

export function getAdminClientDiaries() {
  initAdminStore();
  return readJSON<AdminDiaryItem[]>(adminStorageKeys.clientDiaries, seedAdminClientDiaries);
}
export function setAdminClientDiaries(value: AdminDiaryItem[]) {
  writeJSON(adminStorageKeys.clientDiaries, value);
}

export function getAdminSettings() {
  initAdminStore();
  return readJSON<AdminSettings>(adminStorageKeys.settings, seedAdminSettings);
}
export function setAdminSettings(value: AdminSettings) {
  writeJSON(adminStorageKeys.settings, value);
}
