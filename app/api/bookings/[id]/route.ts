import { NextResponse } from "next/server";
import { notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { getPrismaClient } from "@/lib/server/prisma";
import { requireFirebaseUser } from "@/lib/server/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const booking = await prisma.booking.findFirst({
    where: { id, userId: auth.user.id },
    include: { companion: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "NOT_FOUND", message: "Booking not found." }, { status: 404 });
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      bookingId: booking.bookingId,
      companionName: booking.companion?.name ?? "Companion",
      serviceType: booking.serviceType,
      amount: booking.amount,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const body = await parseJsonBody<{ action?: "cancel" }>(request);
  if (body?.action !== "cancel") {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Unsupported action." }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({ where: { id, userId: auth.user.id } });
  if (!booking) {
    return NextResponse.json({ error: "NOT_FOUND", message: "Booking not found." }, { status: 404 });
  }

  await prisma.booking.update({ where: { id }, data: { status: "cancelled" } });
  return NextResponse.json({ success: true });
}
