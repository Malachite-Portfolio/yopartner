import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse } from "@/lib/server/http";
import { requireFirebaseUser } from "@/lib/server/auth";
import { getPartnerCompanion } from "@/lib/server/partner";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const companion = await getPartnerCompanion(prisma, auth.user);
  if (!companion) {
    return NextResponse.json({
      approved: false,
      message: "Your dashboard will appear after your account is approved.",
    });
  }

  const [bookings, liveSessions] = await Promise.all([
    prisma.booking.count({
      where: { companionId: companion.id },
    }),
    prisma.session.count({
      where: { companionId: companion.id, status: "live" },
    }),
  ]);

  return NextResponse.json({
    approved: companion.status === "active",
    companion: {
      id: companion.id,
      name: companion.name,
      status: companion.status,
      availability: companion.availability,
      rating: companion.rating,
    },
    stats: {
      totalBookings: bookings,
      liveSessions,
      totalSessions: companion.totalSessions,
      totalEarnings: companion.totalEarnings,
    },
  });
}
