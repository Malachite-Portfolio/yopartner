import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse } from "@/lib/server/http";

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
    return NextResponse.json({ error: "NOT_FOUND", message: "Companion not found." }, { status: 404 });
  }

  return NextResponse.json({
    companion: {
      id: companion.id,
      name: companion.name,
      tagline: companion.tagline ?? "",
      category: companion.category ?? "Companionship",
      rating: companion.rating,
      experience: "Verified companion",
      image: undefined,
      online: companion.availability === "online",
      chatPrice: companion.chatPrice,
      voicePrice: companion.voicePrice,
      videoPrice: companion.videoPrice || undefined,
      servicesOffered: companion.servicesOffered,
    },
  });
}
