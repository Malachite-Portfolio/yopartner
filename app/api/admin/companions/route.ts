import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { requireAdminUser } from "@/lib/server/auth";

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
  return NextResponse.json({ companions });
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
    return NextResponse.json({ error: "BAD_REQUEST", message: "Companion id is required." }, { status: 400 });
  }

  const companion = await prisma.companion.update({
    where: { id: String(body.id) },
    data: {
      ...(body.name ? { name: String(body.name) } : {}),
      ...(body.city ? { city: String(body.city) } : {}),
      ...(body.category ? { category: String(body.category) } : {}),
      ...(body.status ? { status: String(body.status) } : {}),
      ...(body.verificationStatus ? { verificationStatus: String(body.verificationStatus) } : {}),
      ...(body.availability ? { availability: String(body.availability) } : {}),
      ...(typeof body.chatPrice === "number" ? { chatPrice: Number(body.chatPrice) } : {}),
      ...(typeof body.voicePrice === "number" ? { voicePrice: Number(body.voicePrice) } : {}),
      ...(typeof body.videoPrice === "number" ? { videoPrice: Number(body.videoPrice) } : {}),
      ...(typeof body.visitPrice === "number" ? { visitPrice: Number(body.visitPrice) } : {}),
      ...(Array.isArray(body.languages) ? { languages: body.languages.map((value) => String(value)) } : {}),
      ...(Array.isArray(body.servicesOffered)
        ? { servicesOffered: body.servicesOffered.map((value) => String(value)) }
        : {}),
    },
  });

  return NextResponse.json({ companion });
}
