import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse } from "@/lib/server/http";
import { requireAdminUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireAdminUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  }

  const [
    totalUsers,
    activeCompanions,
    pendingApplications,
    liveSessions,
    totalBookings,
    openSupportTickets,
    pendingPayouts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.companion.count({ where: { status: "active" } }),
    prisma.partnerApplication.count({ where: { status: "under_review" } }),
    prisma.session.count({ where: { status: "live" } }),
    prisma.booking.count(),
    prisma.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    prisma.payout.count({ where: { status: { in: ["requested", "approved"] } } }),
  ]);

  return NextResponse.json({
    stats: {
      totalUsers,
      activeCompanions,
      pendingApplications,
      liveSessions,
      totalBookings,
      pendingPayouts,
      openSupportTickets,
    },
  });
}
