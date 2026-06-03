import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse } from "@/lib/server/http";
import { requireFirebaseUser } from "@/lib/server/auth";
import { getPartnerCompanion } from "@/lib/server/partner";

export const runtime = "nodejs";

type PartnerBookingItem = {
  amount: number;
  bookingId: string;
  createdAt: Date;
  id: string;
  serviceType: string;
  status: string;
  user: { phone?: string | null };
};

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const companion = await getPartnerCompanion(prisma, auth.user);
  if (!companion) {
    return NextResponse.json({ bookings: [] });
  }

  const bookings = await prisma.booking.findMany({
    where: { companionId: companion.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    bookings: bookings.map((item: PartnerBookingItem) => ({
      id: item.id,
      bookingId: item.bookingId,
      userPhone: item.user.phone,
      type: item.serviceType,
      amount: item.amount,
      status: item.status,
      date: item.createdAt.toISOString(),
    })),
  });
}
