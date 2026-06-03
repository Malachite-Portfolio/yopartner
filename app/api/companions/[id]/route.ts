import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse } from "@/lib/server/http";
import { AUDIO_RATE_PER_MIN, CHAT_RATE_PER_MIN, VIDEO_RATE_PER_MIN } from "@/lib/platformPricing";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return notImplementedResponse();
  }

  const { id } = await context.params;
  const companion = await prisma.companion.findUnique({ where: { id } });
  if (!companion) {
    return NextResponse.json({ error: "NOT_FOUND", message: "Partner not found." }, { status: 404 });
  }

  return NextResponse.json({
    companion: {
      id: companion.id,
      name: companion.name,
      tagline: companion.tagline ?? "",
      category: companion.category ?? "Partner Support",
      rating: companion.rating,
      experience: "Verified partner",
      image: undefined,
      online: companion.availability === "online",
      chatPrice: CHAT_RATE_PER_MIN,
      voicePrice: AUDIO_RATE_PER_MIN,
      videoPrice: companion.videoPrice > 0 ? VIDEO_RATE_PER_MIN : undefined,
      servicesOffered: companion.servicesOffered,
    },
  });
}
