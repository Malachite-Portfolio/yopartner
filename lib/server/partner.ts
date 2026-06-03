import {
  AUDIO_RATE_PER_MIN,
  CHAT_RATE_PER_MIN,
  HOME_VISIT_RATE_PER_HOUR,
  VIDEO_RATE_PER_MIN,
} from "@/lib/platformPricing";

type PartnerUser = {
  firebaseUid: string;
};

type PartnerPrismaClient = {
  companion: {
    findUnique: (args: { where: { id: string } }) => Promise<PartnerCompanion | null>;
  };
};

type PartnerCompanion = CompanionApplicationDefaults & {
  rating: number;
  totalEarnings: number;
  totalSessions: number;
};

type CompanionApplicationDefaults = {
  availability: string;
  category: string | null;
  chatPrice: number;
  city: string | null;
  id: string;
  languages: string[];
  name: string;
  phone: string | null;
  servicesOffered: string[];
  status: string;
  tagline: string | null;
  verificationStatus: string;
  videoPrice: number;
  visitPrice: number;
  voicePrice: number;
};

export async function getPartnerCompanion(prisma: PartnerPrismaClient, user: PartnerUser) {
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
): CompanionApplicationDefaults {
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
