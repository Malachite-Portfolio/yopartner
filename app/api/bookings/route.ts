import { NextResponse } from "next/server";
import { createCode, notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { getPrismaClient } from "@/lib/server/prisma";
import { requireFirebaseUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return notImplementedResponse();
  }

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: auth.user.id },
    include: { companion: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    bookings: bookings.map((item) => ({
      id: item.id,
      bookingId: item.bookingId,
      companionName: item.companion?.name ?? "Companion",
      serviceType: item.serviceType,
      amount: item.amount,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return notImplementedResponse();
  }

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const body = await parseJsonBody<{
    companionId?: string;
    serviceType?: "chat" | "audio" | "video";
  }>(request);
  if (!body?.companionId || !body.serviceType) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "companionId and serviceType are required." },
      { status: 400 },
    );
  }

  const companion = await prisma.companion.findUnique({ where: { id: body.companionId } });
  if (!companion) {
    return NextResponse.json({ error: "NOT_FOUND", message: "Companion not found." }, { status: 404 });
  }

  const amount =
    body.serviceType === "chat"
      ? companion.chatPrice
      : body.serviceType === "audio"
        ? companion.voicePrice
        : companion.videoPrice;

  const booking = await prisma.booking.create({
    data: {
      bookingId: createCode("BK"),
      userId: auth.user.id,
      companionId: companion.id,
      serviceType: body.serviceType,
      amount,
      status: "confirmed",
    },
  });

  return NextResponse.json({
    booking: {
      id: booking.id,
      bookingId: booking.bookingId,
      companionName: companion.name,
      serviceType: booking.serviceType,
      amount: booking.amount,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    },
  });
}
