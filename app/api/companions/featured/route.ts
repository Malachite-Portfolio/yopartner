import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse } from "@/lib/server/http";

export const runtime = "nodejs";

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
    companions: companions.map((item) => ({
      id: item.id,
      name: item.name,
      tagline: item.tagline ?? "",
      category: item.category ?? "Companionship",
      rating: item.rating,
      experience: "Verified companion",
      image: undefined,
      online: item.availability === "online",
      chatPrice: item.chatPrice,
      voicePrice: item.voicePrice,
      videoPrice: item.videoPrice || undefined,
      servicesOffered: item.servicesOffered,
    })),
  });
}
