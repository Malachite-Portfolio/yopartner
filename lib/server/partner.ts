import type { Companion, PrismaClient, User } from "@prisma/client";
import {
  AUDIO_RATE_PER_MIN,
  CHAT_RATE_PER_MIN,
  HOME_VISIT_RATE_PER_HOUR,
  VIDEO_RATE_PER_MIN,
} from "@/lib/platformPricing";

export async function getPartnerCompanion(prisma: PrismaClient, user: User) {
  return prisma.companion.findUnique({
    where: { id: user.firebaseUid },
  });
}

export function mapStatus(input: string | undefined, fallback: string) {
  if (!input) return fallback;
  return input.toLowerCase().replace(/\s+/g, "_");
}

export function toArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function companionFromApplicationPayload(
  payload: Record<string, unknown>,
  defaults: { id: string; name: string; phone?: string | null },
): Pick<
  Companion,
  | "id"
  | "name"
  | "phone"
  | "city"
  | "tagline"
  | "category"
  | "chatPrice"
  | "voicePrice"
  | "videoPrice"
  | "visitPrice"
  | "languages"
  | "servicesOffered"
  | "status"
  | "availability"
  | "verificationStatus"
> {
  const servicesOffered = toArray(payload.servicesOffered);
  const offersVideo = servicesOffered.some((service) => service.toLowerCase().includes("video"));
  const offersHomeVisit = servicesOffered.some((service) => service.toLowerCase().includes("home"));
  return {
    id: defaults.id,
    name: String(payload.fullName ?? defaults.name),
    phone: defaults.phone ?? null,
    city: payload.bornCity ? String(payload.bornCity) : null,
    tagline: payload.profileTagline ? String(payload.profileTagline) : null,
    category: Array.isArray(payload.categories) ? String(payload.categories[0] ?? "Partner Support") : "Partner Support",
    chatPrice: CHAT_RATE_PER_MIN,
    voicePrice: AUDIO_RATE_PER_MIN,
    videoPrice: offersVideo ? VIDEO_RATE_PER_MIN : 0,
    visitPrice: offersHomeVisit ? HOME_VISIT_RATE_PER_HOUR : 0,
    languages: toArray(payload.languagesKnown),
    servicesOffered,
    status: "under_review",
    availability: "offline",
    verificationStatus: "pending",
  };
}
