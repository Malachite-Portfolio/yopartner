import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse } from "@/lib/server/http";
import { requireFirebaseUser } from "@/lib/server/auth";
import { getPartnerCompanion } from "@/lib/server/partner";

export const runtime = "nodejs";

type PartnerChatSession = {
  id: string;
  startedAt: Date;
  status: string;
  user?: { phone?: string | null } | null;
  userId?: string | null;
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
    return NextResponse.json({ chats: [] });
  }

  const sessions = await prisma.session.findMany({
    where: { companionId: companion.id, type: "chat" },
    include: { user: true },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    chats: sessions.map((session: PartnerChatSession) => ({
      id: session.id,
      userId: session.userId,
      userPhone: session.user?.phone ?? null,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
    })),
  });
}
