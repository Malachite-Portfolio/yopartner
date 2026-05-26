import { apiRequest } from "@/lib/api/client";

export type CompanionFilters = {
  search?: string;
  availability?: "all" | "online";
  category?: string | null;
};

export type CompanionItem = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  city?: string | null;
  rating: number;
  experience: string;
  image?: string;
  online: boolean;
  isBusy?: boolean;
  effectiveStatus?: "ONLINE" | "BUSY" | "OFFLINE";
  languages: string[];
  galleryImages: string[];
  about?: string;
  age?: number | null;
  gender?: string | null;
  religion?: string | null;
  bornCity?: string | null;
  nationality?: string | null;
  school?: string | null;
  college?: string | null;
  qualification?: string | null;
  communicationStyle?: string[];
  hobbies?: string[];
  serviceAreas?: string[];
  sessions?: number;
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
  servicesOffered: string[];
};

type RawCompanionItem = {
  id?: string;
  name?: string;
  displayName?: string;
  tagline?: string | null;
  headline?: string | null;
  category?: string | null;
  city?: string | null;
  rating?: number | string | null;
  ratingAverage?: number | string | null;
  ratingCount?: number | string | null;
  experience?: string | null;
  image?: string | null;
  profileImageUrl?: string | null;
  resolvedProfileImageUrl?: string | null;
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
  serviceAreas?: unknown;
  sessions?: number | string | null;
  sessionsCompleted?: number | string | null;
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
  languages?: unknown;
  galleryImages?: unknown;
  galleryImageUrls?: unknown;
  servicesOffered?: string[] | null;
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toSafeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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

function toCompanionItem(item: RawCompanionItem): CompanionItem {
  const name = toSafeText(item.displayName || item.name, "Verified Companion");
  const rating = toNumber(item.ratingAverage ?? item.rating, 0);
  const videoPrice = item.videoPrice == null && item.videoRate == null ? undefined : toNumber(item.videoPrice ?? item.videoRate, 0);
  const visitPrice = item.homeVisitPrice == null && item.visitPrice == null
    ? undefined
    : toNumber(item.homeVisitPrice ?? item.visitPrice, 0);
  const image = toSafeText(item.resolvedProfileImageUrl ?? item.profileImageUrl ?? item.image, "");
  const galleryImages = normalizeStringArray(item.galleryImages).length > 0
    ? normalizeStringArray(item.galleryImages)
    : normalizeStringArray(item.galleryImageUrls);

  return {
    id: String(item.id || name.toLowerCase().replace(/\s+/g, "-")),
    name,
    tagline: toSafeText(item.headline ?? item.tagline, ""),
    category: toSafeText(item.category, "Communication & Emotional Support"),
    city: toSafeText(item.city, ""),
    rating,
    experience: toSafeText(item.experience, "Verified companion"),
    image: image || undefined,
    about: toSafeText(item.bio ?? item.about, ""),
    age: item.age == null ? null : toNumber(item.age, 0),
    gender: toSafeText(item.gender, ""),
    religion: toSafeText(item.religion, ""),
    bornCity: toSafeText(item.bornCity, ""),
    nationality: toSafeText(item.nationality, ""),
    school: toSafeText(item.school, ""),
    college: toSafeText(item.college, ""),
    qualification: toSafeText(item.qualification, ""),
    communicationStyle: normalizeStringArray(item.communicationStyle),
    hobbies: normalizeStringArray(item.hobbies),
    serviceAreas: normalizeStringArray(item.serviceAreas),
    sessions: item.sessionsCompleted == null && item.sessions == null ? undefined : toNumber(item.sessionsCompleted ?? item.sessions, 0),
    reviewsCount: item.ratingCount == null && item.reviewsCount == null ? undefined : toNumber(item.ratingCount ?? item.reviewsCount, 0),
    reviews: normalizeReviews(item.reviews),
    online: Boolean(item.isOnline ?? item.online),
    isBusy: Boolean(item.isBusy),
    effectiveStatus:
      item.effectiveStatus === "BUSY" || item.effectiveStatus === "OFFLINE" || item.effectiveStatus === "ONLINE"
        ? item.effectiveStatus
        : undefined,
    languages: normalizeStringArray(item.languages),
    galleryImages,
    chatPrice: toNumber(item.chatPrice ?? item.chatRate, 0),
    voicePrice: toNumber(item.audioPrice ?? item.audioRate ?? item.voicePrice, 0),
    videoPrice,
    visitPrice,
    servicesOffered: normalizeServices(item.servicesOffered),
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
        : "Companions are currently unavailable. Please try again later.";
    return {
      data: [],
      error: { ...result.error, message },
    };
  }
  return { data: (result.data?.companions ?? []).map(toCompanionItem), error: null };
}

export async function getCompanionById(id: string) {
  const result =
    typeof window === "undefined"
      ? await publicBackendRequest<{ companion: RawCompanionItem }>(`/api/companions/${id}`)
      : await apiRequest<{ companion: RawCompanionItem }>(`/api/companions/${id}`);
  if (result.error) {
    const message =
      process.env.NODE_ENV !== "production" && result.error.status === 503
        ? result.error.message
        : "Companions are currently unavailable. Please try again later.";
    return {
      data: null,
      error: { ...result.error, message },
    };
  }
  return { data: result.data?.companion ? toCompanionItem(result.data.companion) : null, error: null };
}

export async function listFeaturedCompanions() {
  const result = await apiRequest<{ companions: RawCompanionItem[] }>("/api/companions/featured");
  if (result.error) {
    return {
      data: [],
      error: { ...result.error, message: "Companions are currently unavailable. Please try again later." },
    };
  }
  return { data: (result.data?.companions ?? []).map(toCompanionItem), error: null };
}

export async function getCompanionStats() {
  const result = await apiRequest<{ totalActiveCompanions: number }>("/api/companions/stats");
  if (result.error) {
    return {
      data: null,
      error: { ...result.error, message: "Companion stats are currently unavailable. Please try again later." },
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
