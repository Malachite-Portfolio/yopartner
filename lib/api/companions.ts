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
  chatPrice?: number | string | null;
  voicePrice?: number | string | null;
  audioPrice?: number | string | null;
  videoPrice?: number | string | null;
  homeVisitPrice?: number | string | null;
  visitPrice?: number | string | null;
  servicesOffered?: string[] | null;
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeServiceLabel(service: string) {
  const cleaned = service.trim();
  if (cleaned.toUpperCase() === "HOME_VISIT") return "Home Visit";
  if (cleaned.toUpperCase() === "AUDIO") return "Audio Call";
  if (cleaned.toUpperCase() === "VIDEO") return "Video Call";
  if (cleaned.toUpperCase() === "CHAT") return "Chat";
  return cleaned;
}

function normalizeServices(services: string[] | null | undefined) {
  if (!Array.isArray(services) || services.length === 0) {
    return ["Chat", "Audio Call", "Video Call"];
  }
  return services.map(normalizeServiceLabel);
}

function toCompanionItem(item: RawCompanionItem): CompanionItem {
  const name = (item.displayName || item.name || "Verified Companion").trim();
  return {
    id: String(item.id || name.toLowerCase().replace(/\s+/g, "-")),
    name,
    tagline: String(item.tagline || "Verified companion"),
    category: String(item.category || "Communication & Emotional Support"),
    rating: toNumber(item.rating, 5),
    experience: String(item.experience || "Verified companion"),
    image: item.image || undefined,
    online: Boolean(item.online ?? item.isOnline ?? false),
    chatPrice: toNumber(item.chatPrice, 0),
    voicePrice: toNumber(item.voicePrice ?? item.audioPrice, 0),
    videoPrice: item.videoPrice == null ? undefined : toNumber(item.videoPrice, 0),
    visitPrice:
      item.homeVisitPrice == null && item.visitPrice == null
        ? undefined
        : toNumber(item.homeVisitPrice ?? item.visitPrice, 0),
    servicesOffered: normalizeServices(item.servicesOffered),
  };
}

export async function listCompanions(filters?: CompanionFilters) {
  const query = new URLSearchParams();
  if (filters?.search) query.set("search", filters.search);
  if (filters?.availability) query.set("availability", filters.availability);
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
