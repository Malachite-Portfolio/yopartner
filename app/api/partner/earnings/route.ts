import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse } from "@/lib/server/http";
import { requireFirebaseUser } from "@/lib/server/auth";
import { getPartnerCompanion } from "@/lib/server/partner";

export const runtime = "nodejs";

type PartnerEarningSession = {
  amount: number;
  companionEarning: number;
  id: string;
  platformFee: number;
  startedAt: Date;
  type: string;
  user?: { phone?: string | null } | null;
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
    return NextResponse.json({ earnings: [] });
  }

  const sessions = await prisma.session.findMany({
    where: { companionId: companion.id, status: "completed" },
    include: { user: true },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json({
    earnings: sessions.map((row: PartnerEarningSession) => ({
      id: row.id,
      date: row.startedAt.toISOString(),
      session: row.type,
      user: row.user?.phone ?? null,
      amount: row.amount,
      platformFee: row.platformFee,
      netEarning: row.companionEarning,
      status: "Credited",
    })),
  });
}
