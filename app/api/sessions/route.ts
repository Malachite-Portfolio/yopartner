import { NextResponse } from "next/server";
import { createCode, notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { getPrismaClient } from "@/lib/server/prisma";
import { requireFirebaseUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const sessions = await prisma.session.findMany({
    where: { userId: auth.user.id },
    include: { companion: true },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json({
    sessions: sessions.map((item) => ({
      id: item.id,
      sessionId: item.sessionId,
      companionId: item.companionId,
      companionName: item.companion?.name ?? "Companion",
      type: item.type,
      status: item.status,
      startedAt: item.startedAt.toISOString(),
      endedAt: item.endedAt?.toISOString() ?? null,
      durationSec: item.durationSec,
      amount: item.amount,
    })),
  });
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const body = await parseJsonBody<{
    companionId?: string;
    type?: "chat" | "audio" | "video";
    bookingId?: string;
  }>(request);
  if (!body?.companionId || !body?.type) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "companionId and type are required." },
      { status: 400 },
    );
  }

  const session = await prisma.session.create({
    data: {
      sessionId: createCode("SES"),
      userId: auth.user.id,
      companionId: body.companionId,
      type: body.type,
      status: "live",
      bookingId: body.bookingId ?? null,
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
