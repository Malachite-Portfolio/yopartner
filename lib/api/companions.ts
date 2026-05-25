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
  rating: number;
  experience: string;
  image?: string;
  online: boolean;
  isBusy?: boolean;
  effectiveStatus?: "ONLINE" | "BUSY" | "OFFLINE";
  languages: string[];
  galleryImages: string[];
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
  category?: string | null;
  rating?: number | string | null;
  experience?: string | null;
  image?: string | null;
  online?: boolean | null;
  isOnline?: boolean | null;
  isBusy?: boolean | null;
  effectiveStatus?: "ONLINE" | "BUSY" | "OFFLINE" | string | null;
  chatPrice?: number | string | null;
  voicePrice?: number | string | null;
  audioPrice?: number | string | null;
  videoPrice?: number | string | null;
  homeVisitPrice?: number | string | null;
  visitPrice?: number | string | null;
  languages?: unknown;
  galleryImages?: unknown;
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

function toCompanionItem(item: RawCompanionItem): CompanionItem {
  const name = toSafeText(item.displayName || item.name, "Verified Companion");
  const rating = typeof item.rating === "number" && Number.isFinite(item.rating) ? item.rating : 0;
  const videoPrice = item.videoPrice == null ? undefined : toNumber(item.videoPrice, 0);
  const visitPrice = item.homeVisitPrice == null && item.visitPrice == null
    ? undefined
    : toNumber(item.homeVisitPrice ?? item.visitPrice, 0);

  return {
    id: String(item.id || name.toLowerCase().replace(/\s+/g, "-")),
    name,
    tagline: toSafeText(item.tagline, "Calm, respectful conversations"),
    category: toSafeText(item.category, "Communication & Emotional Support"),
    rating,
    experience: toSafeText(item.experience, "Verified companion"),
    image: item.image || undefined,
    online: Boolean(item.isOnline ?? item.online),
    isBusy: Boolean(item.isBusy),
    effectiveStatus:
      item.effectiveStatus === "BUSY" || item.effectiveStatus === "OFFLINE" || item.effectiveStatus === "ONLINE"
        ? item.effectiveStatus
        : undefined,
    languages: normalizeStringArray(item.languages),
    galleryImages: normalizeStringArray(item.galleryImages),
    chatPrice: toNumber(item.chatPrice, 0),
    voicePrice: toNumber(item.audioPrice ?? item.voicePrice, 0),
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
    return {
      data: [],
      error: { ...result.error, message: "Companions are currently unavailable. Please try again later." },
    };
  }
  return { data: (result.data?.companions ?? []).map(toCompanionItem), error: null };
}

export async function getCompanionById(id: string) {
  const result = await apiRequest<{ companion: RawCompanionItem }>(`/api/companions/${id}`);
  if (result.error) {
    return {
      data: null,
      error: { ...result.error, message: "Companions are currently unavailable. Please try again later." },
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
