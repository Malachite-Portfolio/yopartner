import type { Companion, PrismaClient, User } from "@prisma/client";

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
  const pricing = (payload.pricing as Record<string, unknown> | undefined) ?? {};
  return {
    id: defaults.id,
    name: String(payload.fullName ?? defaults.name),
    phone: defaults.phone ?? null,
    city: payload.bornCity ? String(payload.bornCity) : null,
    tagline: payload.profileTagline ? String(payload.profileTagline) : null,
    category: Array.isArray(payload.categories) ? String(payload.categories[0] ?? "Companionship") : "Companionship",
    chatPrice: asNumber(payload.chatPrice ?? pricing.chatPrice, 0),
    voicePrice: asNumber(payload.audioPrice ?? pricing.audioPrice, 0),
    videoPrice: asNumber(payload.videoPrice ?? pricing.videoPrice, 0),
    visitPrice: asNumber(payload.visitPrice ?? pricing.visitPrice, 0),
    languages: toArray(payload.languagesKnown),
    servicesOffered: toArray(payload.servicesOffered),
    status: "under_review",
    availability: "offline",
    verificationStatus: "pending",
  };
}
