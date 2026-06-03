import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse } from "@/lib/server/http";
import { AUDIO_RATE_PER_MIN, CHAT_RATE_PER_MIN, VIDEO_RATE_PER_MIN } from "@/lib/platformPricing";

export const runtime = "nodejs";

type FeaturedCompanionItem = {
  availability: string;
  category?: string | null;
  id: string;
  name: string;
  rating: number;
  servicesOffered: string[];
  tagline?: string | null;
  videoPrice: number;
};

export async function GET() {
  const prisma = getPrismaClient();
  if (!prisma) {
    return notImplementedResponse();
  }

  const companions = await prisma.companion.findMany({
    where: { status: "active" },
    orderBy: [{ rating: "desc" }, { totalSessions: "desc" }],
    take: 6,
  });

  return NextResponse.json({
    companions: companions.map((item: FeaturedCompanionItem) => ({
      id: item.id,
      name: item.name,
      tagline: item.tagline ?? "",
      category: item.category ?? "Partner Support",
      rating: item.rating,
      experience: "Verified partner",
      image: undefined,
      online: item.availability === "online",
      chatPrice: CHAT_RATE_PER_MIN,
      voicePrice: AUDIO_RATE_PER_MIN,
      videoPrice: item.videoPrice > 0 ? VIDEO_RATE_PER_MIN : undefined,
      servicesOffered: item.servicesOffered,
    })),
  });
}
