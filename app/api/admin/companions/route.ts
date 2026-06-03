import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { requireAdminUser } from "@/lib/server/auth";
import {
  AUDIO_RATE_PER_MIN,
  CHAT_RATE_PER_MIN,
  HOME_VISIT_RATE_PER_HOUR,
  VIDEO_RATE_PER_MIN,
} from "@/lib/platformPricing";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireAdminUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  }

  const companions = await prisma.companion.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json({
    companions: companions.map((companion) => ({
      ...companion,
      chatPrice: CHAT_RATE_PER_MIN,
      voicePrice: AUDIO_RATE_PER_MIN,
      videoPrice: companion.videoPrice > 0 ? VIDEO_RATE_PER_MIN : 0,
      visitPrice: companion.visitPrice > 0 ? HOME_VISIT_RATE_PER_HOUR : 0,
    })),
  });
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireAdminUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body?.id) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Partner id is required." }, { status: 400 });
  }

  const servicesOffered = Array.isArray(body.servicesOffered)
    ? body.servicesOffered.map((value) => String(value))
    : null;
  const companion = await prisma.companion.update({
    where: { id: String(body.id) },
    data: {
      ...(body.name ? { name: String(body.name) } : {}),
      ...(body.city ? { city: String(body.city) } : {}),
      ...(body.category ? { category: String(body.category) } : {}),
      ...(body.status ? { status: String(body.status) } : {}),
      ...(body.verificationStatus ? { verificationStatus: String(body.verificationStatus) } : {}),
      ...(body.availability ? { availability: String(body.availability) } : {}),
      chatPrice: CHAT_RATE_PER_MIN,
      voicePrice: AUDIO_RATE_PER_MIN,
      ...(servicesOffered
        ? {
            videoPrice: servicesOffered.some((service) => service.toLowerCase().includes("video"))
              ? VIDEO_RATE_PER_MIN
              : 0,
            visitPrice: servicesOffered.some((service) => service.toLowerCase().includes("home"))
              ? HOME_VISIT_RATE_PER_HOUR
              : 0,
          }
        : {}),
      ...(Array.isArray(body.languages) ? { languages: body.languages.map((value) => String(value)) } : {}),
      ...(servicesOffered ? { servicesOffered } : {}),
    },
  });

  return NextResponse.json({
    companion: {
      ...companion,
      chatPrice: CHAT_RATE_PER_MIN,
      voicePrice: AUDIO_RATE_PER_MIN,
      videoPrice: companion.videoPrice > 0 ? VIDEO_RATE_PER_MIN : 0,
      visitPrice: companion.visitPrice > 0 ? HOME_VISIT_RATE_PER_HOUR : 0,
    },
  });
}
