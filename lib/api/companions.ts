import { apiRequest } from "@/lib/api/client";
import {
  AUDIO_RATE_PER_MIN,
  CHAT_RATE_PER_MIN,
  HOME_VISIT_RATE_PER_HOUR,
  VIDEO_RATE_PER_MIN,
} from "@/lib/platformPricing";

export type CompanionFilters = {
  search?: string;
  availability?: "all" | "online";
  category?: string | null;
};

export type CompanionItem = {
  id: string;
  name: string;
  isVerifiedPartner: boolean;
  headline?: string;
  tagline: string;
  category: string;
  city?: string | null;
  rating: number;
  reviewCount?: number;
  experience: string;
  image?: string;
  online: boolean;
  isBusy?: boolean;
  effectiveStatus?: "ONLINE" | "BUSY" | "OFFLINE";
  languages: string[];
  galleryImages: string[];
  interests?: string[];
  about?: string;
  age?: number | null;
  gender?: string | null;
  communicationStyle?: string[];
  hobbies?: string[];
  serviceAreas?: string[];
  verificationBadges?: string[];
  sessions?: number;
  completedSessions?: number;
  reviewsCount?: number;
  reviews?: Array<{
    rating: number;
    comment: string;
    createdAt: string;
    phoneMasked: string;
  }>;
  chatPrice: number;
  voicePrice: number;
  videoPrice?: number;
  visitPrice?: number;
  rates?: {
    chat: number;
    audio: number;
    video: number;
    homeVisit?: number | null;
  };
  servicesOffered: string[];
};

type RawPublicProfile = {
  id?: string;
  displayName?: string | null;
  headline?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  galleryUrls?: unknown;
  services?: unknown;
  interests?: unknown;
  languages?: unknown;
  city?: string | null;
  serviceArea?: string | null;
  verificationBadges?: unknown;
  verificationStatus?: string | null;
  status?: string | null;
  approved?: boolean | null;
  rating?: number | string | null;
  reviewCount?: number | string | null;
  completedSessions?: number | string | null;
  rates?: {
    chat?: number | string | null;
    audio?: number | string | null;
    video?: number | string | null;
    homeVisit?: number | string | null;
  } | null;
  reviews?: unknown;
};

type RawCompanionItem = {
  id?: string;
  name?: string;
  displayName?: string;
  tagline?: string | null;
  headline?: string | null;
  category?: string | null;
  city?: string | null;
  serviceArea?: string | null;
  rating?: number | string | null;
  ratingAverage?: number | string | null;
  reviewCount?: number | string | null;
  ratingCount?: number | string | null;
  experience?: string | null;
  image?: string | null;
  profileImageUrl?: string | null;
  resolvedProfileImageUrl?: string | null;
  publicProfile?: RawPublicProfile | null;
  profile?: RawPublicProfile | null;
  onboarding?: RawPublicProfile | null;
  about?: string | null;
  bio?: string | null;
  age?: number | string | null;
  gender?: string | null;
  religion?: string | null;
  bornCity?: string | null;
  nationality?: string | null;
  school?: string | null;
  college?: string | null;
  qualification?: string | null;
  communicationStyle?: unknown;
  hobbies?: unknown;
  interests?: unknown;
  serviceAreas?: unknown;
  verificationBadges?: unknown;
  verificationStatus?: string | null;
  status?: string | null;
  approved?: boolean | null;
  sessions?: number | string | null;
  sessionsCompleted?: number | string | null;
  completedSessions?: number | string | null;
  reviewsCount?: number | string | null;
  reviews?: unknown;
  online?: boolean | null;
  isOnline?: boolean | null;
  isBusy?: boolean | null;
  effectiveStatus?: "ONLINE" | "BUSY" | "OFFLINE" | string | null;
  chatPrice?: number | string | null;
  chatRate?: number | string | null;
  voicePrice?: number | string | null;
  audioPrice?: number | string | null;
  audioRate?: number | string | null;
  videoPrice?: number | string | null;
  videoRate?: number | string | null;
  homeVisitPrice?: number | string | null;
  visitPrice?: number | string | null;
  rates?: {
    chat?: number | string | null;
    audio?: number | string | null;
    video?: number | string | null;
    homeVisit?: number | string | null;
  } | null;
  languages?: unknown;
  galleryImages?: unknown;
  galleryImageUrls?: unknown;
  servicesOffered?: string[] | null;
  services?: unknown;
};

type RawCompanionResponse = {
  companion?: unknown;
  data?: unknown;
  publicProfile?: unknown;
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasCompanionIdentity(value: unknown): value is RawCompanionItem {
  if (!isRecord(value)) return false;
  const id = value.id;
  const profile = pickPublicProfile(value);
  const name = value.name ?? value.displayName ?? profile?.displayName;
  return typeof id === "string" && id.trim().length > 0 && typeof name === "string" && name.trim().length > 0;
}

function toSafeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function toOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeServiceLabel(service: string) {
  const cleaned = service.trim();
  if (cleaned.toUpperCase() === "HOME_VISIT") return "Home Visit";
  if (cleaned.toUpperCase() === "AUDIO") return "Audio Call";
  if (cleaned.toUpperCase() === "VIDEO") return "Video Call";
  if (cleaned.toUpperCase() === "CHAT") return "Chat";
  return cleaned;
}

function normalizeServices(services: unknown) {
  return normalizeStringArray(services).map(normalizeServiceLabel);
}

function isLikelyPrivatePath(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("aadhaar") ||
    normalized.includes("pan") ||
    normalized.includes("kyc") ||
    normalized.includes("storagepath") ||
    normalized.includes("internal") ||
    normalized.startsWith("c:\\") ||
    normalized.startsWith("/var/") ||
    normalized.startsWith("gs://")
  );
}

function isApprovedProfileImageProxyUrl(value: string) {
  return /(?:^https?:\/\/[^/]+)?\/api\/companions\/[^/?#]+\/profile-image(?:[?#].*)?$/i.test(value);
}

function normalizePublicImageUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text) return "";
  if (isApprovedProfileImageProxyUrl(text)) return text;
  if (isLikelyPrivatePath(text)) return "";
  if (/^https?:\/\//i.test(text)) return text;
  if (text.startsWith("/")) return text;
  return "";
}

function normalizePublicImageArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizePublicImageUrl(item))
    .filter(Boolean);
}

function normalizeReviews(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as {
        rating?: unknown;
        comment?: unknown;
        createdAt?: unknown;
        phoneMasked?: unknown;
      };
      const rating = toNumber(candidate.rating, 0);
      const comment = toSafeText(candidate.comment, "");
      const createdAt = toSafeText(candidate.createdAt, "");
      const phoneMasked = toSafeText(candidate.phoneMasked, "");
      if (!comment && !phoneMasked && !createdAt) return null;
      return {
        rating,
        comment,
        createdAt,
        phoneMasked,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function isApprovedStatus(value: unknown) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return normalized === "VERIFIED" || normalized === "APPROVED";
}

function isRejectedOrPendingStatus(value: unknown) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return (
    normalized === "PENDING" ||
    normalized === "UNDER_REVIEW" ||
    normalized === "UNDER-REVIEW" ||
    normalized === "REJECTED" ||
    normalized === "FAILED" ||
    normalized === "NEEDS_REVIEW" ||
    normalized === "NEEDS-REVIEW" ||
    normalized === "SUSPENDED"
  );
}

function isVerifiedPublicCompanion(
  item: RawCompanionItem,
  publicProfile?: RawPublicProfile | null,
  assumePublicVerified = false,
) {
  if (typeof item.approved === "boolean") return item.approved;
  if (typeof publicProfile?.approved === "boolean") return publicProfile.approved;

  const verificationStatus = publicProfile?.verificationStatus ?? item.verificationStatus;
  if (isApprovedStatus(verificationStatus)) return true;
  if (isRejectedOrPendingStatus(verificationStatus)) return false;

  const status = publicProfile?.status ?? item.status;
  if (isApprovedStatus(status)) return true;
  if (isRejectedOrPendingStatus(status)) return false;

  const verificationBadges = normalizeStringArray(publicProfile?.verificationBadges ?? item.verificationBadges);
  if (verificationBadges.length > 0) return true;

  if (toOptionalText(item.experience).toLowerCase().includes("verified")) return true;

  return assumePublicVerified;
}

function describeCompanionPayload(value: unknown) {
  if (!isRecord(value)) return typeof value;
  return Object.keys(value).slice(0, 12);
}

function pickPublicProfile(value: unknown) {
  if (!isRecord(value)) return null;
  if (isRecord(value.publicProfile)) return value.publicProfile as RawPublicProfile;
  if (isRecord(value.profile)) return value.profile as RawPublicProfile;
  if (isRecord(value.onboarding)) return value.onboarding as RawPublicProfile;
  return null;
}

function extractRawCompanion(payload: unknown) {
  if (hasCompanionIdentity(payload)) return payload;
  if (!isRecord(payload)) return null;

  const response = payload as RawCompanionResponse;
  if (hasCompanionIdentity(response.companion)) {
    const publicProfile = pickPublicProfile(response.companion) ?? pickPublicProfile(payload);
    return publicProfile ? { ...(response.companion as RawCompanionItem), publicProfile } : response.companion;
  }
  if (hasCompanionIdentity(response.data)) {
    const publicProfile = pickPublicProfile(response.data) ?? pickPublicProfile(payload);
    return publicProfile ? { ...(response.data as RawCompanionItem), publicProfile } : response.data;
  }

  if (isRecord(response.data) && hasCompanionIdentity(response.data.companion)) {
    const raw = response.data.companion as RawCompanionItem;
    const publicProfile =
      pickPublicProfile(response.data.companion) ??
      pickPublicProfile(response.data) ??
      pickPublicProfile(response.companion) ??
      pickPublicProfile(payload);
    return publicProfile ? { ...raw, publicProfile } : raw;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("[companions] Unable to parse companion detail response", {
      payloadKeys: describeCompanionPayload(payload),
      dataKeys: describeCompanionPayload(response.data),
      companionKeys: describeCompanionPayload(response.companion),
    });
  }

  return null;
}

function resolveBackendApiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl) return null;
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

async function publicBackendRequest<T>(path: string) {
  const url = resolveBackendApiUrl(path);
  if (!url) {
    return {
      data: null,
      error: {
        status: 503,
        message: "Service is temporarily unavailable. NEXT_PUBLIC_API_BASE_URL is missing.",
      },
    };
  }

  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string } & T;
    if (!response.ok) {
      return {
        data: null,
        error: {
          status: response.status,
          message: payload.message || payload.error || "Request failed.",
        },
      };
    }
    return { data: payload, error: null };
  } catch {
    return {
      data: null,
      error: {
        message: "Network request failed. Please check your connection or backend URL.",
      },
    };
  }
}

function toCompanionItem(item: RawCompanionItem, options?: { assumePublicVerified?: boolean }): CompanionItem {
  const publicProfile = item.publicProfile ?? item.profile ?? item.onboarding;
  const name = toSafeText(publicProfile?.displayName ?? item.displayName ?? item.name, "Partner");
  const headline = toOptionalText(publicProfile?.headline ?? item.headline);
  const tagline = headline || toOptionalText(item.tagline);
  const about = toOptionalText(publicProfile?.bio ?? item.bio ?? item.about);
  const rating = toNumber(publicProfile?.rating ?? item.ratingAverage ?? item.rating, 0);
  const reviewCount = toNumber(
    publicProfile?.reviewCount ?? item.reviewCount ?? item.ratingCount ?? item.reviewsCount,
    0,
  );
  const completedSessions = toNumber(
    publicProfile?.completedSessions ?? item.completedSessions ?? item.sessionsCompleted ?? item.sessions,
    0,
  );
  const image = normalizePublicImageUrl(
    publicProfile?.profileImageUrl ?? item.resolvedProfileImageUrl ?? item.profileImageUrl ?? item.image,
  );
  const galleryFromProfile = normalizePublicImageArray(publicProfile?.galleryUrls);
  const galleryFromCompanion = normalizePublicImageArray(item.galleryImages);
  const galleryFromCompanionUrls = normalizePublicImageArray(item.galleryImageUrls);
  const galleryImages =
    galleryFromProfile.length > 0
      ? galleryFromProfile
      : galleryFromCompanion.length > 0
        ? galleryFromCompanion
        : galleryFromCompanionUrls;
  const services = normalizeServices(publicProfile?.services ?? item.services ?? item.servicesOffered);
  const serviceLabels = services.map((service) => service.toLowerCase());
  const rates = publicProfile?.rates ?? item.rates;
  const rawChatPrice = toNumber(rates?.chat ?? item.chatPrice ?? item.chatRate, 0);
  const rawAudioPrice = toNumber(rates?.audio ?? item.audioPrice ?? item.audioRate ?? item.voicePrice, 0);
  const rawVideoPrice =
    rates?.video == null && item.videoPrice == null && item.videoRate == null
      ? undefined
      : toNumber(rates?.video ?? item.videoPrice ?? item.videoRate, 0);
  const rawVisitPrice =
    rates?.homeVisit == null && item.homeVisitPrice == null && item.visitPrice == null
      ? undefined
      : toNumber(rates?.homeVisit ?? item.homeVisitPrice ?? item.visitPrice, 0);
  const hasExplicitServices = services.length > 0;
  const offersChat = hasExplicitServices
    ? serviceLabels.some((service) => service.includes("chat"))
    : rawChatPrice > 0;
  const offersAudio = hasExplicitServices
    ? serviceLabels.some((service) => service.includes("audio") || service.includes("voice"))
    : rawAudioPrice > 0;
  const offersVideo = hasExplicitServices
    ? serviceLabels.some((service) => service.includes("video"))
    : typeof rawVideoPrice === "number" && rawVideoPrice > 0;
  const offersHomeVisit =
    serviceLabels.some((service) => service.includes("home") && service.includes("visit")) ||
    (typeof rawVisitPrice === "number" && rawVisitPrice > 0);
  const chatPrice = offersChat ? CHAT_RATE_PER_MIN : 0;
  const voicePrice = offersAudio ? AUDIO_RATE_PER_MIN : 0;
  const videoPrice = offersVideo ? VIDEO_RATE_PER_MIN : undefined;
  const visitPrice = offersHomeVisit ? HOME_VISIT_RATE_PER_HOUR : undefined;
  const interests = normalizeStringArray(publicProfile?.interests ?? item.interests);
  const languages = normalizeStringArray(publicProfile?.languages ?? item.languages);
  const city = toOptionalText(publicProfile?.city ?? publicProfile?.serviceArea ?? item.city ?? item.serviceArea);
  const verificationBadges = normalizeStringArray(publicProfile?.verificationBadges ?? item.verificationBadges);
  const reviews = normalizeReviews(publicProfile?.reviews ?? item.reviews);
  const isVerifiedPartner = isVerifiedPublicCompanion(item, publicProfile, options?.assumePublicVerified);

  return {
    id: String(item.id || name.toLowerCase().replace(/\s+/g, "-")),
    name,
    isVerifiedPartner,
    headline,
    tagline,
    category: toSafeText(item.category, "Partner"),
    city: city || null,
    rating,
    reviewCount,
    experience: toOptionalText(item.experience),
    image: image || undefined,
    about,
    age: item.age == null ? null : toNumber(item.age, 0),
    gender: toOptionalText(item.gender),
    communicationStyle: normalizeStringArray(item.communicationStyle),
    hobbies: normalizeStringArray(item.hobbies),
    serviceAreas: normalizeStringArray(item.serviceAreas),
    verificationBadges,
    sessions: completedSessions,
    completedSessions,
    reviewsCount: reviewCount,
    reviews,
    online: Boolean(item.isOnline ?? item.online),
    isBusy: Boolean(item.isBusy),
    effectiveStatus:
      item.effectiveStatus === "BUSY" || item.effectiveStatus === "OFFLINE" || item.effectiveStatus === "ONLINE"
        ? item.effectiveStatus
        : undefined,
    languages,
    galleryImages,
    interests,
    chatPrice,
    voicePrice,
    videoPrice,
    visitPrice,
    rates: {
      chat: chatPrice,
      audio: voicePrice,
      video: videoPrice ?? 0,
      homeVisit: visitPrice ?? null,
    },
    servicesOffered: services,
  };
}

export async function listCompanions(filters?: CompanionFilters) {
  const query = new URLSearchParams();
  if (filters?.search) query.set("search", filters.search);
  if (filters?.availability === "online") query.set("online", "true");
  if (filters?.category) query.set("category", filters.category);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const result = await apiRequest<{ companions: RawCompanionItem[] }>(`/api/companions${suffix}`);
  if (result.error) {
    const message =
      process.env.NODE_ENV !== "production" && result.error.status === 503
        ? result.error.message
        : "Partners are currently unavailable. Please try again later.";
    return {
      data: [],
      error: { ...result.error, message },
    };
  }
  return {
    data: (result.data?.companions ?? []).map((item) => toCompanionItem(item, { assumePublicVerified: true })),
    error: null,
  };
}

export async function getCompanionById(id: string) {
  const result =
    typeof window === "undefined"
      ? await publicBackendRequest<RawCompanionResponse>(`/api/companions/${id}`)
      : await apiRequest<RawCompanionResponse>(`/api/companions/${id}`);
  if (result.error) {
    const message =
      process.env.NODE_ENV !== "production" && result.error.status === 503
        ? result.error.message
        : "Partners are currently unavailable. Please try again later.";
    return {
      data: null,
      error: { ...result.error, message },
    };
  }
  const companion = extractRawCompanion(result.data);
  return { data: companion ? toCompanionItem(companion) : null, error: null };
}

export async function listFeaturedCompanions() {
  const result = await apiRequest<{ companions: RawCompanionItem[] }>("/api/companions/featured");
  if (result.error) {
    return {
      data: [],
      error: { ...result.error, message: "Partners are currently unavailable. Please try again later." },
    };
  }
  return {
    data: (result.data?.companions ?? []).map((item) => toCompanionItem(item, { assumePublicVerified: true })),
    error: null,
  };
}

export async function getCompanionStats() {
  const result = await apiRequest<{ totalActiveCompanions: number }>("/api/companions/stats");
  if (result.error) {
    return {
      data: null,
      error: { ...result.error, message: "Partner stats are currently unavailable. Please try again later." },
    };
  }

  return {
    data: {
      totalActiveCompanions: Number.isFinite(Number(result.data?.totalActiveCompanions))
        ? Number(result.data?.totalActiveCompanions)
        : 0,
    },
    error: null,
  };
}
