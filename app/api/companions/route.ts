import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse } from "@/lib/server/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return notImplementedResponse();
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const availability = searchParams.get("availability");
  const category = searchParams.get("category");

  const companions = await prisma.companion.findMany({
    where: {
      status: { not: "suspended" },
      ...(availability === "online" ? { availability: "online" } : {}),
      ...(category ? { category: { contains: category, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { tagline: { contains: search, mode: "insensitive" } },
              { city: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ availability: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
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

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return notImplementedResponse();
  }

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    name?: string;
    city?: string;
    category?: string;
    chatPrice?: number;
    voicePrice?: number;
    videoPrice?: number;
    servicesOffered?: string[];
    languages?: string[];
  } | null;

  if (!body?.id || !body?.name) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "id and name are required." }, { status: 400 });
  }

  const created = await prisma.companion.upsert({
    where: { id: body.id },
    update: {
      name: body.name,
      city: body.city,
      category: body.category,
      chatPrice: Math.max(0, Number(body.chatPrice ?? 0)),
      voicePrice: Math.max(0, Number(body.voicePrice ?? 0)),
      videoPrice: Math.max(0, Number(body.videoPrice ?? 0)),
      servicesOffered: Array.isArray(body.servicesOffered) ? body.servicesOffered : [],
      languages: Array.isArray(body.languages) ? body.languages : [],
    },
    create: {
      id: body.id,
      name: body.name,
      city: body.city,
      category: body.category,
      chatPrice: Math.max(0, Number(body.chatPrice ?? 0)),
      voicePrice: Math.max(0, Number(body.voicePrice ?? 0)),
      videoPrice: Math.max(0, Number(body.videoPrice ?? 0)),
      servicesOffered: Array.isArray(body.servicesOffered) ? body.servicesOffered : [],
      languages: Array.isArray(body.languages) ? body.languages : [],
      tagline: "",
    },
  });

  return NextResponse.json({ companion: created }, { status: 201 });
}
