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

  const transactions = await prisma.walletTransaction.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ transactions });
}
